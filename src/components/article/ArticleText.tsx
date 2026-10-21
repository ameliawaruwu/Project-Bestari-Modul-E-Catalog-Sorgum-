import React from 'react';

/**
 * ArticleText — render blok teks "rich" (paragraf + bullet + nomor).
 *
 * Hanya dipakai untuk blok teks yang punya flag `rich: true` (dibuat dari
 * editor artikel yang baru). Blok teks lama TANPA flag `rich` tetap dirender
 * oleh ArticlesPage dengan cara lama (satu <p>), jadi tampilan artikel lama
 * tidak berubah sama sekali.
 *
 * Aturan sintaks (seperti Word, tanpa tag HTML):
 *   Enter          -> baris baru; baris kosong memisahkan paragraf
 *   "- ", "• ", "* " -> bullet list
 *   "1. ", "1) "     -> numbered list
 */

export type ArticleTextProps = {
  content?: string;
  /** Paragraf pertama diberi drop cap (gaya paragraf pembuka artikel). */
  dropCap?: boolean;
  /** Perataan teks: rata kiri (default) / kanan / kanan-kiri. */
  align?: TextAlign;
};

export type TextAlign = 'left' | 'right' | 'justify';

export const ALIGN_CLASS: Record<TextAlign, string> = {
  left: 'text-left',
  right: 'text-right',
  justify: 'text-justify',
};

type Segment =
  | { kind: 'p'; lines: string[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] };

type Token = { kind: 'p' | 'ul' | 'ol' | 'blank'; text: string };

const BULLET_RE = /^\s*[-•*]\s+(.*)$/;
const NUMBER_RE = /^\s*\d+[.)]\s+(.*)$/;

// Drop cap memakai class `article-drop-cap` (src/index.css) agar sejajar.
export const PARA_FIRST_CLASS = 'text-[#555555] text-sm md:text-base leading-relaxed article-drop-cap';
const PARA_CLASS = 'text-[#555555] text-sm md:text-base leading-relaxed font-normal';
const LIST_CLASS = 'text-[#555555] text-sm md:text-base leading-relaxed font-normal pl-5 space-y-1.5';

function tokenize(raw: string): Token[] {
  return raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => {
      if (!line.trim()) return { kind: 'blank', text: '' } as Token;
      const bullet = BULLET_RE.exec(line);
      if (bullet) return { kind: 'ul', text: bullet[1].trim() } as Token;
      const num = NUMBER_RE.exec(line);
      if (num) return { kind: 'ol', text: num[1].trim() } as Token;
      return { kind: 'p', text: line.trim() } as Token;
    });
}

function parseRichText(raw: string): Segment[] {
  const out: Segment[] = [];
  let forceNew = false;

  for (const tk of tokenize(raw)) {
    if (tk.kind === 'blank') {
      forceNew = true;
      continue;
    }
    const last = out[out.length - 1];
    const canMerge = !forceNew && !!last && last.kind === tk.kind;
    forceNew = false;

    if (tk.kind === 'p') {
      if (canMerge && last && last.kind === 'p') last.lines.push(tk.text);
      else out.push({ kind: 'p', lines: [tk.text] });
      continue;
    }
    if (tk.kind === 'ul') {
      if (canMerge && last && last.kind === 'ul') last.items.push(tk.text);
      else out.push({ kind: 'ul', items: [tk.text] });
      continue;
    }
    if (canMerge && last && last.kind === 'ol') last.items.push(tk.text);
    else out.push({ kind: 'ol', items: [tk.text] });
  }

  return out;
}

export const ArticleText: React.FC<ArticleTextProps> = ({ content, dropCap, align = 'left' }) => {
  const segments = parseRichText(content || '');
  if (segments.length === 0) return null;
  const alignCls = ALIGN_CLASS[align] || ALIGN_CLASS.left;

  return (
    <div className="space-y-4">
      {segments.map((seg, i) => {
        if (seg.kind === 'p') {
          return (
            <p key={i} className={`${i === 0 && dropCap ? PARA_FIRST_CLASS : PARA_CLASS} ${alignCls}`}>
              {seg.lines.map((line, j) => (
                <React.Fragment key={j}>
                  {j > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </p>
          );
        }

        const ListTag: 'ul' | 'ol' = seg.kind === 'ul' ? 'ul' : 'ol';
        return (
          <ListTag
            key={i}
            className={`${LIST_CLASS} ${alignCls} ${seg.kind === 'ul' ? 'list-disc' : 'list-decimal'}`}
          >
            {seg.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ListTag>
        );
      })}
    </div>
  );
};
