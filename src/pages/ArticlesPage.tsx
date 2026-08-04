import React, { useState, useEffect } from 'react';
import { ArticleCard } from '../components/ArticleCard';
import { Article } from '../types';
import { useApp } from '../context/AppContext';
import { articleApi } from '../api/articleApi';

interface ArticlesPageProps {
  selectedArticle?: Article | null;
  onClearSelectedArticle?: () => void;
}

export const ArticlesPage: React.FC<ArticlesPageProps> = ({
  selectedArticle,
  onClearSelectedArticle,
}) => {
  const { t } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState<Article | null>(selectedArticle || null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (selectedArticle) {
      setActiveArticle(selectedArticle);
    }
  }, [selectedArticle]);

  // Load articles from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    articleApi
      .getArticles()
      .then((list) => {
        if (!cancelled) setAllArticles(list);
      })
      .catch(() => {
        if (!cancelled) setAllArticles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter out promotional articles — they appear only in Checkout
  const publicArticles = allArticles.filter(
    (a) => a.category !== 'Promosi' && a.category !== 'Promotion'
  );


  const categories = [t('Semua', 'All'), t('Budidaya', 'Cultivation'), t('Nutrisi', 'Nutrition'), t('Inspirasi', 'Inspiration')];

  const filteredArticles = publicArticles.filter((art) => {
    const matchesCategory = selectedCategory === 'Semua' || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCardClick = async (article: Article) => {
    // Fetch full article (content, subImage, quote, facts) from backend by slug
    const full = await articleApi.getArticleBySlug(article.slug);
    setActiveArticle(full || article);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setActiveArticle(null);
    if (onClearSelectedArticle) {
      onClearSelectedArticle();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If viewing article detail
  if (activeArticle) {
    const paragraphs = activeArticle.content.split('\n\n');
    const firstPara = paragraphs[0] || '';
    const otherParas = paragraphs.slice(1);

    return (
      <div className="pt-28 sm:pt-32 pb-20 px-4 md:px-10 max-w-[1280px] mx-auto animate-fadeIn min-h-screen">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-8 inline-flex items-center gap-2 bg-[#2b3e1d] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[#162809] transition-all shadow-sm cursor-pointer btn-hover-effect"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>{t('Kembali ke Artikel', 'Back to Articles')}</span>
        </button>

        {/* Editorial Header Section */}
        <header className="mb-12 text-center max-w-4xl mx-auto">
          <span className="bg-[#fade88] text-[#162809] border border-[#162809]/10 px-4 py-1 rounded-full font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-widest inline-block mb-6 shadow-2xs">
            {activeArticle.category}
          </span>
          <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl md:text-5xl font-bold text-[#162809] mb-6 leading-tight">
            {activeArticle.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-[#44483f] font-['Plus_Jakarta_Sans'] text-xs sm:text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#162809] text-[20px]">person</span>
              <span>
                {activeArticle.author}
                {activeArticle.authorRole && (
                  <span className="opacity-70 italic">, {activeArticle.authorRole}</span>
                )}
              </span>
            </div>
            <div className="w-1.5 h-1.5 bg-[#c4c8bc] rounded-full hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#162809] text-[20px]">
                calendar_today
              </span>
              <span>{activeArticle.date}</span>
            </div>
          </div>
        </header>

        {/* Hero Image Section */}
        <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden mb-16 shadow-md group bg-[#dfd9d3] border border-[#c4c8bc]/20">
          <img
            src={activeArticle.image}
            alt={activeArticle.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        </div>

        {/* Article Layout: Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Article Body */}
          <article className="lg:col-span-8 space-y-8 font-['Plus_Jakarta_Sans']">
            <p className="text-[#1d1b17] text-base md:text-lg leading-relaxed first-letter:float-left first-letter:text-5xl first-letter:leading-[4rem] first-letter:pr-3 first-letter:font-['Playfair_Display'] first-letter:font-bold first-letter:text-[#162809]">
              {firstPara}
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-[#162809] pt-2">
              {t('Mengapa Sorgum?', 'Why Sorghum?')}
            </h2>

            {otherParas[0] && (
              <p className="text-[#1d1b17] text-base md:text-lg leading-relaxed font-normal">
                {otherParas[0]}
              </p>
            )}

            {/* Quote Block */}
            {activeArticle.quote && (
              <div className="bg-[#faf8f5] p-8 rounded-xl border-l-4 border-[#162809] italic text-[#2b3e1d] font-['Plus_Jakarta_Sans'] text-base md:text-lg my-8 leading-relaxed shadow-3xs border-t border-r border-b border-[#c4c8bc]/30">
                "{activeArticle.quote}"
              </div>
            )}

            {otherParas[1] && (
              <p className="text-[#1d1b17] text-base md:text-lg leading-relaxed font-normal">
                {otherParas[1]}
              </p>
            )}

            {/* Sub-Image */}
            {activeArticle.subImage && (
              <div className="relative rounded-xl overflow-hidden h-80 md:h-96 my-8 group shadow-sm bg-[#dfd9d3] border border-[#c4c8bc]/20">
                <img
                  src={activeArticle.subImage}
                  alt="Sub content"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            )}

            {otherParas.slice(2).map((p, idx) => (
              <p key={idx} className="text-[#1d1b17] text-base md:text-lg leading-relaxed font-normal">
                {p}
              </p>
            ))}
          </article>

          {/* Right: Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Sorghum Facts Card */}
            <section className="bg-white p-8 rounded-xl shadow-2xs border border-[#c4c8bc]/50">
              <h3 className="text-2xl font-bold text-[#162809] mb-6">
                {t('Sorgum Facts', 'Sorghum Facts')}
              </h3>
              <ul className="space-y-5">
                {(
                  activeArticle.facts || [
                    { title: 'Gluten-Free', desc: 'Aman 100% untuk diet bebas gandum.' },
                    { title: 'High Fiber', desc: 'Mendukung pencernaan yang optimal.' },
                    { title: 'Low Glycemic Index', desc: 'Membantu mengontrol gula darah.' },
                    { title: 'Rich in Antioxidants', desc: 'Melindungi sel tubuh dari radikal bebas.' },
                  ]
                ).map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-[#715c13] pt-0.5 text-xl">
                      check_circle
                    </span>
                    <div>
                      <span className="font-bold text-[#162809] block text-base font-['Plus_Jakarta_Sans']">
                        {fact.title}
                      </span>
                      <span className="text-[#44483f] text-xs sm:text-sm font-['Plus_Jakarta_Sans']">{fact.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Read Other Articles */}
            <section className="bg-white p-6 rounded-xl border border-[#c4c8bc]/50 shadow-2xs">
              <h4 className="text-lg font-bold text-[#162809] mb-4">
                {t('Artikel Lainnya', 'Other Articles')}
              </h4>
              <div className="space-y-4">
                {publicArticles
                  .filter((a) => a.id !== activeArticle.id)
                  .slice(0, 3)
                  .map((other) => (
                    <div
                      key={other.id}
                      onClick={() => handleCardClick(other)}
                      className="flex gap-3 items-center cursor-pointer group hover:bg-[#faf8f5] p-2 rounded-xl transition-all"
                    >
                      <img
                        src={other.image}
                        alt={other.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-[#c4c8bc]/20"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-[#715c13] uppercase tracking-wider block font-['Plus_Jakarta_Sans']">
                          {other.category}
                        </span>
                        <h5 className="text-sm font-bold text-[#162809] line-clamp-2 group-hover:text-[#715c13] transition-colors">
                          {other.title}
                        </h5>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  // Articles List View
  return (
    <div className="pt-28 sm:pt-32 pb-20 px-4 md:px-10 max-w-[1280px] mx-auto animate-fadeIn min-h-screen">

      {/* Filter and Search Panel */}
      <div className="bg-white p-6 rounded-xl border border-[#c4c8bc]/50 shadow-2xs mb-10 space-y-6">
        {/* Search Input */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#75786e] text-lg select-none">
            search
          </span>
          <input
            type="text"
            placeholder={t('Cari artikel (misal: budidaya, celiac, serat, resep)...', 'Search articles (e.g. cultivation, celiac, fiber, recipes)...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-[#faf8f5] rounded-xl border border-[#c4c8bc]/50 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#1d1b17] placeholder-[#75786e]/60 focus:outline-none focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#75786e] hover:text-[#1d1b17] text-lg focus:outline-none cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-5 border-t border-[#c4c8bc]/20">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none cursor-pointer ${
                  isActive
                    ? 'bg-[#2b3e1d] text-white shadow-xs'
                    : 'bg-[#faf8f5] hover:bg-[#ede7e1] text-[#1d1b17] border border-[#c4c8bc]/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Article Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-white animate-pulse border border-[#c4c8bc]/50 rounded-xl shadow-2xs"></div>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#c4c8bc]/50 p-8 shadow-2xs my-4">
          <span className="material-symbols-outlined text-5xl text-[#75786e] mb-2 animate-pulse">search_off</span>
          <h3 className="text-xl font-bold text-[#162809] mb-1">
            {t('Artikel Tidak Ditemukan', 'Article Not Found')}
          </h3>
          <p className="text-xs sm:text-sm text-[#44483f]/80">
            {t('Tidak ada artikel yang cocok dengan kata kunci pencarian atau kategori filter Anda.', 'No articles match your search keywords or filter category.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-2">
          {filteredArticles.map((art) => (
            <ArticleCard key={art.id} article={art} onSelectArticle={handleCardClick} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredArticles.length > 0 && (
        <div className="mt-16 flex justify-center items-center gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#c4c8bc]/60 text-[#44483f] hover:bg-[#2b3e1d] hover:text-white hover:border-[#2b3e1d] transition-all cursor-pointer bg-white">
            <span className="material-symbols-outlined text-xl">chevron_left</span>
          </button>
          <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#2b3e1d] text-white font-['Plus_Jakarta_Sans'] font-bold text-sm shadow-xs">
            1
          </span>
          <span className="w-10 h-10 flex items-center justify-center rounded-xl text-[#44483f] font-['Plus_Jakarta_Sans'] font-semibold text-sm hover:bg-[#faf8f5] border border-[#c4c8bc]/50 cursor-pointer transition-colors bg-white">
            2
          </span>
          <span className="w-10 h-10 flex items-center justify-center rounded-xl text-[#44483f] font-['Plus_Jakarta_Sans'] font-semibold text-sm hover:bg-[#faf8f5] border border-[#c4c8bc]/50 cursor-pointer transition-colors bg-white">
            3
          </span>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#c4c8bc]/60 text-[#44483f] hover:bg-[#2b3e1d] hover:text-white hover:border-[#2b3e1d] transition-all cursor-pointer bg-white">
            <span className="material-symbols-outlined text-xl">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
};
