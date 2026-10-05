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
      className="bg-white dark:bg-[#161410] rounded-xl overflow-hidden flex flex-row sm:flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-md group cursor-pointer border border-[#E2EAE0] dark:border-white/10 shadow-2xs hover:border-[#3E7A4B]/40"
    >
      {/* Di HP: gambar di kiri (kartu horizontal, hemat tinggi & cepat dipindai).
          Di layar ≥sm: proporsional & compact di desktop zoom 100%. */}
      <div className="w-28 sm:w-full h-auto sm:h-36 md:h-40 shrink-0 overflow-hidden relative bg-[#F7F5EF] dark:bg-[#1f1d18] border-r sm:border-r-0 sm:border-b border-[#E2EAE0] dark:border-white/10">
        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-1.5 text-[#245B3A] dark:text-[#EAF4E8]">
            <span className="material-symbols-outlined text-3xl">article</span>
            <span className="text-[9px] font-bold text-[#6B756D] dark:text-white/60 uppercase tracking-wider hidden sm:block">
              {t('Tanpa Gambar', 'No Image')}
            </span>
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-3.5 flex flex-col flex-grow min-w-0">
        <div className="flex justify-between items-center gap-2 mb-1 sm:mb-1.5">
          <span className="bg-[#EAF4E8] dark:bg-white/10 text-[#245B3A] dark:text-[#EAF4E8] border border-[#245B3A]/20 px-1.5 py-0.5 sm:px-2 rounded font-['Plus_Jakarta_Sans'] text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-2xs truncate">
            {article.category}
          </span>
          <span className="text-[#6B756D] dark:text-white/60 font-['Plus_Jakarta_Sans'] text-[9px] sm:text-[10px] font-medium whitespace-nowrap shrink-0">
            {article.readTime || '5 Menit Baca'}
          </span>
        </div>

        <h3 className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold text-[#24352A] dark:text-white mb-1 group-hover:text-[#245B3A] dark:group-hover:text-[#EAF4E8] transition-colors leading-snug line-clamp-2">
          {article.title}
        </h3>

        <p className="font-['Plus_Jakarta_Sans'] text-[11px] sm:text-xs text-[#6B756D] dark:text-white/70 mb-0 sm:mb-2 line-clamp-2 leading-relaxed font-normal">
          {article.snippet}
        </p>

        <div className="mt-auto pt-1.5 flex items-center justify-end">
          <div
            className="shrink-0 w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-md bg-[#EAF4E8] dark:bg-white/10 group-hover:bg-[#245B3A] text-[#245B3A] dark:text-[#EAF4E8] group-hover:text-white transition-all duration-200 flex items-center justify-center shadow-2xs group-hover:scale-105"
            aria-label={t('Baca Selengkapnya', 'Read More')}
          >
            <span className="material-symbols-outlined text-sm sm:text-base transition-transform group-hover:translate-x-0.5">
              chevron_right
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

