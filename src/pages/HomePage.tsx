import React, { useState, useEffect } from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { ProductCard } from '../components/ProductCard';
import { BenefitsSection } from '../components/BenefitsSection';
import { Product, Article } from '../types';
import { useApp } from '../context/AppContext';

interface HomePageProps {
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onClickProduct: (product: Product) => void;
  onSelectArticle: (article: Article) => void;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
}

export const HomePage: React.FC<HomePageProps> = ({
  onAddToCart,
  onClickProduct,
  setActiveTab,
  searchQuery,
}) => {
  const { t, products: allProducts, landingContent } = useApp();
  const [selectedCategory] = useState('semua');
  const [sortBy] = useState('populer');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Filter products reactively from centralized state
  useEffect(() => {
    setLoadingProducts(true);
    let result = [...allProducts];

    if (selectedCategory && selectedCategory !== 'semua' && selectedCategory !== 'all') {
      const cat = selectedCategory.toLowerCase();
      result = result.filter((p) => p.category === cat);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q)
      );
    }

    if (sortBy) {
      if (sortBy === 'harga-terendah') {
        result.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'harga-tertinggi') {
        result.sort((a, b) => b.price - a.price);
      }
    }

    setProducts(result);
    setLoadingProducts(false);
  }, [allProducts, selectedCategory, sortBy, searchQuery]);

  return (
    <div className="animate-fadeIn bg-[#faf8f5]">
      {/* Hero Banner Section */}
      <HeroBanner
        onShopNow={() => {
          const target = document.getElementById('product-catalog-section');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          } else {
            setActiveTab('produk');
          }
        }}
      />

      {/* 1. Benefits / Education Section */}
      <BenefitsSection />

      {/* 2. Brand Story Section (Kisah Kami) */}
      <section className="py-20 bg-white border-b border-[#c4c8bc]/30">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative rounded-xl overflow-hidden shadow-sm max-h-[420px] border border-[#c4c8bc]/40">
            <img
              src={landingContent.storyImageUrl}
              alt="Petani Sorgum Bestari"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#162809]/40 to-transparent"></div>
          </div>
          <div className="space-y-6">
            <span className="text-[#162809] font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-widest bg-[#fade88]/30 px-3 py-1 rounded border border-[#fade88]/40">
              {t(landingContent.storyTaglineId, landingContent.storyTaglineEn)}
            </span>
            <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[#162809] leading-tight">
              {t(landingContent.storyTitleId, landingContent.storyTitleEn)}
            </h2>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f]/90 leading-relaxed font-semibold">
              {t(landingContent.storyDesc1Id, landingContent.storyDesc1En)}
            </p>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f]/80 leading-relaxed font-normal">
              {t(landingContent.storyDesc2Id, landingContent.storyDesc2En)}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Section Title: Koleksi Produk Pilihan */}
      <div id="product-catalog-section" className="text-center pt-20 pb-10 px-4 md:px-10">
        <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#162809] mb-4">
          {t(landingContent.featuredTitleId, landingContent.featuredTitleEn)}
        </h2>
        <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f]/80 max-w-xl mx-auto leading-relaxed font-semibold">
          {t(landingContent.featuredDescId, landingContent.featuredDescEn)}
        </p>
      </div>

      {/* 4. Featured Products Grid */}
      <section className="pb-20 md:pb-24 px-4 md:px-10 bg-transparent">
        <div className="max-w-[1280px] mx-auto">
          {searchQuery && (
            <div className="mb-6 p-4 bg-white rounded-xl border border-[#c4c8bc]/50 flex items-center justify-between shadow-2xs">
              <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f]">
                {t('Menampilkan hasil pencarian untuk', 'Showing search results for')} &quot;<span className="font-bold text-[#1d1b17]">{searchQuery}</span>&quot;
              </p>
              <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#162809] bg-[#fade88]/30 px-2.5 py-0.5 rounded border border-[#fade88]/50">
                {products.length} {t('produk ditemukan', 'products found')}
              </span>
            </div>
          )}

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-80 rounded-xl bg-[#faf8f5]/80 animate-pulse border border-[#c4c8bc]/30 shadow-2xs"
                ></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-[#c4c8bc]/50 p-8 shadow-2xs">
              <span className="material-symbols-outlined text-5xl text-[#75786e] mb-2 animate-pulse">search_off</span>
              <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#162809] mb-1">
                {t('Produk Tidak Ditemukan', 'Product Not Found')}
              </h3>
              <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f]/80">
                {t('Coba gunakan kata kunci lain atau ganti kategori filter.', 'Try using other keywords or change the category filter.')}
              </p>
            </div>
          ) : (
            <div className="w-full">
              {/* Hyperlink aligned to the right (top-right of the 4th card) */}
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('produk')}
                  className="flex items-center gap-1.5 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold text-[#162809] hover:text-[#715c13] transition-colors cursor-pointer group"
                >
                  <span>{t('Lihat Seluruh Produk', 'View All Products')}</span>
                  <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                {products.slice(0, 4).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    onClickProduct={onClickProduct}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
