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
  // Nilai yang sudah "ditenang-kan" (debounced) — dipakai untuk request ke server.
  // Tanpa ini, tiap ketikan memicu 1 request (boros & hasil berkedip).
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync parent search query changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery || '');
  }, [searchQuery]);

  // Debounce input user (300ms) sebelum dikirim ke backend.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(localSearchQuery), 300);
    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  // Load products from backend — pencarian mencakup NAMA PRODUK & KATEGORI
  // (ditangani server-side di products_service.getProducts → filters.search).
  const loadProducts = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    productApi
      .getProducts({ searchQuery: debouncedSearch, sortBy })
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
  }, [debouncedSearch, sortBy]);

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
    <div className="pt-4 sm:pt-6 pb-12 px-4 md:px-6 w-full max-w-[1140px] mx-auto animate-fadeIn min-h-screen overflow-x-hidden">

      {/* Filter and Search Panel */}
      <div className="bg-white dark:bg-[#121C14] p-2.5 sm:p-3 rounded-lg border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs mb-4 space-y-2 sm:space-y-2.5 transition-colors duration-300">
        <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#555555] dark:text-[#94A390] text-sm select-none">
              search
            </span>
            <input
              type="text"
              placeholder={t('Cari produk atau kategori (misal: beras, camilan)...', 'Search product or category (e.g. rice, snacks)...')}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 h-[38px] py-2 bg-[#F9FBF7] dark:bg-[#162419] focus:bg-white dark:focus:bg-[#1B2C1F] rounded-lg border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.2)] font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#1F5132] dark:text-[#F4F7F2] placeholder-[#555555]/60 dark:placeholder-[#94A390]/60 focus:outline-none focus:border-[#3A8F4B] dark:focus:border-[#A5D6A7] focus:ring-1 focus:ring-[#3A8F4B] transition-all font-medium"
            />
            {localSearchQuery && (
              <button
                type="button"
                onClick={() => setLocalSearchQuery('')}
                aria-label={t('Hapus pencarian', 'Clear search')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555555] dark:text-[#94A390] hover:text-[#1F5132] dark:hover:text-[#A5D6A7] text-sm focus:outline-none cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
          
          {/* Sorting Dropdown — identik dengan search bar (tinggi, border, ikon, hover/focus) */}
          <div className="w-full md:w-auto h-[38px] flex items-center gap-2 bg-[#F9FBF7] dark:bg-[#162419] hover:bg-white dark:hover:bg-[#1B2C1F] px-3 rounded-lg border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.2)] hover:border-[#3A8F4B]/50 dark:hover:border-[#A5D6A7]/50 focus-within:border-[#3A8F4B] dark:focus-within:border-[#A5D6A7] focus-within:ring-1 focus-within:ring-[#3A8F4B] focus-within:bg-white dark:focus-within:bg-[#1B2C1F] transition-all shrink-0">
            <span className="material-symbols-outlined text-sm select-none text-[#555555] dark:text-[#94A390] shrink-0">
              sort
            </span>
            <span className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-medium text-[#555555] dark:text-[#94A390] whitespace-nowrap">
              {t('Urutkan:', 'Sort By:')}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'populer' | 'harga-terendah' | 'harga-tertinggi' | 'terbaru')}
              className="w-full md:w-auto bg-transparent border-none font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold text-[#1F5132] dark:text-[#A5D6A7] focus:ring-0 cursor-pointer outline-none"
            >
              <option value="populer" className="bg-white dark:bg-[#121C14] text-black dark:text-white">{t('Populer', 'Popular')}</option>
              <option value="harga-terendah" className="bg-white dark:bg-[#121C14] text-black dark:text-white">{t('Harga Terendah', 'Lowest Price')}</option>
              <option value="harga-tertinggi" className="bg-white dark:bg-[#121C14] text-black dark:text-white">{t('Harga Tertinggi', 'Highest Price')}</option>
              <option value="terbaru" className="bg-white dark:bg-[#121C14] text-black dark:text-white">{t('Terbaru', 'Newest')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid — 2 kolom di HP supaya tidak scroll panjang */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4 py-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-48 sm:h-64 rounded-xl bg-white dark:bg-[#121C14] animate-pulse border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.15)] shadow-2xs"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#121C14] rounded-xl border border-[#E2EAE0] dark:border-[rgba(165,214,167,0.15)] p-5 shadow-2xs my-3">
          <span className="material-symbols-outlined text-3xl text-[#FADE88] mb-1 animate-pulse">search_off</span>
          <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#162809] dark:text-[#F4F7F2] mb-0.5">
            {t('Produk Tidak Ditemukan', 'Product Not Found')}
          </h3>
          <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#555E54] dark:text-[#C4CDC1]">
            {t('Tidak ada produk yang cocok. Coba kata kunci lain — Anda bisa mencari nama produk atau kategori (misal: beras, tepung, camilan, pemanis, benih).', 'No matching products. Try another keyword — you can search by product name or category (e.g. rice, flour, snacks, sweetener, seeds).')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4 py-2">
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
