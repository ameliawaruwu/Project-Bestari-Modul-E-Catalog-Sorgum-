import React from 'react';
import { Order, Product } from '../../types';
import { AdminActiveNav } from '../../types/admin';

interface DashboardTabProps {
  orders: Order[];
  products: Product[];
  productStockMap: Record<string, number>;
  setActiveNav: (nav: AdminActiveNav) => void;
  handleUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders,
  products,
  productStockMap,
  setActiveNav,
  handleUpdateOrderStatus,
}) => {
  const totalSalesAmount = orders
    .filter((o) => o.status !== 'Dibatalkan')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = orders.filter((o) => o.status === 'Pending').length;
  const totalProductsCount = products.length;

  const lowStockProducts = products.filter((p) => {
    const stock = productStockMap[p.id] ?? 50;
    return stock < 30;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Breadcrumb & Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-semibold text-[#44483f]/70 mb-1">
            <ol className="flex items-center space-x-2">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveNav('dashboard')}
                  className="hover:text-[#162809] transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#162809] font-bold">Dashboard Utama</li>
            </ol>
          </nav>
          <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
            Overview Dashboard
          </h2>
        </div>
      </div>

      {/* KPI Grid - Elegant Clean Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Penjualan */}
        <div className="bg-white p-4.5 flex flex-col justify-between min-h-[125px] transition-all duration-200 hover:translate-y-[-2px]">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Penjualan</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-[#162809]">
              <span className="material-symbols-outlined text-base">payments</span>
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg sm:text-xl font-bold text-[#162809] font-mono-custom leading-none">
              Rp {totalSalesAmount.toLocaleString('id-ID')}
            </h3>
            <div className="flex items-center gap-1 mt-1.5 text-[9px] text-[#162809] font-semibold">
              <span className="material-symbols-outlined text-xs leading-none">trending_up</span>
              <span>+15% vs bulan lalu</span>
            </div>
          </div>
        </div>

        {/* Total Pesanan */}
        <div className="bg-white p-4.5 flex flex-col justify-between min-h-[125px] transition-all duration-200 hover:translate-y-[-2px]">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Pesanan</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-[#162809]">
              <span className="material-symbols-outlined text-base">shopping_cart</span>
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 font-mono-custom leading-none">
              {orders.length} Transaksi
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-slate-500 font-medium">
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[8px] font-bold">
                {pendingOrdersCount} Pending
              </span>
              <span>QRIS &amp; COD</span>
            </div>
          </div>
        </div>

        {/* Katalog Produk */}
        <div className="bg-white p-4.5 flex flex-col justify-between min-h-[125px] transition-all duration-200 hover:translate-y-[-2px]">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Katalog Produk</span>
            <button
              type="button"
              onClick={() => setActiveNav('produk')}
              className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-[#162809] transition-colors cursor-pointer"
              title="Kelola Produk"
            >
              <span className="material-symbols-outlined text-base">inventory_2</span>
            </button>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 font-mono-custom leading-none">
              {totalProductsCount} Produk
            </h3>
            <p className="text-[9px] text-slate-400 mt-1.5 font-medium">Varietas Olahan Sorgum</p>
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="bg-white p-4.5 flex flex-col justify-between min-h-[125px] transition-all duration-200 hover:translate-y-[-2px]">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Stok Menipis</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-[#162809]">
              <span className="material-symbols-outlined text-base">warning</span>
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 font-mono-custom leading-none">
              Perlu Restock
            </h3>
            <p className="text-[9px] text-slate-400 font-semibold mt-1.5 flex items-center gap-1 uppercase tracking-wider">
              {lowStockProducts.length} Produk Dibawah Limit
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Transactions & Quick Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Orders */}
        <div className="lg:col-span-2 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Transaksi Terkini
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Pesanan masuk terbaru dari toko online</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveNav('transaksi')}
              className="text-xs font-bold text-white bg-[#162809] hover:bg-[#2b3e1d] px-4 py-2 rounded-lg transition-all cursor-pointer shadow-2xs"
            >
              Lihat Semua
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#fcfaf6] text-[#44483f] font-bold uppercase tracking-wider border-b border-[#c4c8bc]/30">
                <tr>
                  <th className="px-6 py-4">ID Pesanan</th>
                  <th className="px-6 py-4">Pelanggan</th>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c4c8bc]/20">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#fcfaf6] transition-colors">
                    <td className="px-6 py-4 font-bold font-mono-custom text-[#162809]">{ord.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#1d1b17]">{ord.customerName || 'Pelanggan'}</p>
                      <p className="text-[10px] font-mono-custom text-[#44483f]/80 mt-0.5">{ord.paymentMethod?.toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-4 text-[#44483f]">{ord.createdAt}</td>
                    <td className="px-6 py-4 font-bold text-[#1d1b17] font-mono-custom">
                      Rp {ord.totalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold inline-block border ${
                          ord.status === 'Selesai'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : ord.status === 'Diproses' || ord.status === 'Dikirim'
                            ? 'bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-slate-50 border-slate-100 text-slate-400'
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
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-50 transition-colors focus:ring-1 focus:ring-[#162809]"
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
        <div className="bg-white p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Peringatan Stok Low
            </h3>
            <span className="material-symbols-outlined text-slate-400 text-lg">inventory</span>
          </div>

          <div className="space-y-2.5">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400">Seluruh stok produk berada dalam tingkat aman.</p>
            ) : (
              lowStockProducts.map((p) => {
                const stock = productStockMap[p.id] ?? 15;
                return (
                  <div
                    key={p.id}
                    className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-100 flex items-center justify-between transition-all hover:bg-slate-50"
                  >
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-8 h-8 rounded object-cover border border-slate-200/60"
                      />
                      <div>
                        <p className="font-semibold text-xs text-slate-800 line-clamp-1">{p.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{p.categoryLabel}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-slate-700 font-mono-custom block">
                        {stock} Unit
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveNav('produk')}
                        className="text-[9px] bg-[#162809] hover:bg-[#2b3e1d] text-white px-2 py-0.5 rounded transition-all cursor-pointer font-bold inline-block mt-0.5 text-center shadow-3xs"
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
