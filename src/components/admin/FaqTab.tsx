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
  showToast: (msg: string, type?: 'success' | 'error') => void;
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
  const itemsPerPage = 10;
  // Maks 10 tombol halaman yang tampil sekaligus (window)
  const MAX_PAGE_BUTTONS = 10;



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
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#556353] dark:text-white/60 mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#1F5132] dark:text-[#86EFAC] font-bold">Kelola FAQ</li>
            </ol>
          </nav>
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-extrabold text-[#14331C] dark:text-[#F4F8F3] tracking-tight">
            Kelola Pertanyaan Umum (FAQ)
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenCreateFaq}
          className="bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs self-start sm:self-auto active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Tambah FAQ</span>
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white dark:bg-[#0E1A11] p-4 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#122316] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#3A8F4B] text-[#1F5132] dark:text-[#F4F8F3] font-medium"
          />
        </div>

        {/* Filters & View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-[#F9FBF7] dark:bg-[#122316] border border-[#E2EFE0] dark:border-white/10 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-medium text-[#556353] dark:text-white/60">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-[#1F5132] dark:text-[#86EFAC] focus:outline-none cursor-pointer pr-1"
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
          <div className="flex items-center gap-1.5 bg-[#F9FBF7] dark:bg-[#122316] border border-[#E2EFE0] dark:border-white/10 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-medium text-[#556353] dark:text-white/60">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-transparent text-xs font-bold text-[#1F5132] dark:text-[#86EFAC] focus:outline-none cursor-pointer pr-1"
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
        <div className="bg-white dark:bg-[#0E1A11] rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] p-12 text-center text-gray-500 space-y-3 shadow-2xs">
          <span className="material-symbols-outlined text-4xl text-gray-300">quiz</span>
          <p className="font-bold text-sm text-[#1F5132] dark:text-[#86EFAC]">
            Tidak ditemukan item FAQ yang sesuai
          </p>
          <p className="text-xs text-[#556353] dark:text-white/60 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau bersihkan filter kategori untuk menampilkan seluruh data FAQ.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('SEMUA');
              setSelectedStatus('SEMUA');
            }}
            className="px-4 py-2 bg-[#F9FBF7] hover:bg-[#EAF6E8] text-[#1F5132] dark:text-[#86EFAC] text-xs font-bold rounded-xl transition-colors cursor-pointer border border-[#E2EFE0]"
          >
            Bersihkan Filter
          </button>
        </div>
      ) : (
        /* TABLE MATRIX VIEW */
        <div className="bg-white dark:bg-[#0E1A11] rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F2F7F0] dark:bg-[#152718] border-b border-[#E2EFE0] dark:border-white/10 text-[#1F5132] dark:text-[#86EFAC]">
                  <th className="p-3.5 pl-5 font-extrabold uppercase tracking-wider">Kategori</th>
                  <th className="p-3.5 font-extrabold uppercase tracking-wider">Pertanyaan</th>
                  <th className="p-3.5 font-extrabold uppercase tracking-wider">Jawaban Ringkas</th>
                  <th className="p-3.5 font-extrabold uppercase tracking-wider">Status</th>
                  <th className="p-3.5 pr-5 text-right font-extrabold uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2EFE0] dark:divide-white/10">
                {paginatedFaqs.map((f) => {
                  const isDraft = f.status === 'DRAFT';
                  return (
                    <tr key={f.id} className="hover:bg-[#E8F5E9]/60 transition-colors">
                      <td className="p-3.5 pl-5 font-semibold text-[#1F5132] dark:text-[#86EFAC] text-xs">
                        {f.category}
                      </td>
                      <td className="p-3.5 font-bold text-[#1B5E20] max-w-xs">{f.question}</td>
                      <td className="p-3.5 text-[#555555] max-w-sm truncate">{f.answer}</td>
                      <td className="p-3.5">
                        {isDraft ? (
                          <span className="px-2.5 py-0.5 bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2] font-bold rounded-full text-[10px]">
                            DRAFT
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7] font-bold rounded-full text-[10px]">
                            AKTIF
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onToggleStatus && (
                            <button
                              type="button"
                              onClick={() => onToggleStatus(f.id)}
                              title={isDraft ? 'Aktifkan FAQ (tampilkan di publik)' : 'Nonaktifkan FAQ (sembunyikan dari publik)'}
                              className={`w-10 rounded-full transition-colors relative p-0.5 cursor-pointer self-center ${isDraft ? 'bg-gray-300' : 'bg-[#2E7D32]'
                                }`}
                              style={{ height: '22px', width: '40px' }}
                            >
                              <div
                                className="rounded-full bg-white shadow-sm"
                                style={{ width: '16px', height: '16px', transform: isDraft ? 'translateX(0)' : 'translateX(20px)', transition: 'transform 0.2s' }}
                              />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenEditFaq(f)}
                            className="w-9 h-9 rounded-xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] inline-flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFaqToDelete(f)}
                            className="w-9 h-9 rounded-xl bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#D32F2F] inline-flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                            title="Hapus"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
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
        <div className="p-4 bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#555555]">
          <p>
            Menampilkan{' '}
            <strong className="text-[#1B5E20]">
              {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)}
            </strong>{' '}
            dari <strong className="text-[#1B5E20]">{totalItems}</strong> Pertanyaan FAQ
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F7F8F6] cursor-pointer text-[#1B5E20]"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>

            {(() => {
              const half = Math.floor(MAX_PAGE_BUTTONS / 2);
              let start = Math.max(1, currentPage - half);
              const end = Math.min(totalPages, start + MAX_PAGE_BUTTONS - 1);
              start = Math.max(1, end - MAX_PAGE_BUTTONS + 1);
              const pages = [];

              if (start > 1) {
                pages.push(
                  <button
                    key="first"
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer bg-[#FFFFFF] border border-[#E0E0E0] text-[#555555] hover:bg-[#F7F8F6]"
                  >
                    1
                  </button>
                );
                if (start > 2) {
                  pages.push(
                    <span key="dots-start" className="px-1 text-gray-400">
                      ...
                    </span>
                  );
                }
              }

              for (let page = start; page <= end; page++) {
                pages.push(
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      currentPage === page
                        ? 'bg-[#1B5E20] text-white shadow-2xs'
                        : 'bg-[#FFFFFF] border border-[#E0E0E0] text-[#555555] hover:bg-[#F7F8F6]'
                    }`}
                  >
                    {page}
                  </button>
                );
              }

              if (end < totalPages) {
                if (end < totalPages - 1) {
                  pages.push(
                    <span key="dots-end" className="px-1 text-gray-400">
                      ...
                    </span>
                  );
                }
                pages.push(
                  <button
                    key="last"
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer bg-[#FFFFFF] border border-[#E0E0E0] text-[#555555] hover:bg-[#F7F8F6]"
                  >
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F7F8F6] cursor-pointer text-[#1B5E20]"
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
