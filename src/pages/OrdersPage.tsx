import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import { request } from '../api/http';

interface TrackingData {
  tracking: {
    courier: string;
    tracking_number: string;
    resi_status: string;
    pengirim: string;
    tujuan: string;
    checked_at: string;
  } | null;
  history: { event_date: string; description: string }[];
}

interface OrdersPageProps {
  onNavigateProducts: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigateProducts }) => {
  const { t, orders: allOrders, currentUser } = useApp();

  // Show only orders belonging to the current logged-in user
  const orders = allOrders.filter(
    (o) => !currentUser || o.customerEmail === currentUser.email || o.userId === currentUser.id
  );

  // Live tracking per order (dari BE /api/tracking/:orderId)
  const [trackingMap, setTrackingMap] = useState<Record<string, TrackingData>>({});
  // Live orders (polling /orders/mine — biar set resi/status admin langsung ke-liat)
  const [liveOrders, setLiveOrders] = useState<Order[] | null>(null);

  const displayOrders = liveOrders ?? orders;

  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      try {
        const { orderApi } = await import('../api/orderApi');
        const list = await orderApi.getOrders();
        if (!cancelled) setLiveOrders(list);
      } catch { /* keep previous */ }
    };
    loadOrders();
    const interval = setInterval(loadOrders, 20000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const map: Record<string, TrackingData> = {};
      for (const o of displayOrders) {
        if (!o.courier || !o.trackingNumber) continue;
        try {
          const res = await request<{ data: TrackingData }>(`/tracking/${o.id}`, { auth: true });
          if (!cancelled) map[o.id] = res.data;
        } catch {
          // tracking unavailable — skip
        }
      }
      if (!cancelled) setTrackingMap(map);
    };
    load();
    // Auto-refresh tracking tiap 20 detik biar update admin (set resi/status) langsung ke-liat user tanpa reload
    const interval = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayOrders.length, liveOrders === null]);

  const loading = false;


  return (
    <div className="pt-24 pb-20 px-4 md:px-10 max-w-4xl mx-auto animate-fadeIn min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#162809] mb-2">
          {t('Riwayat Pesanan Saya', 'My Order History')}
        </h1>
        <p className="text-xs sm:text-sm text-[#44483f]">
          {t(
            'Pantau status pengiriman dan riwayat belanja produk sorgum SORGUM Anda.',
            'Track delivery status and shopping history of your SORGUM sorghum products.'
          )}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-[#f9f3ec] animate-pulse rounded-2xl border border-[#c4c8bc]/30"></div>
          ))}
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="text-center py-16 bg-[#f9f3ec] rounded-2xl border border-[#c4c8bc]/30 p-8">
          <span className="material-symbols-outlined text-6xl text-[#75786e] mb-3">
            receipt_long
          </span>
          <h3 className="text-xl font-bold text-[#1d1b17] mb-2">
            {t('Belum Ada Pesanan', 'No Orders Yet')}
          </h3>
          <p className="text-xs sm:text-sm text-[#44483f] mb-6 max-w-md mx-auto">
            {t(
              'Anda belum pernah melakukan pemesanan. Mulai berbelanja produk sorgum berkualitas hari ini!',
              'You have not placed any orders yet. Start shopping for quality sorghum products today!'
            )}
          </p>
          <button
            onClick={onNavigateProducts}
            className="bg-[#2b3e1d] text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-bold hover:bg-[#162809] transition-all shadow-md btn-hover-effect cursor-pointer"
          >
            {t('Mulai Belanja Sekarang', 'Start Shopping Now')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {displayOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-[#f9f3ec] rounded-2xl p-6 border border-[#c4c8bc]/40 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#c4c8bc]/30 pb-4 mb-4 gap-2">
                <div>
                  <span className="text-xs text-[#44483f] block">
                    {t('No. Pesanan:', 'Order No.')} <strong className="text-[#1d1b17] font-bold">{ord.orderNumber || ord.id}</strong>
                  </span>
                  <span className="text-xs text-[#75786e]">
                    {t('Tanggal:', 'Date:')} {ord.createdAt}
                  </span>
                </div>
                <span
                  className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
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
                  {ord.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                {ord.items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 object-cover rounded-xl bg-[#fff8f2] border border-[#c4c8bc]/20"
                    />
                    <div className="flex-grow">
                      <h4 className="font-bold text-sm sm:text-base text-[#1d1b17]">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-[#44483f]">
                        {item.quantity}x • Rp {item.product.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {(ord.courier || ord.trackingNumber) && (
                <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#fff8f2] rounded-xl px-4 py-3 border border-[#c4c8bc]/30 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-[#2b3e1d]">
                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                    {ord.courier || 'Kurir'}
                  </span>
                  {ord.trackingNumber && (
                    <span className="font-mono font-bold text-[#162809]">Resi: {ord.trackingNumber}</span>
                  )}
                  {ord.trackingNumber && ord.courier && (
                    <a
                      href={`https://cekresi.com/cek-resi/?courier=${ord.courier}&awb=${ord.trackingNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2b3e1d] font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Lacak
                    </a>
                  )}
                </div>
              )}

              {/* Tracking timeline — dari BE /api/tracking/:orderId */}
              {trackingMap[ord.id] && (
                <div className="mb-4 rounded-xl border border-[#c4c8bc]/30 overflow-hidden">
                  <div className="bg-[#162809] text-white px-4 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">route</span>
                      {t('Riwayat Pengiriman', 'Shipping History')}
                    </span>
                    {trackingMap[ord.id].tracking?.resi_status && (
                      <span className="text-[10px] font-bold bg-white/15 px-2.5 py-1 rounded-full uppercase">
                        {trackingMap[ord.id].tracking.resi_status}
                      </span>
                    )}
                  </div>

                  {/* Info pengiriman (pengirim/tujuan/update terakhir) */}
                  {(() => {
                    const tk = trackingMap[ord.id].tracking;
                    if (!tk) return null;
                    return (
                      <div className="bg-[#faf8f5] px-4 py-3 border-b border-[#c4c8bc]/20 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-[#75786e] font-bold">{t('Pengirim', 'Sender')}</p>
                          <p className="font-semibold text-[#1d1b17] mt-0.5">{tk.pengirim || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-[#75786e] font-bold">{t('Tujuan', 'Destination')}</p>
                          <p className="font-semibold text-[#1d1b17] mt-0.5">{tk.tujuan || '-'}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-[10px] uppercase tracking-wide text-[#75786e] font-bold">{t('Update Terakhir', 'Last Update')}</p>
                          <p className="font-semibold text-[#1d1b17] mt-0.5">
                            {(() => {
                              const raw = tk.checked_at;
                              if (!raw) return '-';
                              const d = new Date(raw);
                              const ok = !isNaN(d.getTime());
                              return ok
                                ? d.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                : raw;
                            })()}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="bg-white divide-y divide-[#c4c8bc]/20">
                    {trackingMap[ord.id].history?.length > 0 ? (
                      trackingMap[ord.id].history.map((ev, idx) => (
                        <div key={idx} className="px-4 py-2.5 flex items-start gap-3">
                          <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${idx === 0 ? 'bg-emerald-500' : 'bg-[#c4c8bc]'}`}></span>
                          <div>
                            <p className="text-xs font-semibold text-[#1d1b17]">{ev.description}</p>
                            {ev.event_date && ev.event_date !== '-' && (
                              <p className="text-[10px] text-[#75786e] mt-0.5">{ev.event_date}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-[#75786e]">
                        {t('Belum ada riwayat perjalanan.', 'No shipping history yet.')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#c4c8bc]/30 flex justify-between items-center">
                <span className="text-xs font-bold text-[#44483f]">{t('Total Pembayaran', 'Total Payment')}</span>
                <span className="text-base sm:text-lg font-bold text-[#162809]">
                  Rp {ord.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
