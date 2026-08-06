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
                    ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white border-[#2E7D32] shadow-2xs'
                    : 'bg-[#FFFFFF] text-[#1B5E20] border-[#E0E0E0] hover:bg-[#E8F5E9]'
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
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] p-12 text-center text-gray-500 space-y-3 shadow-2xs">
            <span className="material-symbols-outlined text-4xl text-[#C89B3C]">search_off</span>
            <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1B5E20]">{t('Pertanyaan Tidak Ditemukan', 'Question Not Found')}</h3>
            <p className="text-xs sm:text-sm text-[#555555] max-w-md mx-auto">
              {t('Maaf, kami tidak menemukan FAQ yang cocok dengan kata kunci', 'Sorry, we did not find any FAQ matching the keyword')} &quot;<strong className="text-[#1B5E20]">{searchQuery}</strong>&quot; {t('di kategori ini.', 'in this category.')}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
              }}
              className="px-5 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
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
                  className={`bg-[#FFFFFF] rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? 'border-[#2E7D32] border-l-4 shadow-2xs'
                      : 'border-[#E0E0E0] shadow-2xs hover:border-[#2E7D32]/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-5 text-left flex justify-between items-center gap-4 group cursor-pointer focus:outline-none"
                  >
                    <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[#1B5E20] text-sm sm:text-base group-hover:text-[#2E7D32] transition-colors leading-snug">
                      {item.question}
                    </h3>
                    <span
                      className={`material-symbols-outlined text-xl text-[#1B5E20] transition-transform duration-300 flex-shrink-0 ${
                        isOpen ? 'rotate-180 text-[#2E7D32]' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 text-[#555555] font-['Plus_Jakarta_Sans'] text-xs sm:text-sm leading-relaxed border-t border-[#E0E0E0] animate-fadeIn bg-[#F7F8F6]">
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

