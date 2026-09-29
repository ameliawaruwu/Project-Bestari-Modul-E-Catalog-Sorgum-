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
          Di layar ≥sm: kembali ke tata letak vertikal seperti semula. */}
      <div className="w-32 sm:w-full h-auto sm:h-48 shrink-0 overflow-hidden relative bg-[#F7F5EF] dark:bg-[#1f1d18] border-r sm:border-r-0 sm:border-b border-[#E2EAE0] dark:border-white/10">
        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full min-h-[96px] flex flex-col items-center justify-center gap-2 text-[#245B3A] dark:text-[#EAF4E8]">
            <span className="material-symbols-outlined text-4xl">article</span>
            <span className="text-[10px] font-bold text-[#6B756D] dark:text-white/60 uppercase tracking-wider hidden sm:block">
              {t('Tanpa Gambar', 'No Image')}
            </span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-5 flex flex-col flex-grow min-w-0">
        <div className="flex justify-between items-center gap-2 mb-1.5 sm:mb-2">
          <span className="bg-[#EAF4E8] dark:bg-white/10 text-[#245B3A] dark:text-[#EAF4E8] border border-[#245B3A]/20 px-2 py-0.5 sm:px-2.5 rounded-md font-['Plus_Jakarta_Sans'] text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-2xs truncate">
            {article.category}
          </span>
          <span className="text-[#6B756D] dark:text-white/60 font-['Plus_Jakarta_Sans'] text-[10px] sm:text-[11px] font-medium whitespace-nowrap shrink-0">
            {article.readTime || '5 Menit Baca'}
          </span>
        </div>

        <h3 className="font-['Plus_Jakarta_Sans'] text-sm sm:text-base font-bold text-[#24352A] dark:text-white mb-1 sm:mb-1.5 group-hover:text-[#245B3A] dark:group-hover:text-[#EAF4E8] transition-colors leading-snug line-clamp-2 sm:line-clamp-none">
          {article.title}
        </h3>

        <p className="font-['Plus_Jakarta_Sans'] text-[11px] sm:text-xs text-[#6B756D] dark:text-white/70 mb-0 sm:mb-3.5 line-clamp-2 leading-relaxed font-normal">
          {article.snippet}
        </p>

        <div className="mt-auto hidden sm:flex items-center justify-end text-[#245B3A] dark:text-[#EAF4E8] font-bold text-xs">
          <span className="group-hover:underline transition-all">{t('Baca Selengkapnya', 'Read More')}</span>
        </div>

        {/* Di HP: panah kecil sebagai penanda kartu bisa dibuka */}
        <div className="mt-auto sm:hidden flex items-center justify-end pt-1 text-[#245B3A] dark:text-[#EAF4E8]">
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </div>
      </div>
    </article>
  );
};

