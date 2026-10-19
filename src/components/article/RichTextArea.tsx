import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * RichTextArea — editor isi artikel (WYSIWYG ringan, tanpa library UI baru).
 *
 * Yang dilihat admin = yang tersimpan:
 *   - Enter            -> paragraf baru (ada jarak bawah)
 *   - Shift+Enter      -> baris baru dalam paragraf yang sama
 *   - Tombol Bullet    -> <ul> sungguhan (titik + indentasi)
 *   - Tombol Nomor     -> <ol> sungguhan (1. 2. 3. otomatis naik)
 *   - Enter di list    -> lanjut item berikutnya (bawaan browser)
 *   - Enter di item kosong -> keluar dari list (bawaan browser)
 *
 * Perilaku Enter sengaja TIDAK di-intercept — Chrome/Firefox sudah benar.
 * Tombol Bullet/Nomor mengubah blok lewat manipulasi DOM langsung (bukan
 * document.execCommand yang menghasilkan <ul> tersarang di dalam <p>).
 *
 * Format penyimpanan TIDAK berubah: tetap teks biasa dengan penanda
 * ("• item", "1. item", baris kosong = paragraf baru). Jadi DB, API, dan
 * halaman publik tetap kompatibel.
 */

const BULLET_RE = /^\s*[-•*]\s+(.*)$/;
const NUMBER_RE = /^\s*(\d+)[.)]\s+(.*)$/;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

type Seg =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] };

/** Teks ber-penanda -> daftar segmen (paragraf / bullet / nomor). */
function parseMarker(text: string): Seg[] {
  const out: Seg[] = [];
  let forceNew = false;

  for (const line of (text || '').replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim()) {
      forceNew = true;
      continue;
    }
    const b = BULLET_RE.exec(line);
    const n = b ? null : NUMBER_RE.exec(line);
    const kind: 'p' | 'ul' | 'ol' = b ? 'ul' : n ? 'ol' : 'p';
    const val = b ? b[1].trim() : n ? n[2].trim() : line.trim();
    const last = out[out.length - 1];
    const merge = !forceNew && !!last && last.kind === kind;
    forceNew = false;

    if (kind === 'p') {
      if (merge && last && last.kind === 'p') last.lines.push(val);
      else out.push({ kind: 'p', lines: [val] });
    } else if (kind === 'ul') {
      if (merge && last && last.kind === 'ul') last.items.push(val);
      else out.push({ kind: 'ul', items: [val] });
    } else if (merge && last && last.kind === 'ol') {
      last.items.push(val);
    } else {
      out.push({ kind: 'ol', items: [val] });
    }
  }
  return out;
}

