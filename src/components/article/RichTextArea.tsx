import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * RichTextArea — editor isi artikel (WYSIWYG ringan, tanpa library UI baru).
 *
 * Yang dilihat admin = yang tersimpan:
 *   - Enter            -> baris baru (langsung di bawahnya, tanpa jarak ekstra)
 *   - Enter 2x         -> baris kosong = pemisah paragraf di halaman artikel
 *   - Shift+Enter      -> sama seperti Enter (baris baru)
 *   - Tombol Bullet    -> <ul> sungguhan; berlaku untuk SEMUA baris yang diblok
 *   - Tombol Nomor     -> <ol> sungguhan (1. 2. 3. otomatis naik)
 *   - Enter di list    -> lanjut item berikutnya (bawaan browser)
 *   - Enter di item kosong -> keluar dari list (bawaan browser)
 *   - Rata kiri / kanan-kiri / kanan -> perataan satu kartu teks (prop `align`)
 *
 * Tombol Bullet/Nomor mengubah blok lewat manipulasi DOM langsung (bukan
 * document.execCommand yang menghasilkan <ul> tersarang di dalam <p>).
 *
 * Format penyimpanan TIDAK berubah: tetap teks biasa dengan penanda
 * ("• item", "1. item"; satu baris per Enter, baris kosong = paragraf baru).
 * Perataan disimpan terpisah di properti `align` blok. Jadi DB, API, dan
 * halaman publik tetap kompatibel.
 */

const BULLET_RE = /^\s*[-•*]\s+(.*)$/;
const NUMBER_RE = /^\s*(\d+)[.)]\s+(.*)$/;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Teks ber-penanda -> HTML untuk editor. Satu baris = satu <p> (tanpa jarak
 * ekstra); baris kosong jadi <p><br></p> (baris kosong yang terlihat); baris
 * berpenanda yang berurutan digabung jadi satu <ul>/<ol>.
 */
export function markerTextToHtml(text: string): string {
  const lines = (text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/^\n+|\n+$/g, '')
    .split('\n');
  let html = '';
  let open: 'ul' | 'ol' | null = null;
  const close = () => {
    if (open) html += `</${open}>`;
    open = null;
  };

  for (const raw of lines) {
    const b = BULLET_RE.exec(raw);
    const n = b ? null : NUMBER_RE.exec(raw);
    if (b || n) {
      const kind = b ? 'ul' : 'ol';
      if (open !== kind) {
        close();
        html += `<${kind}>`;
        open = kind;
      }
      html += `<li>${esc((b ? b[1] : (n as RegExpExecArray)[2]).trim())}</li>`;
      continue;
    }
    close();
    const t = raw.trim();
    html += t ? `<p>${esc(t)}</p>` : '<p><br></p>';
  }
  close();
  return html || '<p><br></p>';
}

function inlineText(node: Node): string {
  let out = '';
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) out += child.textContent || '';
    else if (child.nodeName === 'BR') out += '\n';
    else out += inlineText(child);
  });
  return out;
}

/** Tag yang dianggap satu baris/paragraf di editor. */
const LINE_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE']);

/**
 * Isi editor (DOM) -> teks ber-penanda (format simpan lama).
 * Satu <p>/<div> = satu baris; baris kosong tetap baris kosong (pemisah
 * paragraf); <ul>/<ol> jadi baris "• x" / "1. x".
 */
export function htmlToMarkerText(root: HTMLElement): string {
  const lines: string[] = [];
  let buf = '';
  let hasBuf = false;
  const flush = () => {
    if (hasBuf) lines.push(buf.replace(/\u00a0/g, ' ').trim());
    buf = '';
    hasBuf = false;
  };

  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName;

      if (tag === 'UL' || tag === 'OL') {
        flush();
        let n = 0;
        Array.from(el.children).forEach((li) => {
          if (li.tagName !== 'LI') return;
          const t = inlineText(li).replace(/\u00a0/g, ' ').replace(/\s*\n\s*/g, ' ').trim();
          if (!t) return;
          n += 1;
          lines.push(tag === 'UL' ? `• ${t}` : `${n}. ${t}`);
        });
        return;
      }

      if (LINE_TAGS.has(tag)) {
        flush();
        // <br> penutup hanyalah penanda baris kosong milik browser.
        const t = inlineText(el).replace(/\u00a0/g, ' ').replace(/\n+$/g, '');
        t.split('\n').forEach((l) => lines.push(l.trim()));
        return;
      }

      if (tag === 'BR') {
        buf = buf.replace(/\u00a0/g, ' ').trim();
        lines.push(buf);
        buf = '';
        hasBuf = false;
        return;
      }
    }
    // Teks / elemen inline yang menempel langsung di editor (tanpa <p>).
    const piece = node.nodeType === Node.TEXT_NODE ? node.textContent || '' : inlineText(node);
    if (!piece.trim() && !hasBuf) return;
    buf += piece;
    hasBuf = true;
  });
  flush();

  return lines.join('\n').replace(/^\n+|\n+$/g, '');
}

