import React, { useState, useEffect, useMemo } from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { ProductCard } from '../components/ProductCard';
import { BenefitsSection } from '../components/BenefitsSection';
import { Product, Article } from '../types';
import { useApp } from '../context/AppContext';

interface HomePageProps {
  onClickProduct: (product: Product) => void;
  onSelectArticle: (article: Article) => void;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
}

export const HomePage: React.FC<HomePageProps> = ({
  onClickProduct,
  setActiveTab,
  searchQuery,
}) => {
  const { t, landingContent, currentUser, products } = useApp();
  // Produk dari context (AppContext hydrate fetch sekali saat mount). Dulu
  // halaman ini fetch sendiri (getProducts) → dobel request dengan context
  // (products di-fetch 2-6x). Sekarang pakai state context; skeleton hanya
  // tampil kalau context belum terisi.
  const [loadingProducts, setLoadingProducts] = useState(products.length === 0);

  // Filter search client-side (dulu di dalam fetch; sekarang dari context —
  // search di home tetap bekerja tanpa fetch ulang).
  const visibleProducts = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Produk yang tampil di section "Koleksi Produk Pilihan" —
  // diatur admin lewat Pengaturan Landing Page (featuredProductIds, JSON array of id).
  // Kosong (tidak ada dicentang) => section KOSONG, tidak ada fallback.
  const featuredProducts = useMemo(() => {
    if (!visibleProducts.length) return [];
    let featuredIds: string[] = [];
    try {
      const raw = landingContent.featuredProductIds || '';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) featuredIds = parsed.map(String);
    } catch {
      featuredIds = [];
    }
    return featuredIds
      .map((id) => visibleProducts.find((p) => String(p.id) === id))
      .filter(Boolean) as Product[];
  }, [visibleProducts, landingContent.featuredProductIds]);

  // Skeleton hilang otomatis saat context sudah menyediakan products
  // (AppContext hydrate fetch sekali saat mount; SSE sync update juga masuk
  // ke state yang sama — halaman tinggal render). Fallback timeout 3.5s:
  // kalau products benar-benar kosong (toko belum punya produk / fetch gagal),
  // skeleton tetap hilang → tampil "Produk Tidak Ditemukan".
  useEffect(() => {
    if (products.length > 0) setLoadingProducts(false);
    const timer = setTimeout(() => setLoadingProducts(false), 3500);
    return () => clearTimeout(timer);
  }, [products]);

  return (
    <div className="animate-fadeIn bg-[#F7F8F6]">
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
      <section className="py-20 bg-[#FFFFFF] border-b border-[#E0E0E0]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative rounded-2xl overflow-hidden shadow-2xs max-h-[420px] border border-[#E0E0E0]">
            <img
              src={landingContent.storyImageUrl}
              alt="Petani Sorgum Sorgum"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1B5E20]/40 to-transparent"></div>
          </div>
          <div className="space-y-6">
            <span className="text-[#1B5E20] font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-widest bg-[#E8F5E9] px-3 py-1 rounded-md border border-[#A5D6A7]">
              {t(landingContent.storyTaglineId, landingContent.storyTaglineEn)}
            </span>
            <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[#1B5E20] leading-tight">
              {t(landingContent.storyTitleId, landingContent.storyTitleEn)}
            </h2>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555] leading-relaxed font-semibold">
              {t(landingContent.storyDesc1Id, landingContent.storyDesc1En)}
            </p>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555] leading-relaxed font-normal">
              {t(landingContent.storyDesc2Id, landingContent.storyDesc2En)}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Section Title: Koleksi Produk Pilihan */}
      <div id="product-catalog-section" className="text-center pt-20 pb-10 px-4 md:px-10">
        <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1B5E20] mb-4">
          {t(landingContent.featuredTitleId, landingContent.featuredTitleEn)}
        </h2>
        <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555] max-w-xl mx-auto leading-relaxed font-semibold">
          {t(landingContent.featuredDescId, landingContent.featuredDescEn)}
        </p>
      </div>

      {/* 4. Featured Products Grid */}
      <section className="pb-20 md:pb-24 px-4 md:px-10 bg-transparent">
        <div className="max-w-[1280px] mx-auto">
          {searchQuery && (
            <div className="mb-6 p-4 bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] flex items-center justify-between shadow-2xs">
              <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555]">
                {t('Menampilkan hasil pencarian untuk', 'Showing search results for')} &quot;<span className="font-bold text-[#1B5E20]">{searchQuery}</span>&quot;
              </p>
              <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#1B5E20] bg-[#E8F5E9] px-2.5 py-0.5 rounded-md border border-[#A5D6A7]">
                {visibleProducts.length} {t('produk ditemukan', 'products found')}
              </span>
            </div>
          )}

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-80 rounded-2xl bg-[#FFFFFF] animate-pulse border border-[#E0E0E0] shadow-2xs"
                ></div>
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="text-center py-16 bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] p-8 shadow-2xs">
              <span className="material-symbols-outlined text-5xl text-[#C89B3C] mb-2 animate-pulse">search_off</span>
              <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1B5E20] mb-1">
                {t('Produk Tidak Ditemukan', 'Product Not Found')}
              </h3>
              <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555]">
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
                  className="flex items-center gap-1.5 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold text-[#2E7D32] hover:text-[#1B5E20] transition-colors cursor-pointer group"
                >
                  <span>{t('Lihat Seluruh Produk', 'View All Products')}</span>
                  <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClickProduct={onClickProduct}
                    onRequireLogin={() => setActiveTab('login')}
                    guestNonInteractive={!currentUser}
                    hideActions
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
