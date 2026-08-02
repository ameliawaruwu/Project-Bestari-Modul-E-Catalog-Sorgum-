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
      className="bg-white rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md group cursor-pointer border border-[#c4c8bc]/50 shadow-2xs"
    >
      <div className="h-56 w-full overflow-hidden relative bg-[#faf8f5] border-b border-[#c4c8bc]/20">
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <div className="p-6 sm:p-7 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-3">
          <span className="bg-[#fade88] text-[#162809] border border-[#162809]/10 px-3 py-0.5 rounded-md font-['Roboto'] text-[11px] font-bold uppercase tracking-wider shadow-2xs">
            {article.category}
          </span>
          <span className="text-[#75786e] font-['Roboto'] text-xs font-semibold">
            {article.readTime || '5 Menit Baca'}
          </span>
        </div>

        <h3 className="font-['Roboto'] text-base sm:text-lg font-bold text-[#162809] mb-2 group-hover:text-[#2b3e1d] transition-colors leading-snug">
          {article.title}
        </h3>

        <p className="font-['Roboto'] text-xs sm:text-sm text-[#44483f]/80 mb-5 line-clamp-3 leading-relaxed font-normal">
          {article.snippet}
        </p>

        <div className="mt-auto flex items-center gap-1.5 text-[#162809] font-bold text-xs sm:text-sm group-hover:text-[#2b3e1d] transition-all">
          <span>{t('Baca Selengkapnya', 'Read More')}</span>
          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </div>
      </div>
    </article>
  );
};