/**
 * Chrome membuat <div> (bukan <p>) untuk baris baru setelah keluar dari list.
 * Samakan jadi <p> supaya struktur editor konsisten.
 */
function normalizeBlocks(root: HTMLElement) {
  Array.from(root.children).forEach((child) => {
    if (child.tagName === 'DIV') {
      const p = document.createElement('p');
      while (child.firstChild) p.appendChild(child.firstChild);
      child.replaceWith(p);
    }
  });
}

const BLOCK_TAGS = ['P', 'DIV', 'LI'];

/** Elemen blok (p/div/li) tempat kursor berada. */
function blockAtCaret(root: HTMLElement): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  let node: Node | null = sel.getRangeAt(0).startContainer;
  while (node && node !== root) {
    if (node.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.includes((node as HTMLElement).tagName)) {
      return node as HTMLElement;
    }
    node = node.parentNode;
  }
  return null;
}

const isBlockNode = (n: Node) =>
  n.nodeType === Node.ELEMENT_NODE && /^(P|DIV|UL|OL|H[1-6]|BLOCKQUOTE|PRE)$/.test((n as HTMLElement).tagName);

/** Teks/elemen inline yang menempel langsung di editor dibungkus <p>. */
function wrapLoose(root: HTMLElement) {
  let run: ChildNode[] = [];
  const flush = () => {
    if (!run.length) return;
    const p = document.createElement('p');
    root.insertBefore(p, run[0]);
    run.forEach((n) => p.appendChild(n));
    run = [];
  };
  Array.from(root.childNodes).forEach((n) => {
    if (isBlockNode(n)) flush();
    else run.push(n as ChildNode);
  });
  flush();
}

/** Satu "baris" = satu <p>/<div> tingkat atas, atau satu <li>. */
function lineUnits(root: HTMLElement): HTMLElement[] {
  const units: HTMLElement[] = [];
  Array.from(root.children).forEach((c) => {
    if (c.tagName === 'UL' || c.tagName === 'OL') {
      Array.from(c.children).forEach((li) => {
        if (li.tagName === 'LI') units.push(li as HTMLElement);
      });
    } else {
      units.push(c as HTMLElement);
    }
  });
  return units;
}

/** Keluarkan <li> dari list-nya jadi <p>; list dipecah bila li di tengah. */
function liToPara(li: HTMLElement): HTMLElement {
  const list = li.parentElement as HTMLElement;
  const siblings = Array.from(list.children);
  const rest = siblings.slice(siblings.indexOf(li) + 1);
  let tail: HTMLElement | null = null;
  if (rest.length) {
    tail = document.createElement(list.tagName.toLowerCase());
    rest.forEach((r) => (tail as HTMLElement).appendChild(r));
  }
  const p = document.createElement('p');
  while (li.firstChild) p.appendChild(li.firstChild);
  if (!p.firstChild) p.appendChild(document.createElement('br'));
  li.remove();
  list.after(p);
  if (tail) p.after(tail);
  if (!list.children.length) list.remove();
  return p;
}

/** Gabungkan <ul>/<ol> bertetangga yang sejenis jadi satu list. */
function mergeAdjacentLists(root: HTMLElement) {
  Array.from(root.children).forEach((c) => {
    const prev = c.previousElementSibling;
    if ((c.tagName === 'UL' || c.tagName === 'OL') && prev && prev.tagName === c.tagName) {
      while (c.firstChild) prev.appendChild(c.firstChild);
      c.remove();
    }
  });
}

interface RichTextAreaProps {
  /** Teks ber-penanda (format simpan yang sudah ada). */
  value: string;
  /** Id blok — memaksa editor memuat ulang saat berpindah kartu. */
  docKey?: string;
  onChange: (text: string) => void;
  placeholder?: string;
  /** Perataan teks satu kartu (default: kiri). */
  align?: TextAlign;
  onAlignChange?: (align: TextAlign) => void;
}

