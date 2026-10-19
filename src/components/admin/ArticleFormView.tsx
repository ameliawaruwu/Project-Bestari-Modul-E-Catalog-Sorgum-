import React, { useState, useEffect, useRef } from 'react';
import { ArticleItem } from '../../types/admin';
export type ArticleBlockDraft = {
  id: string;
  type: 'text' | 'image' | 'quote';
  content?: string;
  image_url?: string;
  alt?: string;
  caption?: string;
  author?: string;
  /** Blok teks multi-baris (paragraf/bullet/nomor) dari editor baru. */
  rich?: boolean;
};

interface ArticleFormViewProps {
  initialArticle?: ArticleItem | null;
  /** Daftar produk aktif untuk tag "Produk Terkait" (artikel↔produk). */
  products?: { id: string; name: string; image?: string }[];
  onSave: (articleData: {
    id?: string;
    title: string;
    category: string;
    author: string;
    date: string;
    createdAt?: string;
    content: string;
    contentBlocks?: ArticleBlockDraft[];
    image?: string;
    subImage?: string;
    quote?: string;
    excerpt?: string;
    productIds?: number[];
  }) => void;
  onCancel: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const uid = () => `blk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const ArticleFormView: React.FC<ArticleFormViewProps> = ({
  initialArticle,
  products = [],
  onSave,
  onCancel,
  showToast,
}) => {
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Budidaya');
  const [authorInput, setAuthorInput] = useState('Tim Nutrisi Sorgum');
  const [createdAtText, setCreatedAtText] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [blocks, setBlocks] = useState<ArticleBlockDraft[]>([]);
  const [uploading, setUploading] = useState(false);
  // Produk terkait (artikel↔produk): simpan sebagai array number (id BE produk).
  const [productIds, setProductIds] = useState<number[]>([]);

  // Upload gambar via endpoint admin (sama seperti Banner/Product form).
  // Returns URL yang siap disimpan ke field image/image_url.
  const uploadImage = async (file: File): Promise<string> => {
    const { productAdminApi } = await import('../../api/adminApi');
    const url = await productAdminApi.uploadImage(file);
    if (!url) throw new Error('upload gagal');
    return url;
  };

  useEffect(() => {
    if (initialArticle) {
      setTitleInput(initialArticle.title);
      setCategoryInput(initialArticle.category);
      setAuthorInput(initialArticle.author);
      // Created at — dari field createdAt/date (format tanggal sudah ID)
      setCreatedAtText(initialArticle.createdAt || initialArticle.date || '');
      setHeroImage(initialArticle.image || '');
      setProductIds(Array.isArray(initialArticle.productIds) ? initialArticle.productIds.map((id) => Number(id)) : []);
      // Muat content_blocks jika ada; jika tidak, konversi content teks + sub_image + quote → blok
      if (initialArticle.contentBlocks && initialArticle.contentBlocks.length > 0) {
        setBlocks(initialArticle.contentBlocks.map((b) => ({ ...b, id: uid() })));
      } else {
        // Fallback: content teks lama (split \n\n) → blok text, plus quote & sub_image
        const paras = (initialArticle.content || '').split('\n\n').filter((p) => p.trim());
        const blks: ArticleBlockDraft[] = [];
        for (let i = 0; i < paras.length; i++) {
          blks.push({ id: uid(), type: 'text' as const, content: paras[i].trim() });
          // Sisipkan quote setelah paragraf ke-2 & sub_image setelah ke-3 (gaya artikel lama)
          if (i === 1 && initialArticle.quote) {
            blks.push({ id: uid(), type: 'quote' as const, content: initialArticle.quote });
          }
          if (i === 2 && initialArticle.subImage) {
            blks.push({ id: uid(), type: 'image' as const, image_url: initialArticle.subImage, alt: `Ilustrasi ${initialArticle.title}` });
          }
        }
        setBlocks(blks);
      }
    } else {
      setTitleInput('');
      setCategoryInput('Budidaya');
      setAuthorInput('Tim Nutrisi Sorgum');
      setCreatedAtText('');
      setHeroImage('');
      setProductIds([]);
      setBlocks([]);
    }
  }, [initialArticle]);

  // ===== Block ops =====
  const addBlock = (type: ArticleBlockDraft['type']) => {
    const base: ArticleBlockDraft = { id: uid(), type };
    if (type === 'text') base.content = '';
    if (type === 'image') base.image_url = '';
    if (type === 'quote') base.content = '';
    setBlocks((prev) => [...prev, base]);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (idx: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const updateBlock = (id: string, patch: Partial<ArticleBlockDraft>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  // ===== Rich text (paragraf / bullet / nomor) =====
  // Ref textarea per blok — dipakai untuk auto-grow + menyisipkan marker di kursor.
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 96)}px`;
  };

  // Update isi blok teks + tandai `rich` (hanya blok yang benar-benar diketik
  // admin). Blok lama yang tidak disentuh tetap tanpa `rich` → tampilan publik
  // artikel lama tidak berubah.
  const applyText = (id: string, next: string, cursor?: number) => {
    updateBlock(id, { content: next, rich: true });
    if (typeof cursor === 'number') {
      requestAnimationFrame(() => {
        const el = textareaRefs.current[id];
        if (el) {
          el.focus();
          el.setSelectionRange(cursor, cursor);
        }
      });
    }
  };

  // Rapikan penomoran: setiap rangkaian baris bernomor diberi nomor berurutan
  // mulai dari nomor baris pertamanya. Mencegah nomor ganda ("3." dua kali)
  // saat admin menekan Enter di tengah daftar. Baris kosong tidak memutus
  // rangkaian; hanya baris teks biasa (paragraf) yang memutus.
  const fixNumbering = (text: string) => {
    const lines = text.split('\n');
    let next: number | null = null;
    for (let i = 0; i < lines.length; i++) {
      const m = /^(\d+)([.)])(\s+)(.*)$/.exec(lines[i]);
      if (!m) {
        if (lines[i].trim()) next = null;
        continue;
      }
      const num = next ?? Number(m[1]);
      lines[i] = `${num}${m[2]}${m[3]}${m[4]}`;
      next = num + 1;
    }
    return lines.join('\n');
  };

  // Enter = paragraf baru (ada jarak) · Shift+Enter = baris baru (paragraf sama)
  // Enter di baris bullet/nomor = lanjut daftar · Enter di daftar kosong = keluar.
  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, id: string) => {
    if (e.key !== 'Enter') return;
    const el = e.currentTarget;
    const value = el.value;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const currentLine = value.slice(lineStart, start);

    // Shift+Enter: baris baru tanpa jarak
    if (e.shiftKey) {
      e.preventDefault();
      applyText(id, value.slice(0, start) + '\n' + value.slice(end), start + 1);
      return;
    }

    // Di dalam bullet
    const bullet = /^\s*[-•*]\s+(.*)$/.exec(currentLine);
    if (bullet) {
      e.preventDefault();
      if (!bullet[1].trim()) {
        // Enter di bullet kosong → keluar dari daftar (baris marker dihapus)
        applyText(id, value.slice(0, lineStart) + value.slice(end), lineStart);
      } else {
        applyText(id, value.slice(0, start) + '\n• ' + value.slice(end), start + 3);
      }
      return;
    }

    // Di dalam daftar nomor
    const num = /^\s*(\d+)[.)]\s+(.*)$/.exec(currentLine);
    if (num) {
      e.preventDefault();
      if (!num[2].trim()) {
        // Enter di nomor kosong → keluar dari daftar
        const out = value.slice(0, lineStart) + value.slice(end);
        applyText(id, fixNumbering(out), lineStart);
      } else {
        const nextNum = Number(num[1]) + 1;
        const marker = `\n${nextNum}. `;
        const inserted = value.slice(0, start) + marker + value.slice(end);
        applyText(id, fixNumbering(inserted), start + marker.length);
      }
      return;
    }

    // Enter biasa: paragraf baru (dua kali baris baru = ada jarak bawah).
    // Kalau baris sebelumnya sudah kosong, cukup tambah satu baris supaya
    // kursor tetap turun (tidak "nyangkut") dan tidak jadi 4 baris kosong.
    e.preventDefault();
    const before = value.slice(0, start);
    const insert = /\n$/.test(before) ? '\n' : '\n\n';
    applyText(id, before + insert + value.slice(end), start + insert.length);
  };

  // Tombol toolbar: beri/hapus marker bullet atau nomor pada baris yang dipilih.
  const applyListMarker = (id: string, kind: 'ul' | 'ol') => {
    const el = textareaRefs.current[id];
    const block = blocks.find((b) => b.id === id);
    if (!el || !block) return;
    const value = block.content || '';
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = value.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = value.length;

    const lines = value.slice(lineStart, lineEnd).split('\n');
    let seq = 1;
    const out = lines
      .map((ln) => {
        const existing = /^\s*(\d+)[.)]\s+/.exec(ln);
        const text = ln.replace(/^\s*(?:[-•*]|\d+[.)])\s+/, '').trim();
        if (kind === 'ul') return `• ${text}`;
        const n = existing ? Number(existing[1]) : seq;
        seq = n + 1;
        return `${n}. ${text}`;
      })
      .join('\n');

    const next = value.slice(0, lineStart) + out + value.slice(lineEnd);
    applyText(id, next, lineStart + out.length);
  };

  // ===== Build content string (kompatibilitas render lama) =====
  const buildContent = (): string => {
    return blocks
      .map((b) => {
        if (b.type === 'text') return b.content || '';
        if (b.type === 'quote') return `"${b.content || ''}"${b.author ? ` — ${b.author}` : ''}`;
        return ''; // image tidak masuk content teks
      })
      .filter((s) => s.trim())
      .join('\n\n');
  };

  // Ringkasan untuk kartu artikel (excerpt). Untuk blok rich, buang marker
  // list ("• ", "1. ") supaya kartu tidak menampilkan tanda tersebut.
  // Blok lama diperlakukan persis seperti sebelumnya.
  const buildExcerpt = (): string => {
    const text = blocks
      .map((b) => {
        if (b.type === 'quote') return `"${b.content || ''}"${b.author ? ` — ${b.author}` : ''}`;
        if (b.type !== 'text') return '';
        const raw = b.content || '';
        if (!b.rich) return raw;
        return raw
          .split('\n')
          .map((ln) => ln.replace(/^\s*(?:[-•*]|\d+[.)])\s+/, '').trim())
          .filter(Boolean)
          .join(' ');
      })
      .filter((s) => s.trim())
      .join('\n\n');
    return text.slice(0, 150);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) {
      showToast('Masukkan judul artikel!');
      return;
    }
    if (blocks.length === 0) {
      showToast('Tambahkan minimal satu blok isi artikel!');
      return;
    }

    // Ambil image pertama untuk hero image (jika ada blok image)
    const firstImg = blocks.find((b) => b.type === 'image' && b.image_url)?.image_url;

    onSave({
      id: initialArticle?.id,
      title: titleInput,
      category: categoryInput,
      author: authorInput,
      date: initialArticle?.date || 'Hari ini',
      createdAt: createdAtText,
      content: buildContent(),
      contentBlocks: blocks,
      // image = apa yang ada di field Hero (atau gambar blok pertama utk artikel
      // baru). TANPA fallback ke initialArticle.image — sebelumnya gambar hero
      // yang dihapus SELALU muncul lagi (bug "gabisa hapus gambar hero").
      // Kalau hero dikosongkan & tidak ada blok image → '' → tersimpan kosong.
      image: heroImage || firstImg || '',
      subImage: undefined,
      quote: undefined,
      excerpt: buildExcerpt(),
      productIds,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-4xl mx-auto overflow-hidden">
      {/* Top Header & Breadcrumb */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#556353] dark:text-white/60 mb-1">
            <ol className="flex items-center space-x-2">
              <li>
                <button
                  type="button"
                  onClick={onCancel}
                  className="hover:text-[#1F5132] dark:hover:text-[#86EFAC] transition-colors cursor-pointer"
                >
                  Kelola Info
                </button>
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#1F5132] dark:text-[#86EFAC] font-bold">
                {initialArticle ? 'Edit Artikel' : 'Tulis Artikel Baru'}
              </li>
            </ol>
          </nav>
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-extrabold text-[#14331C] dark:text-[#F4F8F3] tracking-tight">
            {initialArticle ? 'Edit Konten Artikel' : 'Tulis Artikel &amp; Informasi Baru'}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="bg-white dark:bg-[#0E1A11] border border-[#E2EFE0] dark:border-white/10 text-[#1F5132] dark:text-[#86EFAC] px-5 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-[#EAF6E8] transition-all cursor-pointer font-bold text-xs shadow-2xs"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>KEMBALI KE DAFTAR</span>
        </button>
      </section>

      {/* Form Card */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-2xs border border-[#E0E0E0] overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-6 w-full max-w-full">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1B5E20]">
              Judul Artikel <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Contoh: Manfaat Bebas Gluten dari Sorgum Lokal"
              required
              className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">Kategori Artikel</label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none cursor-pointer font-medium"
              >
                <option value="Budidaya">Budidaya</option>
                <option value="Nutrisi">Nutrisi</option>
                <option value="Inspirasi">Inspirasi</option>
                <option value="Promosi">Promosi</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">Penulis / Author</label>
              <input
                type="text"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                placeholder="Contoh: Tim Nutrisi Sorgum"
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">Dibuat Tanggal</label>
              <input
                type="text"
                value={createdAtText}
                readOnly
                disabled
                placeholder="Otomatis"
                className="w-full bg-[#E8F5E9] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] outline-none font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Gambar Judul (Hero) — banner besar di atas artikel */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1B5E20]">
              Gambar Judul (Hero) <span className="text-[#555555] font-medium text-[11px]">— tampil besar di atas artikel</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="Tempel URL gambar utama artikel (mis. https://...jpg)"
                className="flex-1 w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none font-medium"
              />
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs transition-all cursor-pointer shadow-2xs">
                <span className="material-symbols-outlined text-base">upload_file</span>
                {uploading ? 'Mengunggah...' : 'Upload Gambar'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploading(true);
                      const url = await uploadImage(file);
                      setHeroImage(url);
                      showToast('Gambar berhasil diunggah.');
                    } catch (e: any) {
                      showToast(e?.message || 'Gagal mengunggah gambar.', 'error');
                    } finally {
                      setUploading(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
              {heroImage && (
                <button
                  type="button"
                  onClick={() => setHeroImage('')}
                  className="px-4 py-2.5 rounded-xl border border-[#FFCDD2] bg-[#FFEBEE] text-[#D32F2F] font-bold text-xs hover:bg-[#FFCDD2] transition-all cursor-pointer shadow-2xs"
                >
                  Hapus
                </button>
              )}
            </div>
            {heroImage ? (
              <div className="rounded-xl overflow-hidden border border-[#E0E0E0] bg-[#F7F8F6] mt-2">
                <img
                  src={heroImage}
                  alt="Pratinjau gambar judul"
                  className="w-full aspect-[21/9] object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                />
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-[#E0E0E0] bg-[#F7F8F6] py-6 text-center text-xs text-[#555555] mt-2">
                Belum ada gambar judul. Tempel URL di atas untuk pratinjau.
              </div>
            )}
          </div>

          {/* ===== Block Editor ===== */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Isi / Konten Artikel <span className="text-red-600">*</span>
              </label>
              <span className="text-[11px] text-[#555555] font-medium">
                Susun konten: pindahkan kartu dengan panah ↑ ↓
              </span>
            </div>

            {/* Daftar blok */}
            <div className="space-y-4">
              {blocks.length === 0 && (
                <div className="text-center py-10 bg-[#F7F8F6] border-2 border-dashed border-[#E0E0E0] rounded-xl">
                  <span className="material-symbols-outlined text-4xl text-[#C89B3C] mb-2 block">article</span>
                  <p className="text-sm text-[#1B5E20] font-medium">
                    Belum ada konten. Tambahkan kartu di bawah.
                  </p>
                </div>
              )}

              {blocks.map((b, idx) => (
                <div
                  key={b.id}
                  className="border border-[#E0E0E0] rounded-xl overflow-hidden bg-[#FFFFFF] shadow-2xs"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#F7F8F6] border-b border-[#E0E0E0]">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        b.type === 'text' ? 'bg-[#E8F5E9] text-[#1B5E20]'
                        : b.type === 'image' ? 'bg-[#FFF8E1] text-[#C89B3C]'
                        : 'bg-[#E3F2FD] text-[#1976D2]'
                      }`}>
                        {b.type === 'text' ? 'Teks' : b.type === 'image' ? 'Gambar' : 'Kutipan'}
                      </span>
                      <span className="text-[11px] text-[#555555] font-medium">
                        Kartu {idx + 1} dari {blocks.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, -1)}
                        disabled={idx === 0}
                        title="Pindah ke atas"
                        className="p-1.5 rounded-lg text-[#555555] hover:bg-[#E8F5E9] hover:text-[#1B5E20] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-base">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, 1)}
                        disabled={idx === blocks.length - 1}
                        title="Pindah ke bawah"
                        className="p-1.5 rounded-lg text-[#555555] hover:bg-[#E8F5E9] hover:text-[#1B5E20] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-base">arrow_downward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(b.id)}
                        title="Hapus kartu"
                        className="w-7 h-7 rounded-lg bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#D32F2F] flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    {b.type === 'text' && (
                      <div className="space-y-2">
                        {/* Toolbar: paragraf / bullet / nomor — menyisipkan marker
                            di posisi kursor. Tanpa library, murni textarea. */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => applyListMarker(b.id, 'ul')}
                            title="Jadikan bullet (•)"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] text-[#1B5E20] font-bold text-[11px] hover:bg-[#E8F5E9] transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">format_list_bulleted</span>
                            Bullet
                          </button>
                          <button
                            type="button"
                            onClick={() => applyListMarker(b.id, 'ol')}
                            title="Jadikan daftar bernomor (1. 2. 3.)"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] text-[#1B5E20] font-bold text-[11px] hover:bg-[#E8F5E9] transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">format_list_numbered</span>
                            Nomor
                          </button>
                          <span className="text-[10px] text-[#555555] font-medium ml-auto">
                            Enter = paragraf baru · Shift+Enter = baris baru
                          </span>
                        </div>
                        <textarea
                          ref={(el) => { textareaRefs.current[b.id] = el; autoGrow(el); }}
                          rows={4}
                          value={b.content || ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            const prev = b.content || '';
                            // Blok lama hanya jadi "rich" kalau ADMIN sendiri yang
                            // menambah struktur (baris baru / marker daftar) pada
                            // blok yang sebelumnya tidak punya struktur. Jadi
                            // artikel lama yang sudah berisi "\n" tetap tampil
                            // seperti sekarang walaupun diedit seadanya.
                            const structured = (s: string) =>
                              s.includes('\n') || /^\s*[-•*]\s+/.test(s) || /^\s*\d+[.)]\s+/.test(s);
                            const rich = b.rich || (structured(v) && !structured(prev));
                            updateBlock(b.id, { content: v, rich });
                            autoGrow(e.target);
                          }}
                          onKeyDown={(e) => handleTextKeyDown(e, b.id)}
                          placeholder={'Tulis isi artikel di sini...\n\nEnter untuk paragraf baru. Untuk daftar, klik tombol Bullet / Nomor atau ketik "- " atau "1. " di awal baris.'}
                          className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none leading-relaxed font-medium overflow-hidden"
                        />
                      </div>
                    )}

                    {b.type === 'image' && (
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={b.image_url || ''}
                            onChange={(e) => updateBlock(b.id, { image_url: e.target.value })}
                            placeholder="Tempel URL gambar (mis. https://...jpg)"
                            className="flex-1 w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none font-medium"
                          />
                          <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs transition-all cursor-pointer shadow-2xs whitespace-nowrap">
                            <span className="material-symbols-outlined text-sm">upload_file</span>
                            {uploading ? '...' : 'Upload'}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/avif"
                              className="hidden"
                              disabled={uploading}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  setUploading(true);
                                  const url = await uploadImage(file);
                                  updateBlock(b.id, { image_url: url });
                                  showToast('Gambar berhasil diunggah.');
                                } catch (e: any) {
                                  showToast(e?.message || 'Gagal mengunggah gambar.', 'error');
                                } finally {
                                  setUploading(false);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={b.caption || ''}
                            onChange={(e) => updateBlock(b.id, { caption: e.target.value })}
                            placeholder="Caption gambar (opsional)"
                            className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3 text-xs text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none font-medium"
                          />
                          <input
                            type="text"
                            value={b.alt || ''}
                            onChange={(e) => updateBlock(b.id, { alt: e.target.value })}
                            placeholder="Alt text (opsional)"
                            className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3 text-xs text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none font-medium"
                          />
                        </div>
                        {b.image_url && (
                          <div className="rounded-lg overflow-hidden border border-[#E0E0E0] bg-[#F7F8F6]">
                            <img
                              src={b.image_url}
                              alt={b.alt || 'Pratinjau gambar'}
                              className="w-full max-h-52 object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {b.type === 'quote' && (
                      <div className="space-y-3">
                        <textarea
                          rows={3}
                          value={b.content || ''}
                          onChange={(e) => updateBlock(b.id, { content: e.target.value })}
                          placeholder="Tulis kutipan di sini..."
                          className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none leading-relaxed italic font-medium"
                        />
                        <input
                          type="text"
                          value={b.author || ''}
                          onChange={(e) => updateBlock(b.id, { author: e.target.value })}
                          placeholder="Sumber kutipan (opsional, mis. Dr. Rina Wati)"
                          className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3 text-xs text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none font-medium"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add block buttons */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => addBlock('text')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] text-[#1B5E20] font-bold text-xs hover:bg-[#E8F5E9] transition-all cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-base">notes</span>
                Tambah Teks
              </button>
              <button
                type="button"
                onClick={() => addBlock('image')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] text-[#1B5E20] font-bold text-xs hover:bg-[#E8F5E9] transition-all cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-base">image</span>
                Tambah Gambar
              </button>
              <button
                type="button"
                onClick={() => addBlock('quote')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] text-[#1B5E20] font-bold text-xs hover:bg-[#E8F5E9] transition-all cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-base">format_quote</span>
                Tambah Kutipan
              </button>
            </div>
          </div>

          {/* ===== Produk Terkait (artikel↔produk) — di bawah/akhir form ===== */}
          <div className="space-y-2.5 border border-[#E2EFE0] dark:border-white/10 rounded-2xl p-4 sm:p-5 bg-[#FAFCF8] dark:bg-[#0E1A11]">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-[#1B5E20] dark:text-[#F4F8F3]">
                  Produk Terkait di Artikel Ini
                </label>
                <p className="text-[11px] text-[#556353] dark:text-white/60 mt-0.5">
                  Pilih produk sorgum yang dibahas/direkomendasikan artikel. Produk ini tampil di bagian bawah artikel biar pembaca bisa langsung membelinya.
                </p>
              </div>
              {productIds.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] text-[10px] font-extrabold whitespace-nowrap">
                  {productIds.length} produk
                </span>
              )}
            </div>

            {products.length === 0 ? (
              <p className="text-xs text-[#C89B3C] bg-[#FFF8E7] dark:bg-[#241E0E] border border-[#F5E6C4] dark:border-white/10 rounded-xl px-3.5 py-3">
                Belum ada produk aktif. Tambahkan produk dulu di Kelola Produk, lalu kembali ke sini untuk menandai produk terkait.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {products.map((p) => {
                  const pid = Number(p.id);
                  const selected = productIds.includes(pid);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setProductIds((prev) =>
                          selected ? prev.filter((x) => x !== pid) : [...prev, pid],
                        )
                      }
                      className={`inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#2E7D32] border-[#2E7D32] text-white shadow-xs'
                          : 'bg-white dark:bg-[#162419] border-[#E0E0E0] dark:border-white/15 text-[#556353] dark:text-white/70 hover:border-[#3A8F4B] hover:text-[#1F5132] dark:hover:text-[#86EFAC]'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-lg overflow-hidden flex-shrink-0 ${selected ? 'bg-white/20' : 'bg-[#EAF6E8] dark:bg-[#152718]'}`}>
                        {p.image ? (
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className={`material-symbols-outlined text-[11px] leading-5 block text-center ${selected ? 'text-white' : 'text-[#3A8F4B]'}`}>shopping_bag</span>
                        )}
                      </span>
                      <span className="max-w-[180px] truncate">{p.name}</span>
                      {selected && (
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end pt-4 gap-3 border-t border-[#E2EFE0] dark:border-white/10">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-[#0E1A11] text-[#556353] dark:text-white/60 font-bold text-xs hover:bg-[#EAF6E8] transition-all cursor-pointer text-center"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] text-white px-8 py-2.5 rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer text-center"
            >
              {initialArticle ? 'Simpan Perubahan Artikel' : 'Terbitkan Artikel Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
