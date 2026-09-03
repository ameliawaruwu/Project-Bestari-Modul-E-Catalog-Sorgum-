import React, { useState, useEffect, useCallback } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { productApi } from '../api/productApi';
import { realtimeApi } from '../api/realtimeApi';

interface ProductsPageProps {
  onClickProduct: (product: Product) => void;
  searchQuery: string;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  onClickProduct,
  searchQuery,
}) => {
  const { t } = useApp();
  const [sortBy, setSortBy] = useState<'populer' | 'harga-terendah' | 'harga-tertinggi' | 'terbaru'>('populer');
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync parent search query changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery || '');
  }, [searchQuery]);

  // Load products from backend
  const loadProducts = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    productApi
      .getProducts({ searchQuery: localSearchQuery, sortBy })
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [localSearchQuery, sortBy]);

  useEffect(() => {
    return loadProducts();
  }, [loadProducts]);

  // Realtime update subscriber
  useEffect(() => {
    const unsub = realtimeApi.on('products', () => {
      loadProducts();
    });
    return () => unsub();
  }, [loadProducts]);

  return (
    <div className="pt-6 sm:pt-8 pb-16 px-4 md:px-8 max-w-[1180px] mx-auto animate-fadeIn min-h-screen">

      {/* Filter and Search Panel */}
      <div className="bg-white dark:bg-[#121C14] p-3.5 sm:p-4 rounded-xl border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs mb-6 space-y-4 transition-colors duration-300">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555555] dark:text-[#94A390] text-base select-none">
              search
            </span>
            <input
              type="text"
              placeholder={t('Cari produk sorgum (misal: beras, tepung, camilan)...', 'Search sorghum products (e.g. rice, flour, snacks)...')}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-[#F9FBF7] dark:bg-[#162419] focus:bg-white dark:focus:bg-[#1B2C1F] rounded-xl border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.2)] font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#1F5132] dark:text-[#F4F7F2] placeholder-[#555555]/60 dark:placeholder-[#94A390]/60 focus:outline-none focus:border-[#3A8F4B] dark:focus:border-[#A5D6A7] focus:ring-1 focus:ring-[#3A8F4B] transition-all font-medium"
            />
            {localSearchQuery && (
              <button
                type="button"
                onClick={() => setLocalSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#555555] dark:text-[#94A390] hover:text-[#1F5132] dark:hover:text-[#A5D6A7] text-base focus:outline-none cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
          
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2.5 bg-[#F9FBF7] dark:bg-[#162419] px-3.5 py-2.5 rounded-xl border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.2)] shrink-0">
            <span className="font-['Plus_Jakarta_Sans'] text-xs font-semibold text-[#555555] dark:text-[#94A390]">{t('Urutkan:', 'Sort By:')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'populer' | 'harga-terendah' | 'harga-tertinggi' | 'terbaru')}
              className="bg-transparent border-none font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold text-[#1F5132] dark:text-[#A5D6A7] focus:ring-0 cursor-pointer outline-none"
            >
              <option value="populer" className="bg-white dark:bg-[#121C14] text-black dark:text-white">{t('Populer', 'Popular')}</option>
              <option value="harga-terendah" className="bg-white dark:bg-[#121C14] text-black dark:text-white">{t('Harga Terendah', 'Lowest Price')}</option>
              <option value="harga-tertinggi" className="bg-white dark:bg-[#121C14] text-black dark:text-white">{t('Harga Tertinggi', 'Highest Price')}</option>
              <option value="terbaru" className="bg-white dark:bg-[#121C14] text-black dark:text-white">{t('Terbaru', 'Newest')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 py-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-72 rounded-xl bg-white dark:bg-[#121C14] animate-pulse border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.15)] shadow-2xs"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#121C14] rounded-xl border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.15)] p-6 shadow-sm my-4">
          <span className="material-symbols-outlined text-4xl text-[#FADE88] mb-1.5 animate-pulse">search_off</span>
          <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#162809] dark:text-[#F4F7F2] mb-0.5">
            {t('Produk Tidak Ditemukan', 'Product Not Found')}
          </h3>
          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555E54] dark:text-[#C4CDC1]">
            {t('Tidak ada produk yang cocok dengan kata kunci pencarian atau kategori filter Anda.', 'No products match your search keywords or filter category.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 py-2">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onClickProduct={onClickProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