/** Teks ber-penanda -> HTML untuk editor. */
export function markerTextToHtml(text: string): string {
  const html = parseMarker(text)
    .map((seg) => {
      if (seg.kind === 'p') return `<p>${seg.lines.map(esc).join('<br>')}</p>`;
      if (seg.kind === 'ul') {
        return `<ul>${seg.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
      }
      return `<ol>${seg.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ol>`;
    })
    .join('');
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

/** Isi editor (DOM) -> teks ber-penanda (format simpan lama). */
export function htmlToMarkerText(root: HTMLElement): string {
  const blocks: string[] = [];

  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent || '').replace(/\u00a0/g, ' ');
      if (t.trim()) blocks.push(t.trim());
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === 'ul' || tag === 'ol') {
      const items: string[] = [];
      Array.from(el.children).forEach((li, i) => {
        if (li.tagName.toLowerCase() !== 'li') return;
        const t = inlineText(li).replace(/\u00a0/g, ' ').trim();
        items.push(tag === 'ul' ? `• ${t}` : `${i + 1}. ${t}`);
      });
      if (items.length) blocks.push(items.join('\n'));
      return;
    }

    const t = inlineText(el).replace(/\u00a0/g, ' ').replace(/[ \t]+$/g, '');
    if (t.trim()) blocks.push(t);
  });

  return blocks
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');
}

/**
 * Chrome membuat <div> (bukan <p>) untuk baris baru setelah keluar dari list.
 * Samakan jadi <p> supaya jarak antar paragraf konsisten di editor.
 */
function normalizeBlocks(root: HTMLElement) {
  Array.from(root.children).forEach((child) => {
    if (child.tagName === 'DIV') {
      const p = document.createElement('p');
      p.innerHTML = child.innerHTML;
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

function caretToEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

function makePara(html: string) {
  const p = document.createElement('p');
  p.innerHTML = html || '<br>';
  return p;
}

interface RichTextAreaProps {
  /** Teks ber-penanda (format simpan yang sudah ada). */
  value: string;
  /** Id blok — memaksa editor memuat ulang saat berpindah kartu. */
  docKey?: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export const RichTextArea: React.FC<RichTextAreaProps> = ({
  value,
  docKey,
  onChange,
  placeholder,
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
    const block = blockAtCaret(el);
    const list = block && block.tagName === 'LI' ? block.parentElement : null;
    setFmt({ ul: list?.tagName === 'UL', ol: list?.tagName === 'OL' });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', syncFormat);
    return () => document.removeEventListener('selectionchange', syncFormat);
  }, [syncFormat]);

  /** Tombol toolbar: ubah blok jadi list, atau balikkan list jadi paragraf. */
  const toggleList = (kind: 'ul' | 'ol') => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();

    // Editor kosong → siapkan satu paragraf supaya ada tempat kursor.
    if (!el.querySelector('p,div,ul,ol,li')) {
      el.innerHTML = '<p><br></p>';
      caretToEnd(el.querySelector('p') as HTMLElement);
    }

    const block = blockAtCaret(el);

    // --- Sudah di dalam list ---
    if (block && block.tagName === 'LI') {
      const list = block.parentElement as HTMLElement;
      if (list.tagName.toLowerCase() === kind) {
        // Toggle off: semua item jadi paragraf
        const frag = document.createDocumentFragment();
        Array.from(list.children).forEach((li) => {
          frag.appendChild(makePara((li as HTMLElement).innerHTML));
        });
        list.replaceWith(frag);
        const last = frag.lastChild as HTMLElement | null;
        if (last) caretToEnd(last);
      } else {
        // Ganti jenis list (bullet <-> nomor)
        const replacement = document.createElement(kind);
        while (list.firstChild) replacement.appendChild(list.firstChild);
        list.replaceWith(replacement);
        const first = replacement.querySelector('li');
        if (first) caretToEnd(first as HTMLElement);
      }
      emit();
      syncFormat();
      return;
    }

    // --- Blok paragraf -> jadikan list satu item ---
    const target = block && block.tagName !== 'LI' ? block : null;
    const list = document.createElement(kind);
    const li = document.createElement('li');
    li.innerHTML = target ? target.innerHTML : '<br>';

    if (target) {
      list.appendChild(li);
      target.replaceWith(list);
    } else {
      list.appendChild(li);
      el.appendChild(list);
    }
    caretToEnd(li);
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
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-bold text-[11px] transition-all cursor-pointer ${
            fmt.ul
              ? 'bg-[#2E7D32] border-[#2E7D32] text-white'
              : 'bg-[#FFFFFF] border-[#E0E0E0] text-[#1B5E20] hover:bg-[#E8F5E9]'
          }`}
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
          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-bold text-[11px] transition-all cursor-pointer ${
            fmt.ol
              ? 'bg-[#2E7D32] border-[#2E7D32] text-white'
              : 'bg-[#FFFFFF] border-[#E0E0E0] text-[#1B5E20] hover:bg-[#E8F5E9]'
          }`}
        >
          <span className="material-symbols-outlined text-sm">format_list_numbered</span>
          Nomor
        </button>
        <span className="text-[10px] text-[#555555] font-medium ml-auto">
          Enter = paragraf baru · Shift+Enter = baris baru
        </span>
      </div>

      {/* Area tulis: list & jarak paragraf tampil sungguhan */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Isi artikel"
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
            [&_p]:mb-3 [&_p:last-child]:mb-0
            [&_div]:mb-3 [&_div:last-child]:mb-0
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1
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
