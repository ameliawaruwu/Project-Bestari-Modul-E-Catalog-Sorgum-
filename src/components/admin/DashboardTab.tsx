import React from 'react';
import { Product } from '../../types';
import { AdminActiveNav } from '../../types/admin';

interface DashboardTabProps {
  products: Product[];
  setActiveNav: (nav: AdminActiveNav) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  products,
  setActiveNav,
}) => {
  const totalProductsCount = products.length;

  const lowStockProducts = products.filter((p) => {
    const stock = p.stock ?? 0;
    return stock < 30;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Breadcrumb & Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-semibold text-[#555555]/70 mb-1">
            <ol className="flex items-center space-x-2">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveNav('dashboard')}
                  className="hover:text-[#1B5E20] transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#1B5E20] font-bold">Dashboard Utama</li>
            </ol>
          </nav>
          <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
            Overview Dashboard
          </h2>
        </div>
      </div>

      {/* KPI Grid - Clean White Cards & Sorghum Palette */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Katalog Produk */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] p-5 flex flex-col justify-between min-h-[130px] shadow-2xs transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xs hover:border-[#C89B3C]/40">
          <div className="flex justify-between items-start">
            <span className="text-[#555555] text-[10px] font-extrabold uppercase tracking-wider">Katalog Produk</span>
            <button
              type="button"
              onClick={() => setActiveNav('produk')}
              className="w-9 h-9 rounded-xl bg-[#FFF8E1] border border-[#FFE082] hover:bg-[#FFECB3] flex items-center justify-center text-[#C89B3C] transition-colors cursor-pointer shadow-2xs"
              title="Kelola Produk"
            >
              <span className="material-symbols-outlined text-xl text-[#C89B3C]">inventory_2</span>
            </button>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-bold text-[#1B5E20] font-mono-custom leading-none">
              {totalProductsCount} Produk
            </h3>
            <p className="text-[10px] text-[#555555] mt-2 font-medium">Varietas Olahan Sorgum</p>
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] p-5 flex flex-col justify-between min-h-[130px] shadow-2xs transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xs hover:border-[#D32F2F]/40">
          <div className="flex justify-between items-start">
            <span className="text-[#555555] text-[10px] font-extrabold uppercase tracking-wider">Stok Menipis</span>
            <div className="w-9 h-9 rounded-xl bg-[#FFEBEE] border border-[#FFCDD2] flex items-center justify-center text-[#D32F2F] shadow-2xs">
              <span className="material-symbols-outlined text-xl text-[#D32F2F]">warning</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-bold text-[#1B5E20] font-mono-custom leading-none">
              Perlu Restock
            </h3>
            <p className="text-[10px] text-[#D32F2F] font-semibold mt-2 flex items-center gap-1 uppercase tracking-wider">
              {lowStockProducts.length} Produk Dibawah Limit
            </p>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Card */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] p-6 space-y-4 shadow-2xs">
        <div className="flex justify-between items-center border-b border-[#E0E0E0] pb-3">
          <h3 className="font-extrabold text-sm text-[#1B5E20] uppercase tracking-wider">
            Peringatan Stok Low
          </h3>
          <span className="material-symbols-outlined text-[#555555] text-lg">inventory</span>
        </div>

        <div className="space-y-2.5">
          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-[#555555] font-medium">Seluruh stok produk berada dalam tingkat aman.</p>
          ) : (
            lowStockProducts.map((p) => {
              const stock = p.stock ?? 0;
              return (
                <div
                  key={p.id}
                  className="p-3 bg-[#F7F8F6] rounded-xl border border-[#E0E0E0] flex items-center justify-between transition-all hover:bg-[#E8F5E9]/60"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-9 h-9 rounded-lg object-cover border border-[#E0E0E0]"
                    />
                    <div>
                      <p className="font-semibold text-xs text-[#1B5E20] line-clamp-1">{p.name}</p>
                      <p className="text-[9px] text-[#555555] font-medium">{p.categoryLabel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-[#1B5E20] font-mono-custom block">
                      {stock} Unit
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveNav('produk')}
                      className="text-[9px] bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-2.5 py-0.5 rounded-lg transition-all cursor-pointer font-bold inline-block mt-1 text-center shadow-3xs"
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
    </div>
  );
};
