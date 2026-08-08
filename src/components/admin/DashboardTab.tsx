import React from 'react';
import { Order, Product } from '../../types';
import { AdminActiveNav } from '../../types/admin';

interface DashboardTabProps {
  orders: Order[];
  products: Product[];
  setActiveNav: (nav: AdminActiveNav) => void;
  handleUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders,
  products,
  setActiveNav,
  handleUpdateOrderStatus,
}) => {
  const totalSalesAmount = orders
    .filter((o) => o.status !== 'Dibatalkan')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Penjualan */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] p-5 flex flex-col justify-between min-h-[130px] shadow-2xs transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xs hover:border-[#1B5E20]/40">
          <div className="flex justify-between items-start">
            <span className="text-[#555555] text-[10px] font-extrabold uppercase tracking-wider">Total Penjualan</span>
            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center text-[#2E7D32] shadow-2xs">
              <span className="material-symbols-outlined text-xl text-[#2E7D32]">payments</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-bold text-[#1B5E20] font-mono-custom leading-none">
              Rp {totalSalesAmount.toLocaleString('id-ID')}
            </h3>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-[#2E7D32] font-bold">
              <span className="material-symbols-outlined text-xs leading-none">trending_up</span>
              <span>+15% vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* Total Pesanan */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] p-5 flex flex-col justify-between min-h-[130px] shadow-2xs transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xs hover:border-[#1976D2]/40">
          <div className="flex justify-between items-start">
            <span className="text-[#555555] text-[10px] font-extrabold uppercase tracking-wider">Total Pesanan</span>
            <div className="w-9 h-9 rounded-xl bg-[#E3F2FD] border border-[#BBDEFB] flex items-center justify-center text-[#1976D2] shadow-2xs">
              <span className="material-symbols-outlined text-xl text-[#1976D2]">shopping_cart</span>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-lg sm:text-xl font-bold text-[#1B5E20] font-mono-custom leading-none">
              {orders.length} Transaksi
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#555555] font-medium">
              <span className="px-2 py-0.5 bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2] rounded-md text-[9px] font-bold">
                {pendingOrdersCount} Pending
              </span>
              <span>QRIS &amp; COD</span>
            </div>
          </div>
        </div>

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

      {/* Main Content Grid: Recent Transactions & Quick Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-2 bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E0E0E0] flex justify-between items-center bg-[#F7F8F6]">
            <div>
              <h3 className="font-extrabold text-sm text-[#1B5E20] uppercase tracking-wider">
                Transaksi Terkini
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('transaksi')}
              className="text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] px-4 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              Lihat Semua
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }} className="border-y border-[#C8E6C9]">
                  <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-6 py-3.5 text-xs sm:text-sm font-extrabold tracking-wide uppercase"><strong className="font-black text-[#1B5E20]">NO. PESANAN</strong></th>
                  <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-6 py-3.5 text-xs sm:text-sm font-extrabold tracking-wide uppercase"><strong className="font-black text-[#1B5E20]">PELANGGAN</strong></th>
                  <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-6 py-3.5 text-xs sm:text-sm font-extrabold tracking-wide uppercase"><strong className="font-black text-[#1B5E20]">WAKTU</strong></th>
                  <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-6 py-3.5 text-xs sm:text-sm font-extrabold tracking-wide uppercase"><strong className="font-black text-[#1B5E20]">TOTAL</strong></th>
                  <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-6 py-3.5 text-xs sm:text-sm font-extrabold tracking-wide uppercase"><strong className="font-black text-[#1B5E20]">STATUS</strong></th>
                  <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-6 py-3.5 text-right text-xs sm:text-sm font-extrabold tracking-wide uppercase"><strong className="font-black text-[#1B5E20]">AKSI</strong></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0E0E0]">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="bg-[#FFFFFF] hover:bg-[#E8F5E9]/60 transition-colors">
                    <td className="px-6 py-4 font-bold font-mono-custom text-[#1B5E20]">{ord.orderNumber || '-'}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1B5E20]">{ord.customerName || 'Pelanggan'}</p>
                      <p className="text-[10px] font-mono-custom text-[#555555] mt-0.5">{ord.paymentMethod?.toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-4 text-[#555555]">{ord.createdAt}</td>
                    <td className="px-6 py-4 font-bold text-[#1B5E20] font-mono-custom">
                      Rp {ord.totalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold inline-block border ${
                          ord.status === 'Selesai'
                            ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#1B5E20]'
                            : ord.status === 'Diproses' || ord.status === 'Dikirim'
                            ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#2E7D32]'
                            : ord.status === 'Dibatalkan'
                            ? 'bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828]'
                            : 'bg-[#FFF3E0] border-[#FFE0B2] text-[#E65100]'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={ord.status}
                        onChange={(e) =>
                          handleUpdateOrderStatus(ord.id, e.target.value as Order['status'])
                        }
                        className="bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl px-2.5 py-1 text-xs font-bold text-[#1B5E20] outline-none cursor-pointer hover:bg-[#E8F5E9] transition-colors focus:ring-1 focus:ring-[#2E7D32]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Diproses">Diproses</option>
                        <option value="Dikirim">Dikirim</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Dibatalkan">Dibatalkan</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Low Stock Alert Card */}
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
    </div>
  );
};
