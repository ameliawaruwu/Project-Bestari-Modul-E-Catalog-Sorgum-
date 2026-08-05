import React, { useState } from 'react';
import { Order } from '../../types';

interface TransactionsTabProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onUpdatePaymentStatus?: (orderId: string, newPayment: 'unpaid' | 'paid' | 'confirmed') => void;
  onDeleteOrder: (order: Order) => void;
  onSelectOrder: (id: string) => void;
  onOpenProofModal: (url: string) => void;
  onExportCSV: () => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  orders,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onDeleteOrder,
  onSelectOrder,
  onOpenProofModal,
  onExportCSV,
}) => {
  const [searchOrder, setSearchOrder] = useState('');

  const filteredOrders = orders.filter((o) => {
    const query = searchOrder.toLowerCase();
    return (
      o.id.toLowerCase().includes(query) ||
      (o.customerName || '').toLowerCase().includes(query) ||
      (o.customerPhone || '').toLowerCase().includes(query) ||
      (o.status || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#44483f] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#162809] font-bold">Kelola Transaksi</li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1d1b17]">
            Kelola Transaksi Pelanggan
          </h2>
          <p className="text-xs text-[#44483f] mt-1">
            Pantau pesanan masuk, verifikasi bukti pembayaran QRIS, dan perbarui status pengiriman.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-2 bg-[#2b3e1d] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#162809] transition-colors shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Ekspor Data (CSV)</span>
          </button>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="bg-white rounded-2xl border border-[#c4c8bc] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#c4c8bc] bg-[#f9f3ec] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center bg-white rounded-xl px-4 py-2 border border-[#c4c8bc] w-full sm:w-80 shadow-xs">
            <span className="material-symbols-outlined text-[#44483f] mr-2">search</span>
            <input
              type="text"
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
              placeholder="Cari ID, Nama, Telepon..."
              className="bg-transparent border-none outline-none text-xs text-[#1d1b17] w-full"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[#44483f] font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Menampilkan {filteredOrders.length} dari {orders.length} Transaksi
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#f3ede6] text-[#44483f] font-bold uppercase tracking-wider border-b border-[#c4c8bc]">
              <tr>
                <th className="p-4">ID &amp; Tanggal</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Produk Dipesan</th>
                <th className="p-4">Metode Bayar</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c8bc]/30">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#44483f]">
                    Tidak ada transaksi yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#f9f3ec]/60 transition-colors">
                    <td className="p-4 font-bold font-mono text-[#162809]">
                      <div className="text-sm">{ord.orderNumber || ord.id}</div>
                      <div className="text-[11px] font-normal text-[#44483f] mt-0.5">
                        {ord.createdAt}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#1d1b17]">
                        {ord.customerName || 'Pelanggan Bestari'}
                      </p>
                      <p className="text-xs text-[#44483f]">{ord.customerPhone}</p>
                      <p className="text-[11px] text-[#44483f]/80 truncate max-w-[160px]">
                        {ord.customerEmail}
                      </p>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="space-y-1">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <img
                              src={it.product.image}
                              alt={it.product.name}
                              className="w-7 h-7 rounded-md object-cover border border-[#c4c8bc]"
                            />
                            <span className="text-xs font-medium text-[#1d1b17] truncate max-w-[160px]">
                              {it.product.name}
                            </span>
                            <span className="text-xs font-bold text-[#2b3e1d]">
                              x{it.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase rounded ${
                            ord.paymentMethod === 'qris'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {ord.paymentMethod === 'qris' ? 'QRIS' : 'COD (Bayar di Tempat)'}
                        </span>
                        {onUpdatePaymentStatus && (
                          <select
                            value={ord.paymentStatus || 'unpaid'}
                            onChange={(e) =>
                              onUpdatePaymentStatus(ord.id, e.target.value as 'unpaid' | 'paid' | 'confirmed')
                            }
                            className={`block w-full px-2 py-1 rounded-lg text-[10px] font-bold border outline-none cursor-pointer ${
                              (ord.paymentStatus || 'unpaid') === 'confirmed'
                                ? 'bg-green-50 border-green-300 text-green-800'
                                : (ord.paymentStatus || 'unpaid') === 'paid'
                                ? 'bg-blue-50 border-blue-300 text-blue-800'
                                : 'bg-gray-50 border-gray-300 text-gray-600'
                            }`}
                            title="Verifikasi pembayaran (unpaid/paid/confirmed)"
                          >
                            <option value="unpaid">Belum Bayar</option>
                            <option value="paid">Sudah Bayar</option>
                            <option value="confirmed">Terverifikasi</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-[#162809] font-mono text-sm">
                      Rp {ord.totalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      <select
                        value={ord.status}
                        onChange={(e) =>
                          onUpdateOrderStatus(ord.id, e.target.value as Order['status'])
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-colors ${
                          ord.status === 'Selesai'
                            ? 'bg-green-50 border-green-300 text-green-800'
                            : ord.status === 'Diproses'
                            ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                            : ord.status === 'Dikirim'
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : ord.status === 'Pending'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-red-50 border-red-300 text-red-800'
                        }`}
                      >
                        <option value="Pending" className="text-[#1d1b17] bg-white">Pending</option>
                        <option value="Diproses" className="text-[#1d1b17] bg-white">Diproses</option>
                        <option value="Dikirim" className="text-[#1d1b17] bg-white">Dikirim</option>
                        <option value="Selesai" className="text-[#1d1b17] bg-white">Selesai</option>
                        <option value="Dibatalkan" className="text-[#1d1b17] bg-white">Dibatalkan</option>
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectOrder(ord.id)}
                          className="p-1.5 bg-[#f3ede6] hover:bg-[#e7dfd5] text-[#162809] rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail Transaksi"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteOrder(ord)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Transaksi"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
