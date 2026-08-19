import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { getAllowedStatusOptions } from '../../utils/orderStatusTransitions';

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
  const [trackingData, setTrackingData] = useState<any>(null);

  // Fetch status pengiriman (resi_status + riwayat) saat detail dibuka
  useEffect(() => {
    setTrackingData(null);
    if (!order) return;
    if (!order.courier || !order.trackingNumber) return;
    let cancelled = false;
    (async () => {
      try {
        const { trackingAdminApi } = await import('../../api/adminApi');
        const data = await trackingAdminApi.getTracking(order.id);
        if (!cancelled) setTrackingData(data);
      } catch {
        // tracking unavailable — diam (resi_status belum ada / cek-resi down)
      }
    })();
    return () => { cancelled = true; };
  }, [order?.id, order?.courier, order?.trackingNumber]);

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
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#555555] mb-1">
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
                  className="hover:underline hover:text-[#1B5E20] cursor-pointer"
                >
                  Kelola Transaksi
                </button>
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#1B5E20] font-bold">Detail Pesanan</li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1B5E20]">
            Detail Pesanan {order.orderNumber ? `#${order.orderNumber}` : ''}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="bg-[#FFFFFF] border border-[#E0E0E0] text-[#1B5E20] px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 hover:bg-[#E8F5E9] transition-all cursor-pointer font-bold text-xs shadow-2xs"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Kembali</span>
        </button>
      </section>

      {/* Main Detail Card */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-2xs border border-[#E0E0E0] overflow-hidden">
        {/* Top order summary info */}
        <div className="p-6 border-b border-[#E0E0E0] bg-[#F7F8F6] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-xs font-bold bg-[#1B5E20] text-white rounded-lg font-mono">
                {order.orderNumber || 'ORD'}
              </span>
              <span className="text-xs text-[#555555] font-semibold">
                Dipesan pada: {order.createdAt}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#1B5E20]">Status Pesanan:</span>
            <select
              value={order.status}
              onChange={(e) =>
                onUpdateOrderStatus(order.id, e.target.value as Order['status'])
              }
              className={`px-4 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-colors ${
                order.status === 'Diproses'
                  ? 'bg-[#FFF8E1] border-[#FFE082] text-[#C89B3C]'
                  : order.status === 'Dikirim'
                  ? 'bg-[#E3F2FD] border-[#90CAF9] text-[#1976D2]'
                  : order.status === 'Pending'
                  ? 'bg-[#FFF3E0] border-[#FFCC80] text-[#E65100]'
                  : order.status === 'Selesai'
                  ? 'bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32]'
                  : 'bg-[#FFEBEE] border-[#FFCDD2] text-[#D32F2F]'
              }`}
            >
              {getAllowedStatusOptions(order.statusRaw, order.status).map((s) => (
                <option key={s} value={s} className="text-[#1B5E20] bg-white">{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer & Shipping Information Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-[#E0E0E0] bg-[#FFFFFF]">
          <div className="bg-[#F7F8F6] p-5 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-[#1B5E20] border-b border-[#E0E0E0] pb-2">
              <span className="material-symbols-outlined text-lg">person</span>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1B5E20]">
                Informasi Pelanggan
              </h4>
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-base text-[#1B5E20]">
                {order.customerName || 'Pelanggan Sorgum'}
              </p>
              <p className="text-xs text-[#555555] flex items-center gap-1.5 font-mono">
                <span className="material-symbols-outlined text-sm">phone</span>
                {order.customerPhone || '-'}
              </p>
              <p className="text-xs text-[#555555] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">mail</span>
                {order.customerEmail || '-'}
              </p>
            </div>
          </div>

          <div className="bg-[#F7F8F6] p-5 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-[#1B5E20] border-b border-[#E0E0E0] pb-2">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1B5E20]">
                Alamat Pengiriman &amp; Pembayaran
              </h4>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-[#1B5E20] leading-relaxed whitespace-pre-line">
                {order.shippingAddress || 'Alamat tidak dicantumkan.'}
              </p>
              <div className="pt-2 border-t border-[#E0E0E0] flex justify-between items-center text-xs">
                <span className="font-medium text-[#555555]">Metode Pembayaran:</span>
                <span
                  className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                    order.paymentMethod === 'qris'
                      ? 'bg-[#E3F2FD] text-[#1976D2] border border-[#BBDEFB]'
                      : 'bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2]'
                  }`}
                >
                  {order.paymentMethod === 'qris' ? 'QRIS' : 'COD (Bayar di Tempat)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Info — admin set kurir + resi */}
        <div className="p-8 border-b border-[#E0E0E0] bg-[#FFFFFF]">
          <div className="bg-[#F7F8F6] p-5 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-[#1B5E20] border-b border-[#E0E0E0] pb-2">
              <span className="material-symbols-outlined text-lg">local_shipping</span>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1B5E20]">
                Informasi Pengiriman
              </h4>
            </div>

            {(order.courier || order.trackingNumber) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-[#555555] font-medium">Kurir</p>
                  <p className="font-bold text-[#1B5E20]">{order.courier || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[#555555] font-medium">Nomor Resi</p>
                  <p className="font-bold font-mono text-[#1B5E20]">{order.trackingNumber || '-'}</p>
                </div>
              </div>
            )}
            {order.trackingNumber && order.courier && (
              <a
                href={`https://cekresi.com/cek-resi/?courier=${order.courier}&awb=${order.trackingNumber}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[#2E7D32] font-bold hover:underline text-xs"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Lacak di CekResi
              </a>
            )}

            {/* Status pengiriman real-time dari cek-resi */}
            {trackingData?.tracking && (
              <div className="pt-3 border-t border-[#E0E0E0]/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    trackingData.tracking.resi_status?.toLowerCase().includes('delivered')
                      ? 'bg-[#d2eabb]/60 text-[#1B5E20]'
                      : trackingData.tracking.resi_status
                        ? 'bg-[#fade88]/50 text-[#C89B3C]'
                        : 'bg-gray-100 text-[#555555]'
                  }`}>
                    <span className="material-symbols-outlined text-xs">local_shipping</span>
                    {trackingData.tracking.resi_status || 'Belum ada update'}
                  </span>
                  {trackingData.tracking.checked_at && (
                    <span className="text-[10px] text-[#555555]">
                      {formatDate(trackingData.tracking.checked_at, 'full')}
                    </span>
                  )}
                </div>
                {(trackingData.tracking.pengirim || trackingData.tracking.tujuan) && (
                  <p className="text-[11px] text-[#555555]">
                    {trackingData.tracking.pengirim && `Pengirim: ${trackingData.tracking.pengirim}`}
                    {trackingData.tracking.pengirim && trackingData.tracking.tujuan && ' · '}
                    {trackingData.tracking.tujuan && `Tujuan: ${trackingData.tracking.tujuan}`}
                  </p>
                )}
                {trackingData.history?.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {trackingData.history.map((h: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <span className="material-symbols-outlined text-xs text-[#93a97f] mt-0.5">schedule</span>
                        <div>
                          <p className="text-[#1B5E20]">{h.description}</p>
                          <p className="text-[10px] text-[#555555]">{h.event_date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Form set resi — SELALU tersedia (status terminal bisa diubah lagi, keputusan user 2026-08-10) */}
            <div className="pt-3 border-t border-[#E0E0E0]">
              <p className="text-[11px] text-[#555555] font-semibold mb-2">
                Set Kurir &amp; Nomor Resi (order otomatis jadi Dikirim):
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={courierInput}
                  onChange={(e) => setCourierInput(e.target.value)}
                  placeholder="Kurir (JNE, J&T, SiCepat...)"
                  className="px-3 py-2 rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] text-xs text-[#1B5E20] outline-none focus:border-[#2E7D32] flex-1 font-medium"
                />
                <input
                  type="text"
                  value={resiInput}
                  onChange={(e) => setResiInput(e.target.value)}
                  placeholder="Nomor Resi"
                  className="px-3 py-2 rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] text-xs text-[#1B5E20] outline-none focus:border-[#2E7D32] flex-1 font-mono font-medium"
                />
                <button
                  type="button"
                  onClick={handleSetTracking}
                  disabled={trackingSaving || !courierInput.trim() || !resiInput.trim()}
                  className="px-4 py-2 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  {trackingSaving ? 'Menyimpan...' : 'Simpan Resi'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items & Payment Proof */}
        <div className="p-8 space-y-8 bg-[#FFFFFF]">
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold text-[#1B5E20] flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-[#1B5E20]">shopping_basket</span>
              <span>Daftar Produk Dipesan</span>
            </h4>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-[#F7F8F6] rounded-2xl border border-[#E0E0E0] hover:shadow-2xs transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[#FFFFFF] overflow-hidden border border-[#E0E0E0] flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1B5E20]">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-[#555555] mt-0.5">
                        Ukuran/Varian: {item.product.unitInfo || item.product.weight || '-'}
                      </p>
                      <p className="text-xs font-mono text-[#1B5E20] font-semibold mt-1">
                        Rp {item.product.price.toLocaleString('id-ID')} x {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold font-mono text-sm text-[#1B5E20] text-right">
                    Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Summary Area */}
          <div className="pt-6 border-t border-[#E0E0E0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-0.5">
              <span className="text-xs text-[#555555] font-medium">Total Pembayaran Pelanggan:</span>
              <p className="text-2xl font-black font-mono text-[#1B5E20]">
                Rp {order.totalAmount.toLocaleString('id-ID')}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-8 py-3 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer text-center"
            >
              Selesai &amp; Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
