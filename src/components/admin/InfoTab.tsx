import React from 'react';
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
        {articles.map((art) => (
          <div
            key={art.id}
            className="p-5 rounded-xl border border-[#c4c8bc] bg-[#f9f3ec] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#d2eabb] text-[#162809] rounded-md">
                {art.category}
              </span>
              <h4 className="font-bold text-base text-[#1d1b17] mt-1">{art.title}</h4>
              <p className="text-xs text-[#44483f] mt-1">
                Oleh <span className="font-semibold">{art.author}</span> • Diterbitkan {art.date} • {art.views} Pembaca
              </p>
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
    </div>
  );
};
