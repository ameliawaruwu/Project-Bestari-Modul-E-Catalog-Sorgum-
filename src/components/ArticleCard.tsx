import React from 'react';
import { Article } from '../types';
import { useApp } from '../context/AppContext';

interface ArticleCardProps {
  article: Article;
  onSelectArticle: (article: Article) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onSelectArticle }) => {
  const { t } = useApp();
  return (
    <article
      onClick={() => onSelectArticle(article)}
      className="bg-[#FFFFFF] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md group cursor-pointer border border-[#E0E0E0] shadow-2xs"
    >
      <div className="h-56 w-full overflow-hidden relative bg-[#F7F8F6] border-b border-[#E0E0E0]">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <div className="p-6 sm:p-7 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-3">
          <span className="bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] px-3 py-0.5 rounded-md font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider shadow-2xs">
            {article.category}
          </span>
          <span className="text-[#555555] font-['Plus_Jakarta_Sans'] text-xs font-semibold">
            {article.readTime || '5 Menit Baca'}
          </span>
        </div>

        <h3 className="font-['Playfair_Display'] text-base sm:text-lg font-bold text-[#1B5E20] mb-2 group-hover:text-[#2E7D32] transition-colors leading-snug">
          {article.title}
        </h3>

        <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555] mb-5 line-clamp-3 leading-relaxed font-normal">
          {article.snippet}
        </p>

        <div className="mt-auto flex items-center gap-1.5 text-[#2E7D32] font-bold text-xs sm:text-sm group-hover:text-[#1B5E20] transition-all">
          <span>{t('Baca Selengkapnya', 'Read More')}</span>
          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </div>
      </div>
    </article>
  );
};
