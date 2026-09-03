import React, { useState, useEffect } from 'react';
import { ArticleItem } from '../../types/admin';
import { ArticleDeleteConfirmModal } from './ArticleDeleteConfirmModal';

interface InfoTabProps {
  articles: ArticleItem[];
  onDeleteArticle: (article: ArticleItem) => void;
  onOpenCreateArticle: () => void;
  onOpenEditArticle: (article: ArticleItem) => void;
}

export const InfoTab: React.FC<InfoTabProps> = ({
  articles,
  onDeleteArticle,
  onOpenCreateArticle,
  onOpenEditArticle,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const MAX_PAGE_BUTTONS = 10;

  // Delete Confirmation Modal State
  const [articleToDelete, setArticleToDelete] = useState<ArticleItem | null>(null);

  // Reset ke halaman 1 saat daftar artikel berubah (mis. setelah save/delete)
  useEffect(() => {
    setCurrentPage(1);
  }, [articles.length]);

  const totalPages = Math.max(1, Math.ceil(articles.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedArticles = articles.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#556353] dark:text-white/60 mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#1F5132] dark:text-[#86EFAC] font-bold">Kelola Info</li>
            </ol>
          </nav>
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-extrabold text-[#14331C] dark:text-[#F4F8F3] tracking-tight">
            Kelola Artikel &amp; Informasi
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenCreateArticle}
          className="bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>TAMBAH ARTIKEL</span>
        </button>
      </div>

      <div className="space-y-3.5">
        {paginatedArticles.map((art) => (
          <div
            key={art.id}
            className="p-5 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] bg-white dark:bg-[#0E1A11] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#3A8F4B]/50 hover:shadow-2xs transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] rounded-md border border-[#3A8F4B]/20">
                  {art.category}
                </span>
                {art.isPublished !== undefined && (
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                    art.isPublished ? 'bg-[#EAF6E8] text-[#1F5132] dark:bg-[#152718] dark:text-[#86EFAC] border border-[#3A8F4B]/20' : 'bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${art.isPublished ? 'bg-[#3A8F4B]' : 'bg-[#E65100]'}`}></span>
                    {art.isPublished ? 'TERBIT' : 'DRAFT'}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-base md:text-lg text-[#14331C] dark:text-[#F4F8F3] font-['Plus_Jakarta_Sans'] leading-snug">
                {art.title}
              </h4>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#556353] dark:text-white/60">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#3A8F4B]">person</span>
                  <span>
                    Penulis: <span className="font-bold text-[#1F5132] dark:text-[#86EFAC]">{art.author}</span>
                  </span>
                </span>
                {art.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#E3B84B]">calendar_today</span>
                    <span>
                      Dibuat: <span className="font-semibold text-[#1F5132] dark:text-[#86EFAC]">{art.createdAt}</span>
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onOpenEditArticle(art)}
                className="w-9 h-9 rounded-xl bg-[#EAF6E8] hover:bg-[#D7EED3] dark:bg-[#152718] dark:hover:bg-[#1B3320] text-[#1F5132] dark:text-[#86EFAC] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="Edit artikel"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              <button
                type="button"
                onClick={() => setArticleToDelete(art)}
                className="w-9 h-9 rounded-xl bg-[#FFEBEE] hover:bg-[#FFCDD2] dark:bg-[#2A1215] dark:hover:bg-[#3B171B] text-[#D32F2F] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="Hapus artikel"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer — maks 10 item/halaman, window 10 tombol */}
      {articles.length > 0 && (
        <div className="p-4 bg-white dark:bg-[#0E1A11] rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#556353] dark:text-white/60">
          <p>
            Menampilkan{' '}
            <strong className="text-[#1F5132] dark:text-[#86EFAC]">
              {startIndex + 1} - {Math.min(startIndex + itemsPerPage, articles.length)}
            </strong>{' '}
            dari <strong className="text-[#1F5132] dark:text-[#86EFAC]">{articles.length}</strong> Artikel
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-[#122316] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EAF6E8] cursor-pointer text-[#1F5132] dark:text-[#86EFAC]"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>

            {(() => {
              const half = Math.floor(MAX_PAGE_BUTTONS / 2);
              let start = Math.max(1, safePage - half);
              const end = Math.min(totalPages, start + MAX_PAGE_BUTTONS - 1);
              start = Math.max(1, end - MAX_PAGE_BUTTONS + 1);
              const pages = [];
              if (start > 1) {
                pages.push(
                  <button
                    key="first"
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer bg-white dark:bg-[#122316] border border-[#E2EFE0] dark:border-white/10 text-[#556353] hover:bg-[#EAF6E8]"
                  >
                    1
                  </button>,
                  <span key="ellipsis-l" className="px-1 text-[#556353] text-xs">…</span>,
                );
              }
              for (let p = start; p <= end; p++) {
                pages.push(
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      safePage === p
                        ? 'bg-[#1F5132] text-white'
                        : 'bg-white dark:bg-[#122316] border border-[#E2EFE0] dark:border-white/10 text-[#556353] dark:text-white/60 hover:bg-[#EAF6E8]'
                    }`}
                  >
                    {p}
                  </button>
                );
              }
              if (end < totalPages) {
                pages.push(
                  <span key="ellipsis-r" className="px-1 text-[#556353] text-xs">…</span>,
                  <button
                    key="last"
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer bg-white dark:bg-[#122316] border border-[#E2EFE0] dark:border-white/10 text-[#556353] hover:bg-[#EAF6E8]"
                  >
                    {totalPages}
                  </button>,
                );
              }
              return pages;
            })()}

            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#E2EFE0] dark:border-white/10 bg-white dark:bg-[#122316] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EAF6E8] cursor-pointer text-[#1F5132] dark:text-[#86EFAC]"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
      {/* ARTICLE DELETE CONFIRMATION MODAL */}
      <ArticleDeleteConfirmModal
        isOpen={articleToDelete !== null}
        article={articleToDelete}
        onClose={() => setArticleToDelete(null)}
        onConfirmDelete={(id) => {
          onDeleteArticle(articleToDelete!);
          setArticleToDelete(null);
        }}
      />
    </div>
  );
};
