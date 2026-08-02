import React, { useState } from 'react';
import { FAQItem } from '../../types/admin';
import { FaqDeleteConfirmModal } from './FaqDeleteConfirmModal';

interface FaqTabProps {
  faqs: FAQItem[];
  onDeleteFaq: (id: string) => void;
  onOpenCreateFaq: () => void;
  onOpenEditFaq: (faq: FAQItem) => void;
  onToggleStatus?: (id: string) => void;
  onReorderFaq?: (id: string, direction: 'UP' | 'DOWN') => void;
  showToast: (msg: string) => void;
}

export const FaqTab: React.FC<FaqTabProps> = ({
  faqs,
  onDeleteFaq,
  onOpenCreateFaq,
  onOpenEditFaq,
  onToggleStatus,
  onReorderFaq,
  showToast,
}) => {
  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [selectedStatus, setSelectedStatus] = useState<'SEMUA' | 'AKTIF' | 'DRAFT'>('SEMUA');

  // Delete Confirmation Modal State
  const [faqToDelete, setFaqToDelete] = useState<FAQItem | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;



  // Get unique list of categories from FAQs
  const categories = Array.from(new Set(faqs.map((f) => f.category))).filter(Boolean);

  // Filtered FAQs
  const filteredFaqs = faqs.filter((f) => {
    // Search query filter
    const matchesSearch =
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.tags && f.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    // Category filter
    const matchesCategory = selectedCategory === 'SEMUA' || f.category === selectedCategory;

    // Status filter
    const fStatus = f.status || 'AKTIF';
    const matchesStatus = selectedStatus === 'SEMUA' || fStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination Calculations
  const totalItems = filteredFaqs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFaqs = filteredFaqs.slice(startIndex, startIndex + itemsPerPage);

  // Stats Counters
  const totalFaqsCount = faqs.length;
  const activeFaqsCount = faqs.filter((f) => (f.status || 'AKTIF') === 'AKTIF').length;
  const draftFaqsCount = faqs.filter((f) => f.status === 'DRAFT').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#44483f] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#162809] font-bold">Kelola FAQ</li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1d1b17]">
            Kelola Pertanyaan Umum (FAQ)
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenCreateFaq}
          className="bg-[#162809] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Tambah FAQ</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#c4c8bc] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari pertanyaan, jawaban, atau tag FAQ..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#c4c8bc] bg-[#fdfbf7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#162809]"
          />
        </div>

        {/* Filters & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-[#fdfbf7] border border-[#c4c8bc] px-3 py-1.5 rounded-xl">
            <span className="text-xs font-medium text-[#44483f]">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-[#1d1b17] focus:outline-none cursor-pointer"
            >
              <option value="SEMUA">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-[#fdfbf7] border border-[#c4c8bc] px-3 py-1.5 rounded-xl">
            <span className="text-xs font-medium text-[#44483f]">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-[#1d1b17] focus:outline-none cursor-pointer"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="AKTIF">Aktif ({activeFaqsCount})</option>
              <option value="DRAFT">Draft ({draftFaqsCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main FAQ Display Section */}
      {paginatedFaqs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#c4c8bc] p-12 text-center text-gray-500 space-y-3">
          <span className="material-symbols-outlined text-4xl text-gray-300">quiz</span>
          <p className="font-bold text-sm text-[#1d1b17]">
            Tidak ditemukan item FAQ yang sesuai
          </p>
          <p className="text-xs text-[#555] max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau bersihkan filter kategori untuk menampilkan seluruh data FAQ.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('SEMUA');
              setSelectedStatus('SEMUA');
            }}
            className="px-4 py-2 bg-[#f3ede6] hover:bg-[#e2dacd] text-[#162809] text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Bersihkan Filter
          </button>
        </div>
      ) : (
        /* TABLE MATRIX VIEW */
        <div className="bg-white rounded-2xl border border-[#c4c8bc] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f3ede6] text-[#44483f] font-bold uppercase tracking-wider border-b border-[#c4c8bc]">
                  <th className="p-3.5 pl-5">ID</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Pertanyaan</th>
                  <th className="p-3.5">Jawaban Ringkas</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c8bc]/30">
                {paginatedFaqs.map((f) => {
                  const isDraft = f.status === 'DRAFT';
                  return (
                    <tr key={f.id} className="hover:bg-[#f9f3ec]/60 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-[#162809]">{f.id}</td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-[#f3ede6] text-[#162809] font-bold rounded-md border border-[#c4c8bc]/50 text-[10px]">
                          {f.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-[#1d1b17] max-w-xs">{f.question}</td>
                      <td className="p-3.5 text-gray-600 max-w-sm truncate">{f.answer}</td>
                      <td className="p-3.5">
                        {isDraft ? (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px]">
                            DRAFT
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                            AKTIF
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onToggleStatus && (
                            <button
                              type="button"
                              onClick={() => onToggleStatus(f.id)}
                              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"
                              title="Ubah Status"
                            >
                              <span className="material-symbols-outlined text-base">
                                {isDraft ? 'visibility' : 'visibility_off'}
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenEditFaq(f)}
                            className="p-1.5 text-[#162809] hover:bg-gray-100 rounded-lg cursor-pointer font-bold"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFaqToDelete(f)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="p-4 bg-white rounded-2xl border border-[#c4c8bc] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#44483f]">
          <p>
            Menampilkan{' '}
            <strong className="text-[#1d1b17]">
              {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)}
            </strong>{' '}
            dari <strong className="text-[#1d1b17]">{totalItems}</strong> Pertanyaan FAQ
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#c4c8bc] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  currentPage === page
                    ? 'bg-[#162809] text-white'
                    : 'bg-white border border-[#c4c8bc] text-[#44483f] hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#c4c8bc] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <FaqDeleteConfirmModal
        isOpen={!!faqToDelete}
        faq={faqToDelete}
        onClose={() => setFaqToDelete(null)}
        onConfirmDelete={(id) => {
          onDeleteFaq(id);
          showToast('FAQ berhasil dihapus.');
        }}
      />
    </div>
  );
};
