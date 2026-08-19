import React, { useState, useEffect } from 'react';
import { FAQItem } from '../../types/admin';

interface FaqFormViewProps {
  initialFaq?: FAQItem | null;
  onSave: (faqData: {
    id?: string;
    question: string;
    answer: string;
    category: string;
    status: 'AKTIF' | 'DRAFT';
    order?: number;
    tags?: string[];
  }) => void;
  onCancel: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const PREDEFINED_CATEGORIES = [
  'Produk & Nutrisi',
  'Pemesanan & Pembayaran',
  'Pengiriman & Layanan',
  'Kemitraan & Reseller',
  'Lainnya',
];

export const FaqFormView: React.FC<FaqFormViewProps> = ({
  initialFaq,
  onSave,
  onCancel,
  showToast,
}) => {
  const isEditing = Boolean(initialFaq);

  // Form Fields State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('Produk & Nutrisi');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [status, setStatus] = useState<'AKTIF' | 'DRAFT'>('AKTIF');
  const [order, setOrder] = useState<number>(1);

  // Validation Errors State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Accordion preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);

  useEffect(() => {
    if (initialFaq) {
      setQuestion(initialFaq.question || '');
      setAnswer(initialFaq.answer || '');

      if (PREDEFINED_CATEGORIES.includes(initialFaq.category)) {
        setCategory(initialFaq.category);
        setIsCustomCategoryMode(false);
        setCustomCategory('');
      } else {
        setCategory('Kategori Baru');
        setIsCustomCategoryMode(true);
        setCustomCategory(initialFaq.category);
      }

      setStatus(initialFaq.status || 'AKTIF');
      setOrder(initialFaq.order || 1);
    } else {
      setQuestion('');
      setAnswer('');
      setCategory('Produk & Nutrisi');
      setIsCustomCategoryMode(false);
      setCustomCategory('');
      setStatus('AKTIF');
      setOrder(1);
    }
    setErrors({});
  }, [initialFaq]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!question.trim()) {
      newErrors.question = 'Pertanyaan wajib diisi!';
    }
    if (!answer.trim()) {
      newErrors.answer = 'Jawaban penjelasan wajib diisi!';
    }

    const finalCategory = isCustomCategoryMode
      ? customCategory.trim() || 'Lainnya'
      : category;

    if (isCustomCategoryMode && !customCategory.trim()) {
      newErrors.category = 'Nama kategori baru wajib diisi!';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Mohon lengkapi seluruh bidang formulir FAQ!');
      return;
    }

    onSave({
      id: initialFaq?.id,
      question: question.trim(),
      answer: answer.trim(),
      category: finalCategory,
      status,
      order: Number(order) || 1,
    });
  };

