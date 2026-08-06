import React, { useState, useEffect } from 'react';
import { ArticleItem } from '../../types/admin';

export type ArticleBlockDraft = {
  id: string;
  type: 'text' | 'image' | 'quote';
  content?: string;
  image_url?: string;
  alt?: string;
  caption?: string;
  author?: string;
};

interface ArticleFormViewProps {
  initialArticle?: ArticleItem | null;
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
  }) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

const uid = () => `blk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const ArticleFormView: React.FC<ArticleFormViewProps> = ({
  initialArticle,
  onSave,
  onCancel,
  showToast,
}) => {
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Kesehatan & Nutrisi');
  const [authorInput, setAuthorInput] = useState('Tim Nutrisi Sorgum');
  const [createdAtText, setCreatedAtText] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [blocks, setBlocks] = useState<ArticleBlockDraft[]>([]);

  useEffect(() => {
    if (initialArticle) {
      setTitleInput(initialArticle.title);
      setCategoryInput(initialArticle.category);
      setAuthorInput(initialArticle.author);
      // Created at — dari field createdAt/date (format tanggal sudah ID)
      setCreatedAtText(initialArticle.createdAt || initialArticle.date || '');
      setHeroImage(initialArticle.image || '');
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
      setCategoryInput('Kesehatan & Nutrisi');
      setAuthorInput('Tim Nutrisi Sorgum');
      setCreatedAtText('');
      setHeroImage('');
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
      image: heroImage || firstImg || initialArticle?.image,
      subImage: undefined,
      quote: undefined,
      excerpt: buildContent().slice(0, 150),
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header & Breadcrumb */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#44483f] mb-1">
            <ol className="flex items-center space-x-2">
              <li>
                <button
                  type="button"
                  onClick={onCancel}
                  className="hover:text-[#162809] transition-colors cursor-pointer"
                >
                  Kelola Info
                </button>
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#162809] font-bold">
                {initialArticle ? 'Edit Artikel' : 'Tambah Artikel Baru'}
              </li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1d1b17]">
            {initialArticle ? 'Edit Artikel' : 'Halaman Tambah Artikel Baru'}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="bg-white border border-[#c4c8bc] text-[#1d1b17] px-5 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-[#f3ede6] transition-all cursor-pointer font-bold text-xs"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>KEMBALI KE DAFTAR</span>
        </button>
      </section>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#c4c8bc] overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1d1b17]">
              Judul Artikel <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Contoh: Manfaat Bebas Gluten dari Sorgum Lokal"
              required
              className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1d1b17]">Kategori Artikel</label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none cursor-pointer font-medium"
              >
                <option value="Kesehatan & Nutrisi">Kesehatan &amp; Nutrisi</option>
                <option value="Resep & Kuliner">Resep &amp; Kuliner</option>
                <option value="Budidaya Sorgum">Budidaya Sorgum</option>
                <option value="Berita & Event">Berita &amp; Event</option>
                <option value="Promosi">Promosi</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1d1b17]">Penulis / Author</label>
              <input
                type="text"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                placeholder="Contoh: Tim Nutrisi Sorgum"
                className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1d1b17]">Dibuat Tanggal</label>
              <input
                type="text"
                value={createdAtText}
                readOnly
                disabled
                placeholder="Otomatis"
                className="w-full bg-[#f3ede6] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#44483f] outline-none font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Gambar Judul (Hero) — banner besar di atas artikel */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1d1b17]">
              Gambar Judul (Hero) <span className="text-[#75786e] font-medium text-[11px]">— tampil besar di atas artikel</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={heroImage}
                onChange={(e) => setHeroImage(e.target.value)}
                placeholder="Tempel URL gambar utama artikel (mis. https://...jpg)"
                className="flex-1 w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none font-medium"
              />
              {heroImage && (
                <button
                  type="button"
                  onClick={() => setHeroImage('')}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 font-bold text-xs hover:bg-red-50 transition-all cursor-pointer"
                >
                  Hapus
                </button>
              )}
            </div>
            {heroImage ? (
              <div className="rounded-xl overflow-hidden border border-[#c4c8bc] bg-[#faf8f5] mt-2">
                <img
                  src={heroImage}
                  alt="Pratinjau gambar judul"
                  className="w-full aspect-[21/9] object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                />
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-[#c4c8bc] bg-[#faf8f5] py-6 text-center text-xs text-[#75786e] mt-2">
                Belum ada gambar judul. Tempel URL di atas untuk pratinjau.
              </div>
            )}
          </div>

          {/* ===== Block Editor ===== */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-[#1d1b17]">
                Isi / Konten Artikel <span className="text-red-600">*</span>
              </label>
              <span className="text-[11px] text-[#75786e] font-medium">
                Susun konten: pindahkan kartu dengan panah ↑ ↓
              </span>
            </div>

            {/* Daftar blok */}
            <div className="space-y-4">
              {blocks.length === 0 && (
                <div className="text-center py-10 bg-[#faf8f5] border-2 border-dashed border-[#c4c8bc] rounded-xl">
                  <span className="material-symbols-outlined text-4xl text-[#75786e] mb-2 block">article</span>
                  <p className="text-sm text-[#44483f] font-medium">
                    Belum ada konten. Tambahkan kartu di bawah.
                  </p>
                </div>
              )}

              {blocks.map((b, idx) => (
                <div
                  key={b.id}
                  className="border border-[#c4c8bc] rounded-xl overflow-hidden bg-white shadow-2xs"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#f3ede6] border-b border-[#c4c8bc]/60">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        b.type === 'text' ? 'bg-[#d2eabb] text-[#162809]'
                        : b.type === 'image' ? 'bg-[#fade88] text-[#162809]'
                        : 'bg-[#e3d5c0] text-[#162809]'
                      }`}>
                        {b.type === 'text' ? 'Teks' : b.type === 'image' ? 'Gambar' : 'Kutipan'}
                      </span>
                      <span className="text-[11px] text-[#44483f] font-medium">
                        Kartu {idx + 1} dari {blocks.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, -1)}
                        disabled={idx === 0}
                        title="Pindah ke atas"
                        className="p-1.5 rounded-lg text-[#44483f] hover:bg-white hover:text-[#162809] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-base">arrow_upward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(idx, 1)}
                        disabled={idx === blocks.length - 1}
                        title="Pindah ke bawah"
                        className="p-1.5 rounded-lg text-[#44483f] hover:bg-white hover:text-[#162809] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-base">arrow_downward</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(b.id)}
                        title="Hapus kartu"
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    {b.type === 'text' && (
                      <textarea
                        rows={4}
                        value={b.content || ''}
                        onChange={(e) => updateBlock(b.id, { content: e.target.value })}
                        placeholder="Tulis paragraf teks artikel di sini..."
                        className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none leading-relaxed"
                      />
                    )}

                    {b.type === 'image' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={b.image_url || ''}
                          onChange={(e) => updateBlock(b.id, { image_url: e.target.value })}
                          placeholder="Tempel URL gambar (mis. https://...jpg)"
                          className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none font-medium"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={b.caption || ''}
                            onChange={(e) => updateBlock(b.id, { caption: e.target.value })}
                            placeholder="Caption gambar (opsional)"
                            className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3 text-xs text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none"
                          />
                          <input
                            type="text"
                            value={b.alt || ''}
                            onChange={(e) => updateBlock(b.id, { alt: e.target.value })}
                            placeholder="Alt text (opsional)"
                            className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3 text-xs text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none"
                          />
                        </div>
                        {b.image_url && (
                          <div className="rounded-lg overflow-hidden border border-[#c4c8bc] bg-[#faf8f5]">
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
                          className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none leading-relaxed italic"
                        />
                        <input
                          type="text"
                          value={b.author || ''}
                          onChange={(e) => updateBlock(b.id, { author: e.target.value })}
                          placeholder="Sumber kutipan (opsional, mis. Dr. Rina Wati)"
                          className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3 text-xs text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none"
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
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#2b3e1d] bg-white text-[#162809] font-bold text-xs hover:bg-[#d2eabb] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">notes</span>
                Tambah Teks
              </button>
              <button
                type="button"
                onClick={() => addBlock('image')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#2b3e1d] bg-white text-[#162809] font-bold text-xs hover:bg-[#fade88] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">image</span>
                Tambah Gambar
              </button>
              <button
                type="button"
                onClick={() => addBlock('quote')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#2b3e1d] bg-white text-[#162809] font-bold text-xs hover:bg-[#e3d5c0] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">format_quote</span>
                Tambah Kutipan
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 space-x-4 border-t border-[#c4c8bc]">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl border border-[#75786e] text-[#44483f] font-bold text-xs hover:bg-[#e7e2db] transition-all cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="bg-[#162809] text-white px-8 py-2.5 rounded-xl font-bold text-xs hover:opacity-90 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              {initialArticle ? 'Simpan Perubahan Artikel' : 'Terbitkan Artikel Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
