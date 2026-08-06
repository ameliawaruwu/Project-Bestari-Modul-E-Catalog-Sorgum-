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
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#555555] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#1B5E20] font-bold">Kelola Info</li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1B5E20]">
            Kelola Artikel &amp; Informasi
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenCreateArticle}
          className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>TAMBAH ARTIKEL</span>
        </button>
      </div>

      <div className="space-y-3.5">
        {paginatedArticles.map((art) => (
          <div
            key={art.id}
            className="p-5 rounded-2xl border border-[#E0E0E0] bg-[#FFFFFF] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#2E7D32]/50 hover:shadow-2xs transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#E8F5E9] text-[#1B5E20] rounded-md border border-[#A5D6A7]">
                  {art.category}
                </span>
                {art.isPublished !== undefined && (
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                    art.isPublished ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#A5D6A7]' : 'bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${art.isPublished ? 'bg-[#2E7D32]' : 'bg-[#E65100]'}`}></span>
                    {art.isPublished ? 'TERBIT' : 'DRAFT'}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-base md:text-lg text-[#1B5E20] font-['Playfair_Display'] leading-snug">
                {art.title}
              </h4>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#555555]">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#2E7D32]">person</span>
                  <span>
                    Penulis: <span className="font-bold text-[#1B5E20]">{art.author}</span>
                  </span>
                </span>
                {art.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-[#C89B3C]">calendar_today</span>
                    <span>
                      Dibuat: <span className="font-semibold text-[#1B5E20]">{art.createdAt}</span>
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onOpenEditArticle(art)}
                className="w-9 h-9 rounded-xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                title="Edit artikel"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              <button
                type="button"
                onClick={() => setArticleToDelete(art)}
                className="w-9 h-9 rounded-xl bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#D32F2F] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
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
        <div className="p-4 bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#555555]">
          <p>
            Menampilkan{' '}
            <strong className="text-[#1B5E20]">
              {startIndex + 1} - {Math.min(startIndex + itemsPerPage, articles.length)}
            </strong>{' '}
            dari <strong className="text-[#1B5E20]">{articles.length}</strong> Artikel
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F7F8F6] cursor-pointer text-[#1B5E20]"
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
                    className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer bg-[#FFFFFF] border border-[#E0E0E0] text-[#555555] hover:bg-[#F7F8F6]"
                  >
                    1
                  </button>,
                  <span key="ellipsis-l" className="px-1 text-[#555555] text-xs">…</span>,
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
                        ? 'bg-[#2E7D32] text-white'
                        : 'bg-[#FFFFFF] border border-[#E0E0E0] text-[#555555] hover:bg-[#F7F8F6]'
                    }`}
                  >
                    {p}
                  </button>,
                );
              }
              if (end < totalPages) {
                pages.push(
                  <span key="ellipsis-r" className="px-1 text-[#555555] text-xs">…</span>,
                  <button
                    key="last"
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer bg-[#FFFFFF] border border-[#E0E0E0] text-[#555555] hover:bg-[#F7F8F6]"
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
              className="p-1.5 rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F7F8F6] cursor-pointer text-[#1B5E20]"
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
