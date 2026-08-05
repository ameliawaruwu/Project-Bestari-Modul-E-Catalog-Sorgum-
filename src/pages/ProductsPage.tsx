import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { productApi } from '../api/productApi';

interface ProductsPageProps {
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onClickProduct: (product: Product) => void;
  searchQuery: string;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  onAddToCart,
  onClickProduct,
  searchQuery,
}) => {
  const { t } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [sortBy, setSortBy] = useState('populer');
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync parent search query changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery || '');
  }, [searchQuery]);

  // Load products from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productApi
      .getProducts({ category: selectedCategory, searchQuery: localSearchQuery, sortBy })
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, localSearchQuery, sortBy]);

  const categories = [
    { id: 'semua', label: t('Semua', 'All') },
    { id: 'beras', label: t('Beras Sorgum', 'Sorghum Rice') },
    { id: 'tepung', label: t('Tepung Sorgum', 'Sorghum Flour') },
    { id: 'camilan', label: t('Camilan', 'Snacks') },
    { id: 'benih', label: t('Benih', 'Seeds') },
  ];

  return (
    <div className="pt-28 sm:pt-32 pb-20 px-4 md:px-10 max-w-[1280px] mx-auto animate-fadeIn min-h-screen">

      {/* Filter and Search Panel */}
      <div className="bg-white p-6 rounded-xl border border-[#c4c8bc]/50 shadow-2xs mb-10 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#75786e] text-lg select-none">
              search
            </span>
            <input
              type="text"
              placeholder={t('Cari produk sorgum (misal: beras, tepung, camilan)...', 'Search sorghum products (e.g. rice, flour, snacks)...')}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-[#faf8f5] rounded-xl border border-[#c4c8bc]/50 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#1d1b17] placeholder-[#75786e]/60 focus:outline-none focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all"
            />
            {localSearchQuery && (
              <button
                type="button"
                onClick={() => setLocalSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#75786e] hover:text-[#1d1b17] text-lg focus:outline-none cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
          
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-3 bg-[#faf8f5] px-4 py-3 rounded-xl border border-[#c4c8bc]/50 shrink-0">
            <span className="font-['Plus_Jakarta_Sans'] text-xs font-semibold text-[#44483f]">{t('Urutkan:', 'Sort By:')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold text-[#1d1b17] focus:ring-0 cursor-pointer outline-none"
            >
              <option value="populer">{t('Populer', 'Popular')}</option>
              <option value="harga-terendah">{t('Harga Terendah', 'Lowest Price')}</option>
              <option value="harga-tertinggi">{t('Harga Tertinggi', 'Highest Price')}</option>
              <option value="terbaru">{t('Terbaru', 'Newest')}</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-5 border-t border-[#c4c8bc]/20">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-xl font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none cursor-pointer ${
                  isActive
                    ? 'bg-[#2b3e1d] text-white shadow-xs'
                    : 'bg-[#faf8f5] hover:bg-[#ede7e1] text-[#1d1b17] border border-[#c4c8bc]/50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-80 rounded-xl bg-white animate-pulse border border-[#c4c8bc]/50 shadow-2xs"
            ></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#c4c8bc]/50 p-8 shadow-2xs my-4">
          <span className="material-symbols-outlined text-5xl text-[#75786e] mb-2 animate-pulse">search_off</span>
          <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#162809] mb-1">
            {t('Produk Tidak Ditemukan', 'Product Not Found')}
          </h3>
          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f]/80">
            {t('Tidak ada produk yang cocok dengan kata kunci pencarian atau kategori filter Anda.', 'No products match your search keywords or filter category.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-2">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAddToCart={onAddToCart}
              onClickProduct={onClickProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};

