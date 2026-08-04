import React, { useState } from 'react';
import { Order } from '../../types';

interface OrderDetailViewProps {
  order: Order | null;
  onClose: () => void;
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onOpenProofModal: (url: string) => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  onClose,
  onUpdateOrderStatus,
  onOpenProofModal,
}) => {
  const [courierInput, setCourierInput] = useState('');
  const [resiInput, setResiInput] = useState('');
  const [trackingSaving, setTrackingSaving] = useState(false);

  if (!order) return null;

  const handleSetTracking = async () => {
    if (!courierInput.trim() || !resiInput.trim()) return;
    setTrackingSaving(true);
    try {
      const { trackingAdminApi } = await import('../../api/adminApi');
      await trackingAdminApi.setTracking(order.id, courierInput.trim(), resiInput.trim());
      // Update status jadi Dikirim (setTracking BE otomatis set order_status=shipped)
      onUpdateOrderStatus(order.id, 'Dikirim');
      setCourierInput('');
      setResiInput('');
    } catch (e: any) {
      alert(e?.message || 'Gagal menyimpan resi.');
    } finally {
      setTrackingSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Navigation */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#44483f] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onClose}
                  className="hover:underline hover:text-[#162809] cursor-pointer"
                >
                  Kelola Transaksi
                </button>
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#162809] font-bold">Detail Pesanan</li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1d1b17]">
            Detail Pesanan {order.id}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="bg-white border border-[#c4c8bc] text-[#1d1b17] px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-[#f3ede6] transition-all cursor-pointer font-bold text-xs"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Kembali</span>
        </button>
      </section>

      {/* Main Detail Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#c4c8bc] overflow-hidden">
        {/* Top order summary info */}
        <div className="p-6 border-b border-[#c4c8bc] bg-[#f9f3ec] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-xs font-bold bg-[#162809] text-white rounded-lg font-mono">
                {order.id}
              </span>
              <span className="text-xs text-[#44483f] font-semibold">
                Dipesan pada: {order.createdAt}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#1d1b17]">Status Pesanan:</span>
            <select
              value={order.status}
              onChange={(e) =>
                onUpdateOrderStatus(order.id, e.target.value as Order['status'])
              }
              className={`px-4 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-colors ${
                order.status === 'Selesai'
                  ? 'bg-green-50 border-green-300 text-green-800'
                  : order.status === 'Diproses'
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                  : order.status === 'Dikirim'
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : order.status === 'Pending'
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
          </div>
        </div>

        {/* Customer & Shipping Information Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#c4c8bc]/60 bg-white">
          <div className="bg-[#faf8f5] p-5 rounded-2xl border border-[#c4c8bc] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#162809] border-b border-[#c4c8bc]/30 pb-2">
              <span className="material-symbols-outlined text-lg">person</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#44483f]">
                Informasi Pelanggan
              </h4>
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-base text-[#1d1b17]">
                {order.customerName || 'Pelanggan Bestari'}
              </p>
              <p className="text-xs text-[#44483f] flex items-center gap-1.5 font-mono">
                <span className="material-symbols-outlined text-sm">phone</span>
                {order.customerPhone || '-'}
              </p>
              <p className="text-xs text-[#44483f] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">mail</span>
                {order.customerEmail || '-'}
              </p>
            </div>
          </div>

          <div className="bg-[#faf8f5] p-5 rounded-2xl border border-[#c4c8bc] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#162809] border-b border-[#c4c8bc]/30 pb-2">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#44483f]">
                Alamat Pengiriman & Pembayaran
              </h4>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-[#1d1b17] leading-relaxed">
                {order.shippingAddress || 'Alamat tidak dicantumkan.'}
              </p>
              <div className="pt-2 border-t border-[#c4c8bc]/30 flex justify-between items-center text-xs">
                <span className="font-medium text-[#44483f]">Metode Pembayaran:</span>
                <span
                  className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                    order.paymentMethod === 'qris'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {order.paymentMethod === 'qris' ? 'QRIS' : 'COD (Bayar di Tempat)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Info — admin set kurir + resi */}
        <div className="p-8 border-b border-[#c4c8bc]/60 bg-white">
          <div className="bg-[#faf8f5] p-5 rounded-2xl border border-[#c4c8bc] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#162809] border-b border-[#c4c8bc]/30 pb-2">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#44483f]">
                Informasi Pengiriman
              </h4>
            </div>

            {(order.courier || order.trackingNumber) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-[#44483f] font-medium">Kurir</p>
                  <p className="font-bold text-[#1d1b17]">{order.courier || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#44483f] font-medium">Nomor Resi</p>
                  <p className="font-bold font-mono text-[#162809]">{order.trackingNumber || '-'}</p>
                </div>
              </div>
            )}
            {order.trackingNumber && order.courier && (
              <a
                href={`https://cekresi.com/cek-resi/?courier=${order.courier}&awb=${order.trackingNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[#2b3e1d] font-bold hover:underline text-xs"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Lacak di CekResi
              </a>
            )}

            {/* Form set resi */}
            <div className="pt-3 border-t border-[#c4c8bc]/30">
              <p className="text-[11px] text-[#44483f] font-semibold mb-2">
                Set Kurir & Nomor Resi (order otomatis jadi Dikirim):
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={courierInput}
                  onChange={(e) => setCourierInput(e.target.value)}
                  placeholder="Kurir (JNE, J&T, SiCepat...)"
                  className="px-3 py-2 rounded-lg border border-[#c4c8bc] bg-white text-xs text-[#1d1b17] outline-none focus:border-[#2b3e1d] flex-1"
                />
                <input
                  type="text"
                  value={resiInput}
                  onChange={(e) => setResiInput(e.target.value)}
                  placeholder="Nomor Resi"
                  className="px-3 py-2 rounded-lg border border-[#c4c8bc] bg-white text-xs text-[#1d1b17] outline-none focus:border-[#2b3e1d] flex-1 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSetTracking}
                  disabled={trackingSaving || !courierInput.trim() || !resiInput.trim()}
                  className="px-4 py-2 rounded-lg bg-[#162809] text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {trackingSaving ? 'Menyimpan...' : 'Simpan Resi'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items & Payment Proof */}
        <div className="p-8 space-y-8">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[#1d1b17] flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-[#162809]">shopping_basket</span>
              <span>Daftar Produk Dipesan</span>
            </h4>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-[#faf8f5] rounded-2xl border border-[#c4c8bc] hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#e7e2db] overflow-hidden border border-[#c4c8bc] flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1d1b17]">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-[#44483f] mt-0.5">
                        Ukuran/Varian: {item.product.unitInfo || item.product.weight || '-'}
                      </p>
                      <p className="text-xs font-mono text-[#162809] font-semibold mt-1">
                        Rp {item.product.price.toLocaleString('id-ID')} x {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold font-mono text-sm text-[#162809] text-right">
                    Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          </div>



          {/* Bill Summary Area */}
          <div className="pt-6 border-t border-[#c4c8bc] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-0.5">
              <span className="text-xs text-[#44483f] font-medium">Total Pembayaran Pelanggan:</span>
              <p className="text-2xl font-black font-mono text-[#162809]">
                Rp {order.totalAmount.toLocaleString('id-ID')}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto bg-[#162809] hover:opacity-90 text-white px-8 py-3 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer text-center"
            >
              Selesai &amp; Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
