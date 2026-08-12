import React, { useState, useEffect } from 'react';
import { Order, Product } from '../../types';
import { wishlistApi } from '../../api/wishlistApi';
import { formatDate } from '../../utils/formatDate';
import { discountBadgeLabel } from '../../utils/discountBadge';

interface ProfileOrdersSectionProps {
  orders: Order[];
  currentUser: { id: string; email: string; role?: string } | null;
  onNavigateProducts: () => void;
  onCancelOrder: (orderId: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

/**
 * TAB "Pesanan Saya" — riwayat pesanan user + detail view (tracking, items, info kirim).
 * State lokal: filter status, order terpilih, data tracking.
 */
export const ProfileOrdersSection: React.FC<ProfileOrdersSectionProps> = ({
  orders,
  currentUser,
  onNavigateProducts,
  onCancelOrder,
  showToast,
}) => {
  const [orderFilter, setOrderFilter] = useState<string>('Semua');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // Live tracking data (dari BE /api/tracking/:orderId) — untuk order detail view
  const [trackingData, setTrackingData] = useState<{
    tracking: {
      courier: string;
      tracking_number: string;
      resi_status: string;
      pengirim: string;
      tujuan: string;
      checked_at: string;
    } | null;
    history: { event_date: string; description: string }[];
  } | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Fetch tracking real setiap ganti selectedOrderDetail yang punya resi
  useEffect(() => {
    let cancelled = false;
    setTrackingData(null);
    const order = selectedOrderDetail;
    if (!order || !order.courier || !order.trackingNumber) {
      setTrackingLoading(false);
      return;
    }
    setTrackingLoading(true);
    const load = async () => {
      try {
        const { request } = await import('../../api/http');
        const res = await request<{ data: typeof trackingData }>(`/tracking/${order.id}`, { auth: true });
        if (!cancelled) setTrackingData(res.data);
      } catch {
        // tracking unavailable
      } finally {
        if (!cancelled) setTrackingLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedOrderDetail?.id]);

  // Filter pesanan user berdasarkan status tab
  const filteredOrders = orders.filter((ord) => {
    if (orderFilter === 'Semua') return true;
    if (orderFilter === 'Belum Bayar') return ord.status === 'Pending';
    if (orderFilter === 'Sedang Dikemas') return ord.status === 'Diproses';
    return ord.status === orderFilter;
  });

  return (
<div className="animate-fadeIn">
  {selectedOrderDetail ? (
    /* ORDER DETAIL VIEW */
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#555555] mb-2">
        <button
          onClick={() => setSelectedOrderDetail(null)}
          className="hover:text-[#1B5E20] font-medium cursor-pointer"
        >
          Riwayat Pesanan
        </button>
        <span>/</span>
        <span className="font-bold text-[#1B5E20]">
          Detail Pesanan {selectedOrderDetail.orderNumber ? `#${selectedOrderDetail.orderNumber}` : ''}
        </span>
      </nav>

      {/* Header Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs gap-4">
        <div>
          <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1B5E20]">
            {selectedOrderDetail.orderNumber ? `Pesanan #${selectedOrderDetail.orderNumber}` : 'Detail Pesanan'}
          </h2>
          <p className="text-xs text-[#555555] mt-1">
            Pesanan dibuat: {selectedOrderDetail.createdAt}
          </p>
        </div>
        <span
          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto flex items-center gap-1.5 border ${
            selectedOrderDetail.status === 'Selesai'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : selectedOrderDetail.status === 'Dikirim'
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : selectedOrderDetail.status === 'Diproses'
              ? 'bg-purple-100 text-purple-800 border-purple-300'
              : selectedOrderDetail.status === 'Dibatalkan'
              ? 'bg-red-100 text-red-800 border-red-300'
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {selectedOrderDetail.status === 'Selesai'
              ? 'check_circle'
              : selectedOrderDetail.status === 'Dikirim'
              ? 'local_shipping'
              : selectedOrderDetail.status === 'Diproses'
              ? 'inventory_2'
              : selectedOrderDetail.status === 'Dibatalkan'
              ? 'cancel'
              : 'schedule'}
          </span>
          <span>{selectedOrderDetail.status}</span>
        </span>
      </div>

      {/* Two Column Layout for Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tracking & Stepper */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stepper Card */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs">
            <h3 className="font-['Playfair_Display'] font-bold text-base text-[#1B5E20] mb-6">
              Status Pengiriman
            </h3>

            {selectedOrderDetail.status === 'Dibatalkan' ? (
              <div className="p-4 bg-[#FFEBEE] border border-red-200 rounded-xl text-center">
                <span className="material-symbols-outlined text-3xl text-[#D32F2F] mb-1">cancel</span>
                <p className="font-bold text-sm text-[#D32F2F]">Pesanan Dibatalkan</p>
                <p className="text-xs text-[#D32F2F] mt-0.5">Pesanan ini telah dibatalkan. Silakan hubungi admin jika terdapat kendala.</p>
              </div>
            ) : (
              <div className="relative py-2">
                {/* Connecting Progress Line */}
                <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-[#E0E0E0] z-0">
                  <div
                    className="h-full bg-[#1B5E20] transition-all duration-500"
                    style={{
                      width: `${
                        (() => {
                          const currentStep =
                            selectedOrderDetail.status === 'Pending'
                              ? 1
                              : selectedOrderDetail.status === 'Diproses'
                              ? 3
                              : selectedOrderDetail.status === 'Dikirim'
                              ? 4
                              : selectedOrderDetail.status === 'Selesai'
                              ? 5
                              : 1;
                          return ((currentStep - 1) / 4) * 100;
                        })()
                      }%`,
                    }}
                  />
                </div>

                {/* Stepper Equal 5 Columns Grid */}
                <div className="grid grid-cols-5 text-center relative z-10">
                  {[
                    { num: 1, label: 'Pesanan Dibuat', icon: 'description' },
                    { num: 2, label: 'Pembayaran Berhasil', icon: 'payments' },
                    { num: 3, label: 'Diproses', icon: 'inventory_2' },
                    { num: 4, label: 'Dikirim', icon: 'local_shipping' },
                    { num: 5, label: 'Selesai', icon: 'check_circle' },
                  ].map((s) => {
                    const currentStep =
                      selectedOrderDetail.status === 'Pending'
                        ? 1
                        : selectedOrderDetail.status === 'Diproses'
                        ? 3
                        : selectedOrderDetail.status === 'Dikirim'
                        ? 4
                        : selectedOrderDetail.status === 'Selesai'
                        ? 5
                        : 1;

                    const isDone = s.num < currentStep;
                    const isActive = s.num === currentStep;

                    return (
                      <div key={s.num} className="flex flex-col items-center px-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-2xs transition-all ${
                            isDone
                              ? 'bg-[#1B5E20] text-white'
                              : isActive
                              ? 'bg-[#2E7D32] text-white ring-4 ring-[#E8F5E9]'
                              : 'bg-[#E0E0E0] text-[#555555]'
                          }`}
                        >
                          {isDone ? (
                            '✓'
                          ) : isActive ? (
                            <span className="material-symbols-outlined text-sm">{s.icon}</span>
                          ) : (
                            s.num
                          )}
                        </div>
                        <span
                          className={`text-[11px] leading-tight mt-2.5 max-w-[90px] mx-auto block ${
                            isDone || isActive ? 'font-bold text-[#1B5E20]' : 'text-[#555555]'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Lacak Pengiriman */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Playfair_Display'] font-bold text-base text-[#1B5E20]">
                Lacak Pengiriman
              </h3>
              {trackingData?.tracking?.resi_status && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#1B5E20] text-white">
                  {trackingData.tracking.resi_status}
                </span>
              )}
            </div>

            {/* Info kurir + resi */}
            {selectedOrderDetail.courier || selectedOrderDetail.trackingNumber ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#E8F5E9] rounded-xl px-4 py-2.5 border border-[#A5D6A7] text-xs">
                <span className="flex items-center gap-1.5 font-bold text-[#1B5E20]">
                  <span className="material-symbols-outlined text-sm">local_shipping</span>
                  {selectedOrderDetail.courier || 'Kurir'}
                </span>
                {selectedOrderDetail.trackingNumber && (
                  <span className="font-mono font-bold text-[#1B5E20]">
                    Resi: {selectedOrderDetail.trackingNumber}
                  </span>
                )}
                <a
                  href={`https://cekresi.com/cek-resi/?courier=${selectedOrderDetail.courier}&awb=${selectedOrderDetail.trackingNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#2E7D32] font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Lacak
                </a>
              </div>
            ) : (
              <p className="text-xs text-[#555555]">
                Resi belum diinput oleh admin. Pesanan ini belum dikirim.
              </p>
            )}

            {/* Info pengirim/tujuan/update */}
            {trackingData?.tracking && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#F7F8F6] rounded-xl px-4 py-3 border border-[#E0E0E0]">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#555555] font-bold">Pengirim</p>
                  <p className="font-semibold text-[#1B5E20] mt-0.5">{trackingData.tracking.pengirim || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[#555555] font-bold">Tujuan</p>
                  <p className="font-semibold text-[#1B5E20] mt-0.5">{trackingData.tracking.tujuan || '-'}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] uppercase tracking-wide text-[#555555] font-bold">Update Terakhir</p>
                  <p className="font-semibold text-[#1B5E20] mt-0.5">
                    {formatDate(trackingData.tracking.checked_at, 'datetime')}
                  </p>
                </div>
              </div>
            )}

            {/* Timeline riwayat perjalanan */}
            <div className="pt-4 border-t border-[#E0E0E0] space-y-4">
              <h4 className="font-bold text-xs text-[#555555] uppercase tracking-wider">
                Riwayat Terbaru
              </h4>
              {trackingLoading ? (
                <p className="text-xs text-[#555555]">Memuat riwayat pengiriman...</p>
              ) : trackingData?.history?.length ? (
                <div className="space-y-3 pl-2 border-l-2 border-[#2E7D32]">
                  {trackingData.history.map((ev, idx) => (
                    <div key={idx} className="pl-3 relative">
                      <p className="text-xs font-bold text-[#1B5E20]">
                        {ev.event_date && ev.event_date !== '-' ? ev.event_date : '—'}
                      </p>
                      <p className="text-xs text-[#555555]">{ev.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#555555]">
                  Belum ada riwayat perjalanan dari ekspedisi.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Shipping Info */}
        <div className="space-y-6">
          {/* Ringkasan Pesanan */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
            <h3 className="font-['Playfair_Display'] font-bold text-base text-[#1B5E20] border-b border-[#E0E0E0] pb-3">
              Ringkasan Pesanan
            </h3>

            <div className="space-y-3">
              {selectedOrderDetail.items.map((it, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <img
                    src={it.product.image}
                    alt={it.product.name}
                    className="w-14 h-14 object-cover rounded-xl bg-[#F7F8F6] border border-[#E0E0E0]"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-[#1B5E20] truncate font-['Playfair_Display']">
                      {it.product.name}
                    </h4>
                    <p className="text-[11px] text-[#555555]">
                      {it.product.unitInfo || it.product.weight} x {it.quantity}
                    </p>
                    <p className="font-bold text-xs text-[#1B5E20]">
                      Rp {(it.product.price * it.quantity).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#E0E0E0] pt-3 space-y-1.5 text-xs text-[#555555]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  Rp{' '}
                  {selectedOrderDetail.items
                    .reduce((s, i) => s + i.product.price * i.quantity, 0)
                    .toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#1B5E20] pt-2 border-t border-[#E0E0E0]">
                <span>Total Tagihan</span>
                <span>Rp {selectedOrderDetail.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Informasi Pengiriman */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-[#1B5E20] font-bold text-sm">
              <span className="material-symbols-outlined text-lg">location_on</span>
              <span>Informasi Pengiriman</span>
            </div>
            <p className="text-xs font-bold text-[#1B5E20]">
              {selectedOrderDetail.customerName || 'Aruna Sorgum'}
            </p>
            <p className="text-xs text-[#555555]">
              {selectedOrderDetail.customerPhone || '+62 812-3456-7890'}
            </p>
            <p className="text-xs text-[#555555] leading-relaxed pt-1 whitespace-pre-line">
              {selectedOrderDetail.shippingAddress ||
                'Jl. Kebon Jeruk No. 12, Jakarta Barat, DKI Jakarta, 11530'}
            </p>
          </div>

          <div className="flex gap-3">
            {selectedOrderDetail.status === 'Pending' && (
                <button
                  onClick={() => onCancelOrder(selectedOrderDetail.id)}
                  className="flex-1 bg-[#D32F2F] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#B71C1C] cursor-pointer"
                >
                  Batalkan Pesanan
                </button>
              )}
            <button
              onClick={() => setSelectedOrderDetail(null)}
              className={`py-3 rounded-xl font-bold text-xs hover:bg-[#1B5E20] cursor-pointer ${
                selectedOrderDetail.status !== 'Dikirim' &&
                selectedOrderDetail.status !== 'Selesai' &&
                selectedOrderDetail.status !== 'Dibatalkan'
                  ? 'flex-1 bg-[#2E7D32] text-white'
                  : 'w-full bg-[#2E7D32] text-white'
              }`}
            >
              Kembali ke Riwayat Pesanan
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    /* MAIN ORDERS LIST WITH FILTER TABS */
    <div className="space-y-6">
      {/* Status Filter Tabs */}
      <div className="bg-[#FFFFFF] p-3 rounded-2xl border border-[#E0E0E0] shadow-2xs flex gap-2 overflow-x-auto no-scrollbar">
        {[
          'Semua',
          'Belum Bayar',
          'Sedang Dikemas',
          'Dikirim',
          'Selesai',
          'Dibatalkan',
        ].map((tabName) => (
          <button
            key={tabName}
            onClick={() => setOrderFilter(tabName)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              orderFilter === tabName
                ? 'bg-[#2E7D32] text-white shadow-2xs'
                : 'text-[#555555] hover:bg-[#E8F5E9]'
            }`}
          >
            {tabName}
          </button>
        ))}
      </div>

      {/* Order List Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-2xl p-12 text-center border border-[#E0E0E0]">
          <span className="material-symbols-outlined text-5xl text-[#C89B3C] mb-2">
            receipt_long
          </span>
          <h3 className="font-['Playfair_Display'] font-bold text-lg text-[#1B5E20]">
            Belum ada pesanan pada kategori ini
          </h3>
          <p className="text-xs text-[#555555] mt-1 mb-4">
            Jelajahi berbagai produk sorgum terbaik SORGUM dan buat pesanan pertama Anda.
          </p>
          <button
            onClick={onNavigateProducts}
            className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-[#1B5E20]"
          >
            Lihat Katalog Produk
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E0E0E0] shadow-2xs space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#E0E0E0] pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-['Playfair_Display'] font-bold text-lg text-[#1B5E20]">
                    {ord.orderNumber ? `#${ord.orderNumber}` : 'Pesanan'}
                  </span>
                  {ord.items[0]?.product.badge && (
                    <span className="bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                      {ord.items[0].product.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-['Playfair_Display'] font-bold text-base text-[#1B5E20]">
                    Rp {ord.totalAmount.toLocaleString('id-ID')}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                      ord.status === 'Selesai'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : ord.status === 'Dikirim'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : ord.status === 'Diproses'
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : ord.status === 'Dibatalkan'
                        ? 'bg-red-100 text-red-800 border-red-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {ord.status === 'Selesai'
                        ? 'check_circle'
                        : ord.status === 'Dikirim'
                        ? 'local_shipping'
                        : ord.status === 'Diproses'
                        ? 'inventory_2'
                        : ord.status === 'Dibatalkan'
                        ? 'cancel'
                        : 'schedule'}
                    </span>
                    <span>{ord.status.toUpperCase()}</span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#555555]">Pesanan pada {ord.createdAt}</p>

              {/* List of checked out items */}
              <div className="space-y-3 py-2 border-y border-[#E0E0E0]">
                {ord.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={it.product.image}
                        alt={it.product.name}
                        className="w-14 h-14 object-cover rounded-xl bg-[#F7F8F6] border border-[#E0E0E0] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-[#1B5E20] truncate font-['Playfair_Display']">
                          {it.product.name}
                        </p>
                        <p className="text-xs text-[#555555]">
                          {it.product.unitInfo || it.product.weight} • <strong className="text-[#1B5E20] font-bold">{it.quantity}x</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-xs text-[#1B5E20]">
                        Rp {(it.product.price * it.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setSelectedOrderDetail(ord)}
                  className="bg-[#FFFFFF] border-2 border-[#2E7D32] text-[#2E7D32] hover:bg-[#2E7D32] hover:text-white px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Lihat Detail Pesanan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}
</div>

  );
};
