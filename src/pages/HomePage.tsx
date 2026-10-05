import React, { useState, useEffect, useMemo } from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { ProductCard } from '../components/ProductCard';
import { Product, Article } from '../types';
import { useApp } from '../context/AppContext';
import { filterProductsBySearch } from '../utils/productSearch';

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
  const { t, landingContent, products, shopSettings } = useApp();
  const [loadingProducts, setLoadingProducts] = useState(products.length === 0);

  const cleanWaNumber = shopSettings.whatsappNumber.replace(/[^0-9]/g, '').replace(/^0/, '62');
  const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent('Halo Admin KWT Sorgum, saya ingin berkonsultasi mengenai produk/kemitraan sorgum.')}`;

  // Pencarian: nama produk ATAU kategori (mis. "camilan" → produk Camilan Sehat).
  // Pakai helper bersama supaya hasil di Beranda = halaman Produk (konsisten
  // dengan pencarian server-side di backend). Deskripsi tidak diikutkan lagi.
  const visibleProducts = useMemo(
    () => filterProductsBySearch(products, searchQuery),
    [products, searchQuery],
  );

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
    const matched = featuredIds
      .map((id) => visibleProducts.find((p) => String(p.id) === id))
      .filter(Boolean) as Product[];
    return matched.length > 0 ? matched : visibleProducts.slice(0, 4);
  }, [visibleProducts, landingContent.featuredProductIds]);

  useEffect(() => {
    if (products.length > 0) setLoadingProducts(false);
    const timer = setTimeout(() => setLoadingProducts(false), 3500);
    return () => clearTimeout(timer);
  }, [products]);

  return (
    <div className="animate-fadeIn bg-[#FFFDF5] dark:bg-[#08100A] min-h-screen transition-colors duration-300 relative overflow-hidden w-full max-w-full">
      
      {/* 1. Hero Banner Section */}
      <HeroBanner
        onShopNow={() => {
          // Arahkan langsung ke fitur produk (tab Produk), bukan scroll ke section
          // produk di beranda — keputusan user 2026-09-04.
          setActiveTab('produk');
        }}
        onReadMore={() => {
          setActiveTab('informasi');
        }}
      />

      {/* 2. Koleksi Produk Pilihan */}
      <div id="product-catalog-section" className="text-center pt-5 sm:pt-7 pb-3 px-4 sm:px-6 lg:px-8 max-w-[1140px] mx-auto relative z-10">
        <h2 className="font-['Plus_Jakarta_Sans'] text-lg sm:text-xl lg:text-2xl font-extrabold text-[#162809] dark:text-[#F4F8F3] tracking-tight">
          {t(landingContent.featuredTitleId || 'Koleksi Produk Pilihan SORGUM', landingContent.featuredTitleEn || 'Featured Sorghum Collection')}
        </h2>

        <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-[13px] text-[#6B756E] dark:text-[#CBD5C8] max-w-lg mx-auto leading-relaxed font-normal mt-1">
          {t(landingContent.featuredDescId || 'Pilihan olahan sorgum murni terbaik untuk kebutuhan sehari-hari Anda.', landingContent.featuredDescEn || 'The finest selection of pure sorghum products for your daily needs.')}
        </p>
      </div>

      {/* Featured Products Grid */}
      <section className="pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-[1140px] mx-auto bg-transparent relative z-10">
        <div>
          {searchQuery && (
            <div className="mb-3 p-2.5 sm:p-3 bg-white dark:bg-[#121C14] rounded-lg border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.15)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-2xs">
              <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#555E54] dark:text-[#C4CDC1] leading-relaxed">
                {t('Menampilkan hasil pencarian untuk', 'Showing search results for')} &quot;<span className="font-bold text-[#245B3A] dark:text-[#A5D6A7]">{searchQuery}</span>&quot;
              </p>
              <span className="font-['Plus_Jakarta_Sans'] text-[11px] font-bold text-[#245B3A] dark:text-[#A5D6A7] bg-[#EAF4E8] dark:bg-[#162419] px-2 py-0.5 rounded-full border border-[#245B3A]/20 self-start sm:self-auto whitespace-nowrap">
                {visibleProducts.length} {t('produk ditemukan', 'products found')}
              </span>
            </div>
          )}

          {loadingProducts ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4 py-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-48 sm:h-64 rounded-xl bg-white dark:bg-[#121C14] animate-pulse border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.15)] shadow-2xs"
                />
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-[#121C14] rounded-xl border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.15)] p-5 shadow-2xs">
              <span className="material-symbols-outlined text-3xl text-[#FADE88] mb-1 animate-pulse">search_off</span>
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#162809] dark:text-[#F4F7F2] mb-0.5">
                {t('Produk Tidak Ditemukan', 'Product Not Found')}
              </h3>
              <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#555E54] dark:text-[#C4CDC1]">
                {t('Coba gunakan kata kunci lain atau buka katalog lengkap.', 'Try using other keywords or open the full catalog.')}
              </p>
            </div>
          ) : (
            <div className="w-full">
              {/* Hyperlink aligned to the right (top-right of the 4th card) */}
              <div className="flex justify-end mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('produk')}
                  className="inline-flex items-center gap-1 font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#1F5132] dark:text-[#86EFAC] hover:text-[#162809] dark:hover:text-white transition-all duration-200 cursor-pointer group bg-white dark:bg-[#122316] hover:bg-[#F0F8EF] dark:hover:bg-[#162B1C] px-3 py-1.5 rounded-lg border border-[#C4C8BC]/40 dark:border-[rgba(165,214,167,0.25)] shadow-2xs hover:shadow-xs active:scale-[0.98]"
                >
                  <span>{t('Lihat Seluruh Produk', 'View All Products')}</span>
                  <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">
                    chevron_right
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4 w-full">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClickProduct={onClickProduct}
                    hideActions
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Partnership Banner Strip */}
      <section className="pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8 max-w-[1140px] mx-auto relative z-10">
        <div className="relative bg-gradient-to-r from-[#162809] via-[#213814] to-[#2B3E1D] dark:from-[#081206] dark:via-[#0F1E0C] dark:to-[#162809] rounded-xl p-4 sm:p-5 lg:p-6 text-white shadow-lg border border-[#3E5C2A]/35 overflow-hidden">
          {/* Subtle glow background */}
          <div className="absolute -right-16 -bottom-16 w-60 h-60 bg-[#52B55E]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
            <div className="space-y-1.5 text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-[#FADE88]/15 border border-[#FADE88]/25 px-2 py-0.5 rounded-full text-[11px] font-semibold text-[#FADE88]">
                <span className="material-symbols-outlined text-xs">handshake</span>
                <span>{t('Kemitraan & Pemesanan Khusus', 'Partnership & Inquiries')}</span>
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg lg:text-xl font-extrabold text-white leading-tight tracking-tight">
                {t('Butuh Pasokan Sorgum untuk Usaha Anda?', 'Need Sorghum Supply for Your Business?')}
              </h3>
              <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#E2EAE0]/85 leading-relaxed font-normal">
                {t('Kami melayani pemesanan skala retail, kemitraan restoran, produsen makanan sehat, dan hotel. Hubungi admin kami untuk informasi ketersediaan.', 'We serve retail, wholesale, restaurants, healthy food producers, and hospitality. Contact us for availability and pricing.')}
              </p>
            </div>

            {cleanWaNumber && (
            <div className="flex items-center justify-center shrink-0 w-full sm:w-auto">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white px-3.5 py-2 rounded-lg font-['Plus_Jakarta_Sans'] font-semibold text-xs sm:text-sm shadow-sm active:scale-95 transition-all duration-200 cursor-pointer w-full sm:w-auto text-center"
              >
                <span className="material-symbols-outlined text-base text-white">
                  call
                </span>
                <span>{t('Hubungi via WhatsApp', 'Contact via WhatsApp')}</span>
              </a>
            </div>
          )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
