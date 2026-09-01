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

  // Realtime: admin ubah produk → refetch list supaya user lihat langsung.
  // (AppContext juga refetch context products, tapi halaman ini pakai local
  //  state sendiri — subscribe di sini biar list yang terbuka ikut update.)
  useEffect(() => {
    const unsub = realtimeApi.on('products', () => {
      loadProducts();
    });
    return () => unsub();
  }, [loadProducts]);

  return (
    <div className="pt-24 sm:pt-28 pb-20 px-4 md:px-10 max-w-[1280px] mx-auto animate-fadeIn min-h-screen">

      {/* Filter and Search Panel */}
      <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#E0E0E0] shadow-2xs mb-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#555555] text-lg select-none">
              search
            </span>
            <input
              type="text"
              placeholder={t('Cari produk sorgum (misal: beras, tepung, camilan)...', 'Search sorghum products (e.g. rice, flour, snacks)...')}
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-[#F7F8F6] focus:bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#1B5E20] placeholder-[#555555]/60 focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] transition-all font-medium"
            />
            {localSearchQuery && (
              <button
                type="button"
                onClick={() => setLocalSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555555] hover:text-[#1B5E20] text-lg focus:outline-none cursor-pointer flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
          
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-3 bg-[#F7F8F6] px-4 py-3 rounded-xl border border-[#E0E0E0] shrink-0">
            <span className="font-['Plus_Jakarta_Sans'] text-xs font-semibold text-[#555555]">{t('Urutkan:', 'Sort By:')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'populer' | 'harga-terendah' | 'harga-tertinggi' | 'terbaru')}
              className="bg-transparent border-none font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold text-[#1B5E20] focus:ring-0 cursor-pointer outline-none"
            >
              <option value="populer">{t('Populer', 'Popular')}</option>
              <option value="harga-terendah">{t('Harga Terendah', 'Lowest Price')}</option>
              <option value="harga-tertinggi">{t('Harga Tertinggi', 'Highest Price')}</option>
              <option value="terbaru">{t('Terbaru', 'Newest')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-[#FFFFFF] animate-pulse border border-[#E0E0E0] shadow-2xs"
            ></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] p-8 shadow-2xs my-4">
          <span className="material-symbols-outlined text-5xl text-[#C89B3C] mb-2 animate-pulse">search_off</span>
          <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1B5E20] mb-1">
            {t('Produk Tidak Ditemukan', 'Product Not Found')}
          </h3>
          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555]">
            {t('Tidak ada produk yang cocok dengan kata kunci pencarian atau kategori filter Anda.', 'No products match your search keywords or filter category.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 py-2">
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

