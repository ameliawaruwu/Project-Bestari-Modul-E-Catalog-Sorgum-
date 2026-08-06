import React, { useState, useEffect } from 'react';
import { ArticleItem } from '../../types/admin';

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
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#44483f] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#162809] font-bold">Kelola Info</li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1d1b17]">
            Kelola Artikel &amp; Informasi
          </h2>
        </div>

        <button
          type="button"
          onClick={onOpenCreateArticle}
          className="bg-[#162809] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:opacity-90 cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>TAMBAH ARTIKEL</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#c4c8bc] p-6 shadow-xs space-y-4">
        {paginatedArticles.map((art) => (
          <div
            key={art.id}
            className="p-5 rounded-xl border border-[#c4c8bc] bg-[#f9f3ec] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#d2eabb] text-[#162809] rounded-md">
                {art.category}
              </span>
              <h4 className="font-bold text-base text-[#1d1b17] mt-1">{art.title}</h4>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#44483f] mt-1.5">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-[#715c13]">person</span>
                  <span>
                    Penulis: <span className="font-semibold">{art.author}</span>
                  </span>
                </span>
                {art.createdAt && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#715c13]">calendar_today</span>
                    <span>
                      Dibuat: <span className="font-semibold">{art.createdAt}</span>
                    </span>
                  </span>
                )}
                {art.isPublished !== undefined && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    art.isPublished ? 'bg-[#d2eabb] text-[#162809]' : 'bg-[#e3d5c0] text-[#755c1c]'
                  }`}>
                    {art.isPublished ? 'TERBIT' : 'DRAFT'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onOpenEditArticle(art)}
                className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                title="Edit artikel"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteArticle(art)}
                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
        <div className="p-4 bg-white rounded-2xl border border-[#c4c8bc] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#44483f]">
          <p>
            Menampilkan{' '}
            <strong className="text-[#1d1b17]">
              {startIndex + 1} - {Math.min(startIndex + itemsPerPage, articles.length)}
            </strong>{' '}
            dari <strong className="text-[#1d1b17]">{articles.length}</strong> Artikel
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#c4c8bc] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
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
                    className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer bg-white border border-[#c4c8bc] text-[#44483f] hover:bg-gray-50"
                  >
                    1
                  </button>,
                  <span key="ellipsis-l" className="px-1 text-[#44483f] text-xs">…</span>,
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
                        ? 'bg-[#162809] text-white'
                        : 'bg-white border border-[#c4c8bc] text-[#44483f] hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>,
                );
              }
              if (end < totalPages) {
                pages.push(
                  <span key="ellipsis-r" className="px-1 text-[#44483f] text-xs">…</span>,
                  <button
                    key="last"
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-7 h-7 rounded-lg text-xs font-bold cursor-pointer bg-white border border-[#c4c8bc] text-[#44483f] hover:bg-gray-50"
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
              className="p-1.5 rounded-lg border border-[#c4c8bc] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
