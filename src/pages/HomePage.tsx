import React, { useState, useEffect } from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { ProductCard } from '../components/ProductCard';
import { BenefitsSection } from '../components/BenefitsSection';
import { Product, Article } from '../types';
import { productApi } from '../api';
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
  const { t } = useApp();
  const [selectedCategory] = useState('semua');
  const [sortBy] = useState('populer');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Fetch products data using product API service
  useEffect(() => {
    const fetchProductsData = async () => {
      setLoadingProducts(true);
      try {
        const data = await productApi.getProducts({
          category: selectedCategory,
          searchQuery: searchQuery,
          sortBy: sortBy as any,
        });
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProductsData();
  }, [selectedCategory, sortBy, searchQuery]);

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
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBedFkef0uf3wThSykVry5S0pnKGNteDPCI4H_u9wXo2Iw6MB2JV9-GWbXBPiXoIINPGG_JNRn_oUg7XoFYH7bLYib2-pxC1R6SOqYMFKB6AYHi1lZWglunj0vDmRrLXAXarWaqQd_yPAqs39gyfrHheQ1wByPzSpB_9OZQV86FLWiUFhpsZ4tuUTDD6NKfMzT3xfwdnRJrmP6dxJnap7TErQ6DfJ3IoO2_VWWB3XP8JuMSECFMNiBl"
              alt="Petani Sorgum Bestari"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#162809]/40 to-transparent"></div>
          </div>
          <div className="space-y-6">
            <span className="text-[#162809] font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-widest bg-[#fade88]/30 px-3 py-1 rounded border border-[#fade88]/40">
              {t('Kisah Kami', 'Our Story')}
            </span>
            <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[#162809] leading-tight">
              {t('Kembalinya Warisan Pangan Leluhur Nusantara', 'The Return of the Ancestral Food Heritage of Nusantara')}
            </h2>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f]/90 leading-relaxed font-semibold">
              {t(
                'Di Bestari, kami percaya bahwa kesehatan sejati dimulai dari apa yang ditanam oleh alam secara murni. Bersama para petani mitra lokal, kami menghidupkan kembali sorgum—tanaman super (*superfood*) kaya serat and bebas gluten yang telah menutrisi generasi sebelum kita.',
                'At Bestari, we believe that true health starts from what nature grows purely. Together with local partner farmers, we revive sorghum—a fiber-rich and gluten-free superfood that has nourished generations before us.'
              )}
            </p>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f]/80 leading-relaxed font-normal">
              {t(
                'Setiap butir Bestari adalah wujud komitmen kami untuk menghadirkan kualitas terbaik dari tanah Indonesia langsung ke meja makan keluarga Anda, sambil melestarikan keseimbangan ekosistem bumi.',
                'Every grain of Bestari is a testament to our commitment to bringing the finest quality from Indonesian soil straight to your family dining table, while preserving the balance of the Earth\'s ecosystem.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Section Title: Koleksi Produk Pilihan */}
      <div id="product-catalog-section" className="text-center pt-20 pb-10 px-4 md:px-10">
        <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#162809] mb-4">
          {t('Koleksi Produk Pilihan', 'Featured Product Collection')}
        </h2>
        <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f]/80 max-w-xl mx-auto leading-relaxed font-semibold">
          {t(
            'Temukan berbagai olahan sorgum organik berkualitas tinggi, mulai dari beras sehat, tepung serbaguna, hingga camilan bergizi',
            'Discover a variety of high-quality organic sorghum products, ranging from healthy rice, all-purpose flour, to nutritious snacks.'
          )}
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