export type TextAlign = 'left' | 'right' | 'justify';

const TOOL_BASE =
  'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-bold text-[11px] transition-all cursor-pointer';
const TOOL_ON = 'bg-[#2E7D32] border-[#2E7D32] text-white';
const TOOL_OFF = 'bg-[#FFFFFF] border-[#E0E0E0] text-[#1B5E20] hover:bg-[#E8F5E9]';

const ALIGN_OPTIONS: Array<{ value: TextAlign; icon: string; title: string }> = [
  { value: 'left', icon: 'format_align_left', title: 'Rata kiri' },
  { value: 'justify', icon: 'format_align_justify', title: 'Rata kanan-kiri' },
  { value: 'right', icon: 'format_align_right', title: 'Rata kanan' },
];

export const RichTextArea: React.FC<RichTextAreaProps> = ({
  value,
  docKey,
  onChange,
  placeholder,
  align = 'left',
  onAlignChange,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastEmitted = useRef<string>('\u0000');
  const lastKey = useRef<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(!value.trim());
  const [fmt, setFmt] = useState<{ ul: boolean; ol: boolean }>({ ul: false, ol: false });

  // Muat isi: saat blok berganti (docKey) selalu muat ulang; saat nilainya
  // berubah dari luar (mis. setelah simpan) muat hanya kalau editor tidak
  // sedang difokuskan — supaya kursor tidak melompat saat mengetik.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const keyChanged = docKey !== lastKey.current;
    if (keyChanged) {
      el.innerHTML = markerTextToHtml(value);
      lastKey.current = docKey ?? null;
      lastEmitted.current = value;
      setIsEmpty(!value.trim());
      return;
    }
    if (value === lastEmitted.current) return;
    if (document.activeElement === el) return;
    el.innerHTML = markerTextToHtml(value);
    lastEmitted.current = value;
    setIsEmpty(!value.trim());
  }, [value, docKey]);

  const emit = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const text = htmlToMarkerText(el);
    lastEmitted.current = text;
    setIsEmpty(!text.trim());
    onChange(text);
  }, [onChange]);

  const syncFormat = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) return;
    const block = blockAtCaret(el);
    const list = block && block.tagName === 'LI' ? block.parentElement : null;
    setFmt({ ul: list?.tagName === 'UL', ol: list?.tagName === 'OL' });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', syncFormat);
    return () => document.removeEventListener('selectionchange', syncFormat);
  }, [syncFormat]);

  /**
   * Tombol toolbar: semua baris yang diblok (atau baris tempat kursor) jadi
   * list; kalau semuanya sudah list sejenis, dikembalikan jadi paragraf.
   * Bullet <-> nomor saling menggantikan.
   */
  const toggleList = (kind: 'ul' | 'ol') => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();

    const sel = window.getSelection();
    if (!sel) return;

    // Simpan titik seleksi sebagai node + offset (Range hidup ikut berubah
    // saat DOM dimanipulasi). Titik di editor langsung diganti ke anak-nya.
    const resolve = (node: Node, offset: number): [Node, number] => {
      if (node !== el) return [node, offset];
      const child = el.childNodes[Math.min(offset, el.childNodes.length - 1)];
      if (!child) return [el, 0];
      return [child, offset >= el.childNodes.length ? (child.nodeType === Node.TEXT_NODE ? (child.textContent || '').length : child.childNodes.length) : 0];
    };

    let saved: { sn: Node; so: number; en: Node; eo: number } | null = null;
    if (sel.rangeCount && el.contains(sel.anchorNode)) {
      const r = sel.getRangeAt(0);
      const [sn, so] = resolve(r.startContainer, r.startOffset);
      const [en, eo] = resolve(r.endContainer, r.endOffset);
      saved = { sn, so, en, eo };
    }

    wrapLoose(el);
    if (!el.children.length) {
      el.innerHTML = '<p><br></p>';
      saved = null;
    }

    const all = lineUnits(el);
    let picked = all;
    if (saved) {
      const range = document.createRange();
      range.setStart(saved.sn, saved.so);
      range.setEnd(saved.en, saved.eo);
      const collapsed = range.collapsed;
      picked = all.filter((u) => {
        const ur = document.createRange();
        ur.selectNodeContents(u);
        const endVsStart = ur.compareBoundaryPoints(Range.START_TO_END, range);
        const startVsEnd = ur.compareBoundaryPoints(Range.END_TO_START, range);
        return collapsed ? endVsStart >= 0 && startVsEnd <= 0 : endVsStart > 0 && startVsEnd < 0;
      });
    }
    if (!picked.length) picked = [all[all.length - 1]];

    const allOfKind = picked.every(
      (u) => u.tagName === 'LI' && (u.parentElement as HTMLElement).tagName.toLowerCase() === kind,
    );

    let results: HTMLElement[];
    if (allOfKind) {
      results = picked.map(liToPara);
    } else {
      results = picked.map((u) => {
        let para: HTMLElement = u;
        if (u.tagName === 'LI') {
          if ((u.parentElement as HTMLElement).tagName.toLowerCase() === kind) return u;
          para = liToPara(u);
        }
        const list = document.createElement(kind);
        const li = document.createElement('li');
        while (para.firstChild) li.appendChild(para.firstChild);
        if (!li.firstChild) li.appendChild(document.createElement('br'));
        list.appendChild(li);
        para.replaceWith(list);
        return li;
      });
      mergeAdjacentLists(el);
    }

    // Pulihkan seleksi: titik asli kalau masih ada, kalau tidak seluruh baris terpilih.
    const range = document.createRange();
    if (saved && el.contains(saved.sn) && el.contains(saved.en)) {
      range.setStart(saved.sn, saved.so);
      range.setEnd(saved.en, saved.eo);
    } else {
      const first = results[0];
      const last = results[results.length - 1];
      range.setStart(first, 0);
      range.setEnd(last, last.childNodes.length);
      if (results.length === 1) range.collapse(false);
    }
    sel.removeAllRanges();
    sel.addRange(range);

    emit();
    syncFormat();
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          // Jangan ambil fokus dari editor — kalau fokus pindah, posisi kursor
          // hilang dan list dibuat di tempat yang salah.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggleList('ul')}
          title="Bullet list"
          aria-pressed={fmt.ul}
          className={`${TOOL_BASE} ${fmt.ul ? TOOL_ON : TOOL_OFF}`}
        >
          <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
          Bullet
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggleList('ol')}
          title="Daftar bernomor"
          aria-pressed={fmt.ol}
          className={`${TOOL_BASE} ${fmt.ol ? TOOL_ON : TOOL_OFF}`}
        >
          <span className="material-symbols-outlined text-sm">format_list_numbered</span>
          Nomor
        </button>

        <span className="w-px h-5 bg-[#E0E0E0] mx-0.5" aria-hidden="true" />

        {ALIGN_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onAlignChange?.(opt.value)}
            title={opt.title}
            aria-label={opt.title}
            aria-pressed={align === opt.value}
            className={`${TOOL_BASE} px-2 ${align === opt.value ? TOOL_ON : TOOL_OFF}`}
          >
            <span className="material-symbols-outlined text-sm">{opt.icon}</span>
          </button>
        ))}

        <span className="text-[10px] text-[#555555] font-medium ml-auto">
          Enter = baris baru · Enter 2x = paragraf baru
        </span>
      </div>

      {/* Area tulis: Enter = baris baru tepat di bawahnya (tanpa jarak ekstra) */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Isi artikel"
          style={{ textAlign: align }}
          onFocus={() => {
            // Baris baru berupa <p> (bukan <div>) supaya struktur seragam.
            try {
              document.execCommand('defaultParagraphSeparator', false, 'p');
            } catch {
              /* tidak didukung — normalizeBlocks merapikan saat blur */
            }
          }}
          onInput={emit}
          onBlur={() => {
            // Rapikan <div> sisa Chrome jadi <p> setelah admin selesai mengetik
            // (jangan saat mengetik — kursor bisa melompat).
            const el = editorRef.current;
            if (el) normalizeBlocks(el);
            emit();
          }}
          onKeyUp={syncFormat}
          onMouseUp={syncFormat}
          className="w-full min-h-[132px] bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none leading-relaxed font-medium
            [&_p]:m-0 [&_div]:m-0
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:m-0
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:m-0
            [&_li]:leading-relaxed [&_li]:pl-1
            [&_ul]:marker:text-[#2E7D32] [&_ol]:marker:text-[#2E7D32]"
        />
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 p-3.5 text-xs sm:text-sm text-[#9AA396] font-medium leading-relaxed">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};
