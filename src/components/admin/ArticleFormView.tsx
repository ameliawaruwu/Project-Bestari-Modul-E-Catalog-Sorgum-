import React, { useState, useEffect } from 'react';
import { ArticleItem } from '../../types/admin';

interface ArticleFormViewProps {
  initialArticle?: ArticleItem | null;
  onSave: (articleData: {
    id?: string;
    title: string;
    category: string;
    author: string;
    date: string;
    content: string;
  }) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export const ArticleFormView: React.FC<ArticleFormViewProps> = ({
  initialArticle,
  onSave,
  onCancel,
  showToast,
}) => {
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Kesehatan & Nutrisi');
  const [authorInput, setAuthorInput] = useState('Tim Nutrisi Bestari');
  const [contentInput, setContentInput] = useState('');

  useEffect(() => {
    if (initialArticle) {
      setTitleInput(initialArticle.title);
      setCategoryInput(initialArticle.category);
      setAuthorInput(initialArticle.author);
      setContentInput(initialArticle.content || '');
    } else {
      setTitleInput('');
      setCategoryInput('Kesehatan & Nutrisi');
      setAuthorInput('Tim Nutrisi Bestari');
      setContentInput('');
    }
  }, [initialArticle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) {
      showToast('Masukkan judul artikel!');
      return;
    }

    onSave({
      id: initialArticle?.id,
      title: titleInput,
      category: categoryInput,
      author: authorInput,
      date: initialArticle?.date || 'Hari ini',
      content: contentInput,
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1d1b17]">Penulis / Author</label>
              <input
                type="text"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                placeholder="Contoh: Tim Nutrisi Bestari"
                className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-[#1d1b17]">Isi / Konten Artikel</label>
            <textarea
              rows={6}
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              placeholder="Tuliskan isi artikel informasi secara lengkap..."
              className="w-full bg-[#faf8f5] border border-[#c4c8bc] rounded-xl p-3.5 text-xs sm:text-sm text-[#1d1b17] focus:ring-2 focus:ring-[#162809] outline-none leading-relaxed"
            />
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
