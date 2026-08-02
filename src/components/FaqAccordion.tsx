import React, { useState } from 'react';
import { FaqItem } from '../types';
import { useApp } from '../context/AppContext';

interface FaqAccordionProps {
  faqs: FaqItem[];
  showContactCard?: boolean;
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ faqs, showContactCard = true }) => {
  const { t } = useApp();
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Get unique categories from faqs
  const uniqueCategories = ['Semua', ...Array.from(new Set(faqs.map((f) => f.category)))];

  // Filter FAQs based on search query and category tab
  const filteredFaqs = faqs.filter((item) => {
    // 1. Category Filter
    if (selectedCategory !== 'Semua' && item.category !== selectedCategory) {
      return false;
    }
    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 md:px-10 pt-8 pb-6">
      
      {/* 1. Filter Section */}
      <section className="max-w-3xl mx-auto mb-10 text-center">

        {/* Category Filter Pills (Horizontal & Centered) */}
        <div className="flex flex-wrap justify-center gap-2">
          {uniqueCategories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl font-['Plus_Jakarta_Sans'] text-xs font-bold transition-all duration-200 cursor-pointer focus:outline-none border ${
                  isActive
                    ? 'bg-[#2b3e1d] text-white border-[#2b3e1d] shadow-xs'
                    : 'bg-white text-[#1d1b17] border-[#c4c8bc]/50 hover:bg-[#faf8f5]'
                }`}
              >
                {cat === 'Semua' ? t('Semua', 'All') : cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Questions List (Full Width, Centered & Constrained) */}
      <div className="max-w-3xl mx-auto space-y-4 mb-4">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#c4c8bc]/50 p-12 text-center text-gray-500 space-y-3 shadow-2xs">
            <span className="material-symbols-outlined text-4xl text-[#75786e]">search_off</span>
            <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#162809]">{t('Pertanyaan Tidak Ditemukan', 'Question Not Found')}</h3>
            <p className="text-xs sm:text-sm text-[#44483f]/80 max-w-md mx-auto">
              {t('Maaf, kami tidak menemukan FAQ yang cocok dengan kata kunci', 'Sorry, we did not find any FAQ matching the keyword')} &quot;<strong className="text-[#2b3e1d]">{searchQuery}</strong>&quot; {t('di kategori ini.', 'in this category.')}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
              }}
              className="px-5 py-2.5 bg-[#2b3e1d] hover:bg-[#162809] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              {t('Lihat Semua Pertanyaan', 'View All Questions')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((item) => {
              const isOpen = !!openIds[item.id];
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? 'border-[#2b3e1d] border-l-4 shadow-3xs'
                      : 'border-[#c4c8bc]/50 shadow-2xs hover:border-[#c4c8bc]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-5 text-left flex justify-between items-center gap-4 group cursor-pointer focus:outline-none"
                  >
                    <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[#162809] text-sm sm:text-base group-hover:text-[#715c13] transition-colors leading-snug">
                      {item.question}
                    </h3>
                    <span
                      className={`material-symbols-outlined text-xl text-[#162809]/80 transition-transform duration-300 flex-shrink-0 ${
                        isOpen ? 'rotate-180 text-[#2b3e1d]' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 text-[#44483f]/90 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm leading-relaxed border-t border-[#c4c8bc]/10 animate-fadeIn bg-[#faf8f5]/50">
                      <p className="font-medium">{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

