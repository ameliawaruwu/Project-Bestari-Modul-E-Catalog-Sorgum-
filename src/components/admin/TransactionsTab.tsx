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
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#555555] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#1B5E20] font-bold">Kelola Transaksi</li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1B5E20]">
            Kelola Transaksi Pelanggan
          </h2>
          <p className="text-xs text-[#555555] mt-1">
            Pantau pesanan masuk, verifikasi bukti pembayaran QRIS, dan perbarui status pengiriman.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-2 bg-[#2E7D32] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#1B5E20] transition-colors shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Ekspor Data (CSV)</span>
          </button>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E0E0E0] shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-[#E0E0E0] bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center bg-[#F7F8F6] rounded-xl px-4 py-2 border border-[#E0E0E0] w-full sm:w-80 shadow-2xs">
            <span className="material-symbols-outlined text-[#555555] mr-2">search</span>
            <input
              type="text"
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
              placeholder="Cari ID, Nama, Telepon..."
              className="bg-transparent border-none outline-none text-xs text-[#1B5E20] w-full placeholder:text-[#555555] font-medium"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-[#555555] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
            <span>
              Menampilkan {filteredOrders.length} dari {orders.length} Transaksi
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }} className="border-y border-[#C8E6C9]">
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-4 text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">ID &amp; TANGGAL</strong></th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-4 text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">PELANGGAN</strong></th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-4 text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">PRODUK DIPESAN</strong></th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-4 text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">METODE BAYAR</strong></th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-4 text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">TOTAL</strong></th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-4 text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">KURIR / RESI</strong></th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-4 text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">STATUS</strong></th>
                <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="p-4 text-center text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">AKSI</strong></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E0E0]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#555555]">
                    Tidak ada transaksi yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#E8F5E9]/60 transition-colors">
                    <td className="p-4 font-bold font-mono text-[#1B5E20]">
                      <div className="text-sm font-bold">{ord.orderNumber || '-'}</div>
                      <div className="text-[11px] font-normal text-[#555555] mt-0.5">
                        {ord.createdAt}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-[#1B5E20]">
                        {ord.customerName || 'Pelanggan Sorgum'}
                      </p>
                      <p className="text-xs text-[#555555]">{ord.customerPhone}</p>
                      <p className="text-[11px] text-[#555555] truncate max-w-[160px]">
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
                              className="w-7 h-7 rounded-md object-cover border border-[#E0E0E0]"
                            />
                            <span className="text-xs font-medium text-[#1B5E20] truncate max-w-[160px]">
                              {it.product.name}
                            </span>
                            <span className="text-xs font-bold text-[#2E7D32]">
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
                              ? 'bg-[#E3F2FD] text-[#1976D2] border border-[#BBDEFB]'
                              : 'bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2]'
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
                                ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]'
                                : (ord.paymentStatus || 'unpaid') === 'paid'
                                ? 'bg-[#E3F2FD] border-[#90CAF9] text-[#1976D2]'
                                : 'bg-[#F7F8F6] border-[#E0E0E0] text-[#555555]'
                            }`}
                            title="Verifikasi pembayaran (unpaid/paid/confirmed)"
                          >
                            <option value="unpaid">Belum Bayar</option>
                            <option value="paid">Sudah Bayar</option>
                          </select>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-[#1B5E20] font-mono text-sm">
                      Rp {ord.totalAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      {ord.courier || ord.trackingNumber ? (
                        <div>
                          <p className="font-bold text-[#1B5E20] text-xs">{ord.courier || '-'}</p>
                          <p className="text-[11px] font-mono text-[#555555]">{ord.trackingNumber || '-'}</p>
                        </div>
                      ) : (
                        <span className="text-[#999999]">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <select
                        value={ord.status}
                        onChange={(e) =>
                          onUpdateOrderStatus(ord.id, e.target.value as Order['status'])
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-colors ${
                          ord.status === 'Selesai'
                            ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]'
                            : ord.status === 'Diproses'
                            ? 'bg-[#FFF8E1] border-[#FFE082] text-[#C89B3C]'
                            : ord.status === 'Dikirim'
                            ? 'bg-[#E3F2FD] border-[#90CAF9] text-[#1976D2]'
                            : ord.status === 'Pending'
                            ? 'bg-[#FFF3E0] border-[#FFCC80] text-[#E65100]'
                            : 'bg-[#FFEBEE] border-[#FFCDD2] text-[#D32F2F]'
                        }`}
                      >
                        {(['Pending', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'] as Order['status'][]).map((s) => (
                          <option key={s} value={s} className="text-[#1B5E20] bg-white">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectOrder(ord.id)}
                          className="p-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] rounded-lg transition-colors cursor-pointer"
                          title="Lihat Detail Transaksi"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteOrder(ord)}
                          className="p-1.5 bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#D32F2F] rounded-lg transition-colors cursor-pointer"
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
