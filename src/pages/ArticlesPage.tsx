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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

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
    (a) => a.category !== 'Promosi'
  );


  const categories = [t('Semua', 'All'), t('Budidaya', 'Cultivation'), t('Nutrisi', 'Nutrition'), t('Inspirasi', 'Inspiration')];

  const filteredArticles = publicArticles.filter((art) => {
    const matchesCategory = selectedCategory === 'Semua' || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination asli
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageArticles = filteredArticles.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const goToPage = (p: number) => {
    setCurrentPage(Math.min(Math.max(1, p), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    // Content: blok terurut jika ada; fallback: content teks lama split \n\n
    const hasBlocks = Array.isArray(activeArticle.contentBlocks) && activeArticle.contentBlocks.length > 0;
    const blocks: Array<{ type: string; content?: string; image_url?: string; alt?: string; caption?: string; author?: string }> = hasBlocks
      ? activeArticle.contentBlocks!
      : activeArticle.content
        ? activeArticle.content
            .split('\n\n')
            .filter((p) => p.trim())
            .map((p) => ({ type: 'text', content: p }))
        : [];

    const renderBlock = (block: { type: string; content?: string; image_url?: string; alt?: string; caption?: string; author?: string }, idx: number) => {
      switch (block.type) {
        case 'image':
          return block.image_url ? (
            <figure key={idx} className="my-4">
              <div className="relative rounded-xl overflow-hidden h-80 md:h-96 my-8 group shadow-sm bg-[#dfd9d3] border border-[#E0E0E0]/20">
                <img
                  src={block.image_url}
                  alt={block.alt || activeArticle.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              {block.caption && (
                <figcaption className="text-center text-xs sm:text-sm text-[#75786e] italic mt-1 font-['Plus_Jakarta_Sans'] -mt-5">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          ) : null;

        case 'quote':
          return (
            <blockquote
              key={idx}
              className="bg-[#F7F8F6] p-8 rounded-xl border-l-4 border-[#1B5E20] italic text-[#1B5E20] font-['Plus_Jakarta_Sans'] text-base md:text-lg my-8 leading-relaxed shadow-2xs border-t border-r border-b border-[#E0E0E0]"
            >
              "{block.content}"
              {block.author && (
                <footer className="mt-3 text-right text-sm font-bold not-italic text-[#1B5E20]">
                  — {block.author}
                </footer>
              )}
            </blockquote>
          );

        case 'text':
        default:
          // Paragraf pertama: drop cap (mengikuti gaya artikel "Manfaat Sorghum")
          if (idx === 0) {
            return (
              <p
                key={idx}
                className="text-[#555555] text-base md:text-lg leading-relaxed first-letter:float-left first-letter:text-5xl first-letter:leading-[4rem] first-letter:pr-3 first-letter:font-['Playfair_Display'] first-letter:font-bold first-letter:text-[#1B5E20]"
              >
                {block.content}
              </p>
            );
          }
          return (
            <p key={idx} className="text-[#555555] text-base md:text-lg leading-relaxed font-normal">
              {block.content}
            </p>
          );
      }
    };

    return (
      <div className="pt-28 sm:pt-32 pb-20 px-4 md:px-10 max-w-[1280px] mx-auto animate-fadeIn min-h-screen">
        {/* Tombol Kembali */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-[#1B5E20] hover:text-[#2E7D32] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          <span>{t('Kembali ke Daftar Artikel', 'Back to Article List')}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Article Content */}
          <article className="lg:col-span-8 space-y-6">
            <header className="space-y-4">
              <span className="bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] px-3.5 py-1 rounded-md font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-wider shadow-2xs inline-block">
                {activeArticle.category}
              </span>
              <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1B5E20] leading-tight">
                {activeArticle.title}
              </h1>
              <div className="flex items-center gap-4 text-xs sm:text-sm text-[#555555] font-['Plus_Jakarta_Sans'] font-medium pt-2 border-b border-[#E0E0E0] pb-4">
                <span>{activeArticle.date || '3 November 2024'}</span>
                <span>•</span>
                <span>{activeArticle.readTime || '5 Menit Baca'}</span>
                <span>•</span>
                <span>Oleh: {activeArticle.author || 'Tim Ahli Gizi Sorgum'}</span>
              </div>
            </header>

            {/* Featured Hero Image */}
            <div className="relative rounded-2xl overflow-hidden h-80 md:h-[450px] shadow-2xs bg-[#F7F8F6] border border-[#E0E0E0]">
              <img
                src={activeArticle.image}
                alt={activeArticle.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Article Body Content */}
            <div className="space-y-6 pt-4 font-['Plus_Jakarta_Sans']">
              {blocks.map((block, idx) => renderBlock(block, idx))}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8 sticky top-28">
            {/* Sorgum Facts */}
            <section className="bg-[#FFFFFF] p-8 rounded-2xl shadow-2xs border border-[#E0E0E0]">
              <h3 className="text-2xl font-bold text-[#1B5E20] mb-6 font-['Playfair_Display']">
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
                    <span className="material-symbols-outlined text-[#2E7D32] pt-0.5 text-xl">
                      check_circle
                    </span>
                    <div>
                      <span className="font-bold text-[#1B5E20] block text-base font-['Plus_Jakarta_Sans']">
                        {fact.title}
                      </span>
                      <span className="text-[#555555] text-xs sm:text-sm font-['Plus_Jakarta_Sans']">{fact.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Read Other Articles */}
            <section className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs">
              <h4 className="text-lg font-bold text-[#1B5E20] mb-4 font-['Playfair_Display']">
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
                      className="flex gap-3 items-center cursor-pointer group hover:bg-[#E8F5E9] p-2 rounded-xl transition-all"
                    >
                      <img
                        src={other.image}
                        alt={other.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-[#E0E0E0]"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-[#2E7D32] uppercase tracking-wider block font-['Plus_Jakarta_Sans']">
                          {other.category}
                        </span>
                        <h5 className="text-sm font-bold text-[#1B5E20] line-clamp-2 group-hover:text-[#2E7D32] transition-colors font-['Playfair_Display']">
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
      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs mb-10 space-y-6">
        {/* Search Input */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#555555] text-lg select-none">
            search
          </span>
          <input
            type="text"
            placeholder={t('Cari artikel (misal: budidaya, celiac, serat, resep)...', 'Search articles (e.g. cultivation, celiac, fiber, recipes)...')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-10 py-3 bg-[#F7F8F6] focus:bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#1B5E20] placeholder-[#555555]/60 focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] transition-all font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#1B5E20] text-lg focus:outline-none cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-5 border-t border-[#E0E0E0]">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                className={`px-5 py-2.5 rounded-xl font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none cursor-pointer ${
                  isActive
                    ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-2xs'
                    : 'bg-[#F7F8F6] hover:bg-[#E8F5E9] text-[#1B5E20] border border-[#E0E0E0]'
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
            <div key={i} className="h-96 bg-[#FFFFFF] animate-pulse border border-[#E0E0E0] rounded-2xl shadow-2xs"></div>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-20 bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] p-8 shadow-2xs my-4">
          <span className="material-symbols-outlined text-5xl text-[#C89B3C] mb-2 animate-pulse">search_off</span>
          <h3 className="text-xl font-bold text-[#1B5E20] mb-1 font-['Playfair_Display']">
            {t('Artikel Tidak Ditemukan', 'Article Not Found')}
          </h3>
          <p className="text-xs sm:text-sm text-[#555555]">
            {t('Tidak ada artikel yang cocok dengan kata kunci pencarian atau kategori filter Anda.', 'No articles match your search keywords or filter category.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-2">
          {pageArticles.map((art) => (
            <ArticleCard key={art.id} article={art} onSelectArticle={handleCardClick} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredArticles.length > 0 && totalPages > 1 && (
        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage <= 1}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#E0E0E0] text-[#555555] hover:bg-[#2E7D32] hover:text-white hover:border-[#2E7D32] transition-all cursor-pointer bg-[#FFFFFF] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Halaman sebelumnya"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-sm transition-all cursor-pointer ${
                  p === safePage
                    ? 'bg-[#2E7D32] text-white shadow-2xs'
                    : 'text-[#555555] hover:bg-[#E8F5E9] border border-[#E0E0E0] bg-[#FFFFFF]'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage >= totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-[#E0E0E0] text-[#555555] hover:bg-[#2E7D32] hover:text-white hover:border-[#2E7D32] transition-all cursor-pointer bg-[#FFFFFF] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Halaman berikutnya"
            >
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </button>
          </div>
          <span className="text-xs text-[#555555] font-['Plus_Jakarta_Sans']">
            Menampilkan {Math.min(ITEMS_PER_PAGE, filteredArticles.length - (safePage - 1) * ITEMS_PER_PAGE)} dari {filteredArticles.length} artikel • Halaman {safePage}/{totalPages}
          </span>
        </div>
      )}
    </div>
  );
};