  const insertShortcutText = (shortcutType: 'bullet' | 'bold' | 'link') => {
    if (shortcutType === 'bullet') {
      setAnswer((prev) => (prev ? `${prev}\n• ` : '• '));
    } else if (shortcutType === 'bold') {
      setAnswer((prev) => `${prev} **Teks Tebal** `);
    } else if (shortcutType === 'link') {
      setAnswer((prev) => `${prev} Hubungi kami via WhatsApp di 0812-3456-7890 `);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E0E0E0]/60 pb-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#555555] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="cursor-pointer hover:underline text-[#555555]" onClick={onCancel}>
                Kelola FAQ
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#1B5E20] font-bold">
                {isEditing ? `Edit FAQ: ${initialFaq?.id}` : 'Tambah FAQ Baru'}
              </li>
            </ol>
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-white border border-[#E0E0E0] text-[#1B5E20] hover:bg-[#F7F8F6] transition-colors cursor-pointer"
              title="Kembali"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1B5E20]">
              {isEditing ? 'Formulir Edit FAQ' : 'Halaman Tambah Pertanyaan Baru'}
            </h2>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-white hover:bg-gray-100 border border-[#E0E0E0] text-[#555555] text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {isEditing ? 'Simpan Perubahan' : 'Terbitkan FAQ Baru'}
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Form vs Live Preview */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Left 2 Columns: Form Fields */}
        <div className="space-y-6">
          {/* Card 1: Isi Pertanyaan & Jawaban */}
          <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-[#1B5E20]">quiz</span>
                <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1B5E20]">
                  Konten Pertanyaan &amp; Jawaban
                </h3>
              </div>
              {isEditing && (
                <span className="px-3 py-1 bg-[#F7F8F6] text-[#1B5E20] font-mono text-xs font-bold rounded-lg border border-[#E0E0E0]/60">
                  {initialFaq?.id}
                </span>
              )}
            </div>

            {/* Pertanyaan */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-[#1B5E20]">
                  Pertanyaan Konsumen <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-400 font-mono">
                  {question.length} / 150 Karakter
                </span>
              </div>
              <input
                type="text"
                maxLength={150}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Contoh: Apakah produk sorgum Sorgum 100% Bebas Gluten?"
                className={`w-full px-4 py-2.5 text-sm rounded-xl border ${
                  errors.question ? 'border-red-500 bg-red-50' : 'border-[#E0E0E0] bg-white'
                } focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium`}
              />
              {errors.question && <p className="text-xs text-red-500 mt-1">{errors.question}</p>}
            </div>

            {/* Jawaban Penjelasan */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-[#1B5E20]">
                  Jawaban Penjelasan Lengkap <span className="text-red-500">*</span>
                </label>
                {/* Formatting Shortcuts */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => insertShortcutText('bullet')}
                    className="px-2 py-0.5 bg-[#F7F8F6] hover:bg-[#E8F5E9] text-[#1B5E20] text-[11px] font-bold rounded cursor-pointer"
                    title="Tambah Poin Bullet"
                  >
                    + Bullet
                  </button>
                  <button
                    type="button"
                    onClick={() => insertShortcutText('bold')}
                    className="px-2 py-0.5 bg-[#F7F8F6] hover:bg-[#E8F5E9] text-[#1B5E20] text-[11px] font-bold rounded cursor-pointer"
                    title="Teks Tebal"
                  >
                    Bold
                  </button>
                </div>
              </div>

              <textarea
                rows={5}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Tuliskan penjelasan yang rinci, ramah, dan mudah dipahami konsumen..."
                className={`w-full px-4 py-3 text-sm rounded-xl border ${
                  errors.answer ? 'border-red-500 bg-red-50' : 'border-[#E0E0E0] bg-white'
                } focus:outline-none focus:ring-2 focus:ring-[#2E7D32] leading-relaxed`}
              />
              {errors.answer && <p className="text-xs text-red-500 mt-1">{errors.answer}</p>}
            </div>
          </div>

          {/* Card 2: Pengaturan Kategori & Tampilan */}
          <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#e2e8f0] pb-3">
              <span className="material-symbols-outlined text-xl text-[#1B5E20]">category</span>
              <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1B5E20]">
                Pengelompokan &amp; Urutan Tampilan
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kategori Select */}
              <div>
                <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                  Kategori FAQ <span className="text-red-500">*</span>
                </label>
                <select
                  value={isCustomCategoryMode ? 'Kategori Baru' : category}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Kategori Baru') {
                      setIsCustomCategoryMode(true);
                    } else {
                      setIsCustomCategoryMode(false);
                      setCategory(val);
                    }
                  }}
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E0E0E0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium cursor-pointer"
                >
                  {PREDEFINED_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Kategori Baru">+ Buat Kategori Kustom Baru...</option>
                </select>
              </div>

              {/* Custom Category Input (If custom mode) */}
              {isCustomCategoryMode ? (
                <div>
                  <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                    Nama Kategori Baru <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Contoh: Program Loyalitas"
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E0E0E0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                  {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                </div>
              ) : (
                /* Urutan Prioritas */
                <div>
                  <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                    Nomor Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={order}
                    onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E0E0E0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Nilai lebih kecil (1, 2, 3) akan ditampilkan di urutan paling atas.
                  </p>
                </div>
              )}

              {/* Status FAQ — aktif/nonaktif (H6: tampil di publik hanya yg AKTIF) */}
              <div>
                <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                  Status FAQ
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('AKTIF')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      status === 'AKTIF'
                        ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                        : 'bg-[#F7F8F6] border-[#E0E0E0] text-[#555555]'
                    }`}
                  >
                    Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('DRAFT')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      status === 'DRAFT'
                        ? 'bg-[#E65100] text-white border-[#E65100]'
                        : 'bg-[#F7F8F6] border-[#E0E0E0] text-[#555555]'
                    }`}
                  >
                    Draft (Nonaktif)
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  FAQ dengan status Draft tidak tampil di halaman FAQ publik.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
