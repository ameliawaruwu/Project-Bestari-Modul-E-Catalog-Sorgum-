import React from 'react';
import { Product } from '../../types';
import { AdminActiveNav } from '../../types/admin';
import { useApp } from '../../context/AppContext';

interface DashboardTabProps {
  products: Product[];
  setActiveNav: (nav: AdminActiveNav) => void;
  articlesCount?: number;
  faqsCount?: number;
  bannersCount?: number;
  onNavigateHome?: () => void;
  onOpenCreateProduct?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  products,
  setActiveNav,
  articlesCount = 0,
  faqsCount = 0,
  bannersCount = 0,
  onNavigateHome,
  onOpenCreateProduct,
}) => {
  const { shopSettings, landingContent } = useApp();
  const totalProductsCount = products.length;

  const lowStockProducts = products.filter((p) => {
    const stock = p.stock ?? 0;
    return stock < 30;
  });

  let featuredCount = 0;
  try {
    const parsed = JSON.parse(landingContent.featuredProductIds || '[]');
    if (Array.isArray(parsed)) featuredCount = parsed.length;
  } catch {
    featuredCount = 0;
  }

  const safeStockPercentage = totalProductsCount > 0 
    ? Math.round(((totalProductsCount - lowStockProducts.length) / totalProductsCount) * 100) 
    : 100;

  return (
    <div className="space-y-6 animate-fadeIn pb-8 max-w-7xl mx-auto">
      {/* Breadcrumb & Welcome Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-semibold text-[#556353] dark:text-white/60 mb-1">
            <ol className="flex items-center space-x-2">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveNav('dashboard')}
                  className="hover:text-[#1F5132] dark:hover:text-[#86EFAC] transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#1F5132] dark:text-[#86EFAC] font-bold">Dashboard Utama</li>
            </ol>
          </nav>
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-extrabold text-[#14331C] dark:text-[#F4F8F3] tracking-tight">
            Ringkasan Operasional Toko
          </h2>
          <p className="text-xs text-[#556353] dark:text-white/60 mt-1">
            Pantau status inventori sorgum, katalog produk, artikel edukasi, dan informasi toko Anda secara real-time.
          </p>
        </div>
      </div>

      {/* 1. 4-Grid KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Produk */}
        <div className="bg-white dark:bg-[#0E1A11] rounded-2xl border-2 border-[#3A8F4B]/50 dark:border-[#3A8F4B]/40 p-5 flex flex-col justify-between min-h-[130px] shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[#2E6B3E] dark:text-[#86EFAC]/90 text-[10px] font-extrabold uppercase tracking-wider">
              Katalog Produk
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] border border-[#3A8F4B]/20 flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-xl">inventory_2</span>
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl sm:text-4xl font-black text-[#1F5132] dark:text-[#86EFAC] font-mono leading-none tracking-tight">
              {totalProductsCount}
            </h3>
            <p className="text-[11px] text-[#556353] dark:text-white/60 mt-1.5 font-medium">
              Varietas Olahan Sorgum
            </p>
          </div>
        </div>

        {/* KPI 2: Stok Menipis */}
        <div className={`bg-white dark:bg-[#0E1A11] rounded-2xl border-2 p-5 flex flex-col justify-between min-h-[130px] shadow-xs ${
          lowStockProducts.length > 0 
            ? 'border-[#D32F2F]/60 dark:border-[#D32F2F]/50' 
            : 'border-[#3A8F4B]/50 dark:border-[#3A8F4B]/40'
        }`}>
          <div className="flex justify-between items-start">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
              lowStockProducts.length > 0 ? 'text-[#D32F2F] dark:text-[#F28B82]' : 'text-[#1E7E34] dark:text-[#81C995]'
            }`}>
              Status Stok
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-2xs ${
              lowStockProducts.length > 0 
                ? 'bg-[#FFEBEE] dark:bg-[#2A1215] text-[#D32F2F] border border-[#D32F2F]/20' 
                : 'bg-[#EAF6E8] dark:bg-[#152718] text-[#3A8F4B] border border-[#3A8F4B]/20'
            }`}>
              <span className="material-symbols-outlined text-xl">
                {lowStockProducts.length > 0 ? 'warning' : 'check_circle'}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <h3 className={`font-black font-mono leading-none tracking-tight ${
              lowStockProducts.length > 0 
                ? 'text-3xl sm:text-4xl text-[#D32F2F]' 
                : 'text-2xl sm:text-3xl text-[#137333] dark:text-[#81C995]'
            }`}>
              {lowStockProducts.length > 0 ? lowStockProducts.length : 'Aman'}
            </h3>
            <p className={`text-[11px] mt-1.5 font-bold ${
              lowStockProducts.length > 0 ? 'text-[#D32F2F]' : 'text-[#3A8F4B]'
            }`}>
              {lowStockProducts.length > 0 ? `${lowStockProducts.length} Produk Perlu Restock` : 'Semua Stok Tercukupi'}
            </p>
          </div>
        </div>

        {/* KPI 3: Artikel & Informasi */}
        <div className="bg-white dark:bg-[#0E1A11] rounded-2xl border-2 border-[#E3B84B]/70 dark:border-[#E3B84B]/50 p-5 flex flex-col justify-between min-h-[130px] shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[#92400E] dark:text-[#FDE68A]/90 text-[10px] font-extrabold uppercase tracking-wider">
              Artikel &amp; Info
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FFFDF5] dark:bg-[#1C2818] text-[#E3B84B] border border-[#E3B84B]/30 flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-xl">info</span>
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl sm:text-4xl font-black text-[#92400E] dark:text-[#FDE68A] font-mono leading-none tracking-tight">
              {articlesCount}
            </h3>
            <p className="text-[11px] text-[#556353] dark:text-white/60 mt-1.5 font-medium">
              Edukasi &amp; Resep Sorgum
            </p>
          </div>
        </div>

        {/* KPI 4: FAQ & Bantuan */}
        <div className="bg-white dark:bg-[#0E1A11] rounded-2xl border-2 border-[#0284C7]/50 dark:border-[#0284C7]/40 p-5 flex flex-col justify-between min-h-[130px] shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[#075985] dark:text-[#7DD3FC]/90 text-[10px] font-extrabold uppercase tracking-wider">
              FAQ Pelanggan
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F0F9FF] dark:bg-[#0C2438] text-[#0284C7] border border-[#0284C7]/20 flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-xl">quiz</span>
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-3xl sm:text-4xl font-black text-[#0369A1] dark:text-[#7DD3FC] font-mono leading-none tracking-tight">
              {faqsCount}
            </h3>
            <p className="text-[11px] text-[#556353] dark:text-white/60 mt-1.5 font-medium">
              Pertanyaan Terjawab
            </p>
          </div>
        </div>

      </div>

      {/* 2. Quick Action Hub */}
      <div className="bg-white dark:bg-[#0E1A11] rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E2EFE0] dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-lg text-[#1F5132] dark:text-[#86EFAC]">bolt</span>
            <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-extrabold text-[#1F5132] dark:text-[#F4F8F3] uppercase tracking-wider">
              Akses Cepat Pengelolaan
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-[#556353] dark:text-white/60">
            Pintasan Utama
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => {
              if (onOpenCreateProduct) onOpenCreateProduct();
              else setActiveNav('produk');
            }}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] hover:bg-[#EAF6E8] dark:hover:bg-[#1B2C1F] hover:border-[#3A8F4B]/50 transition-all text-left cursor-pointer group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] border border-[#3A8F4B]/20 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-xl">inventory_2</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] group-hover:text-[#3A8F4B] transition-colors">
                Kelola Produk
              </p>
              <p className="text-[10px] text-[#556353] dark:text-white/60 truncate">Input &amp; katalog olahan sorgum</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('landing')}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] hover:bg-[#EAF6E8] dark:hover:bg-[#1B2C1F] hover:border-[#3A8F4B]/50 transition-all text-left cursor-pointer group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] border border-[#3A8F4B]/20 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-xl">web</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] group-hover:text-[#3A8F4B] transition-colors">
                Pengaturan Landing Page
              </p>
              <p className="text-[10px] text-[#556353] dark:text-white/60 truncate">Banner slide &amp; produk pilihan</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('info')}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] hover:bg-[#EAF6E8] dark:hover:bg-[#1B2C1F] hover:border-[#3A8F4B]/50 transition-all text-left cursor-pointer group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] border border-[#3A8F4B]/20 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-xl">info</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] group-hover:text-[#3A8F4B] transition-colors">
                Kelola Info
              </p>
              <p className="text-[10px] text-[#556353] dark:text-white/60 truncate">Publikasi artikel &amp; resep</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('faq')}
            className="flex items-center gap-3 p-3 rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] hover:bg-[#EAF6E8] dark:hover:bg-[#1B2C1F] hover:border-[#3A8F4B]/50 transition-all text-left cursor-pointer group shadow-2xs"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] border border-[#3A8F4B]/20 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-xl">quiz</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] group-hover:text-[#3A8F4B] transition-colors">
                Kelola FAQ
              </p>
              <p className="text-[10px] text-[#556353] dark:text-white/60 truncate">Tanya jawab pelanggan</p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. 2-Column Bottom Layout: Low Stock Warning & Store Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Peringatan Stok Low & Inventori */}
        <div className="bg-white dark:bg-[#0E1A11] rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#E2EFE0] dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-[#1F5132] dark:text-[#86EFAC]">inventory</span>
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-sm text-[#1F5132] dark:text-[#F4F8F3] uppercase tracking-wider">
                Inventori &amp; Stok Produk
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] border border-[#3A8F4B]/20">
              {safeStockPercentage}% Stok Aman
            </span>
          </div>

          {/* Health Bar */}
          <div className="w-full bg-[#E2EFE0] dark:bg-white/10 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] h-full rounded-full transition-all duration-500" 
              style={{ width: `${safeStockPercentage}%` }} 
            />
          </div>

          {/* List Produk Low Stock */}
          <div className="space-y-2.5">
            {lowStockProducts.length === 0 ? (
              <div className="p-5 text-center bg-[#F9FBF7] dark:bg-[#122316] rounded-xl border border-[#E2EFE0] dark:border-white/10">
                <span className="material-symbols-outlined text-3xl text-[#3A8F4B] mb-1">verified</span>
                <p className="text-xs text-[#1F5132] dark:text-[#86EFAC] font-bold">Seluruh Stok Produk Berada dalam Tingkat Aman</p>
                <p className="text-[10px] text-[#556353] dark:text-white/60 mt-0.5">Tidak ada produk dengan stok di bawah 30 unit.</p>
              </div>
            ) : (
              lowStockProducts.map((p) => {
                const stock = p.stock ?? 0;
                return (
                  <div
                    key={p.id}
                    className="p-3 bg-[#F9FBF7] dark:bg-[#122316] rounded-xl border border-[#E2EFE0] dark:border-white/10 flex items-center justify-between transition-all hover:bg-[#EAF6E8] dark:hover:bg-[#162B1C]"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[#E2EFE0] dark:border-white/10 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-[#1F5132] dark:text-[#F4F8F3] truncate">{p.name}</p>
                        <p className="text-[10px] text-[#556353] dark:text-white/60 font-medium">{p.categoryLabel}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <span className="font-extrabold text-xs text-[#D32F2F] font-mono block">
                        {stock} Unit
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveNav('produk')}
                        className="text-[10px] bg-[#1F5132] hover:bg-[#14331C] text-white px-3 py-1 rounded-lg transition-all cursor-pointer font-bold inline-block mt-1 text-center shadow-3xs"
                      >
                        Restock
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Identitas & Konfigurasi Toko */}
        <div className="bg-white dark:bg-[#0E1A11] rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#E2EFE0] dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-[#1F5132] dark:text-[#86EFAC]">storefront</span>
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-sm text-[#1F5132] dark:text-[#F4F8F3] uppercase tracking-wider">
                Informasi &amp; Konfigurasi Toko
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('lain')}
              className="text-[10px] font-bold text-[#3A8F4B] hover:text-[#1F5132] dark:hover:text-[#86EFAC] transition-colors cursor-pointer"
            >
              Ubah Pengaturan
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Store Name & WA */}
            <div className="p-3.5 bg-[#F9FBF7] dark:bg-[#122316] rounded-xl border border-[#E2EFE0] dark:border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-[#556353] dark:text-white/60 tracking-wider">Nama Brand Toko</p>
                <p className="font-bold text-sm text-[#1F5132] dark:text-[#F4F8F3] mt-0.5">
                  {shopSettings.storeName || 'BESTARI Sorgum'}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EAF6E8] text-[#1F5132] dark:bg-[#152718] dark:text-[#86EFAC]">
                Aktif
              </span>
            </div>

            <div className="p-3.5 bg-[#F9FBF7] dark:bg-[#122316] rounded-xl border border-[#E2EFE0] dark:border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-[#556353] dark:text-white/60 tracking-wider">WhatsApp Pemesanan</p>
                <p className="font-bold text-xs text-[#1F5132] dark:text-[#F4F8F3] font-mono mt-0.5">
                  {shopSettings.whatsappNumber || '+62 812-3456-7890'}
                </p>
              </div>
              <span className="material-symbols-outlined text-[#25D366] text-xl">
                chat
              </span>
            </div>

            {/* Landing Page Status */}
            <div className="p-3.5 bg-[#F9FBF7] dark:bg-[#122316] rounded-xl border border-[#E2EFE0] dark:border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-[#556353] dark:text-white/60 tracking-wider">Status Beranda &amp; Carousel</p>
                <p className="font-bold text-xs text-[#1F5132] dark:text-[#F4F8F3] mt-0.5">
                  {bannersCount} Banner Aktif • {featuredCount} Produk Pilihan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNav('landing')}
                className="text-[10px] font-bold text-[#3A8F4B] hover:underline cursor-pointer"
              >
                Kelola
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardTab;

