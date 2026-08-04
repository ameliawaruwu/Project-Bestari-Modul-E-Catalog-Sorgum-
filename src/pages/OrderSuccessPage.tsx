import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';

interface OrderSuccessPageProps {
  order: Order | null;
  onNavigateHome: () => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({
  order,
  onNavigateHome,
}) => {
  const { t, shopSettings } = useApp();
  const orderId = order?.orderNumber || order?.id || '(tidak diketahui)';

  const waNumber = shopSettings.whatsappNumber.replace(/[^0-9]/g, '').replace(/^0/, '62');
  const waMessage = encodeURIComponent(
    `Halo Admin ${shopSettings.storeName || 'BESTARI'}, saya ingin konfirmasi pesanan *${orderId}*.\n\n` +
    `Total: Rp ${(order?.totalAmount || 0).toLocaleString('id-ID')}\n` +
    `Metode: ${order?.paymentMethod === 'qris' ? 'QRIS' : 'COD'}\n\n` +
    `Mohon diproses, terima kasih!`
  );
  const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  useEffect(() => {
    // Fire festive confetti animation on mount
    const count = 200;
    const defaults = {
      origin: { y: 0.6 },
      colors: ['#2b3e1d', '#fde08b', '#756118', '#e1d5c7', '#25D366'],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  return (
    <main className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center text-[#1d1b17] relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#fde08b]/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-xl w-full text-center relative z-10">
        {/* Animated Success Badge */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-[#2b3e1d]/15 blur-md animate-pulse" />
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#2b3e1d] rounded-full flex items-center justify-center shadow-xl border-4 border-[#f9f3ec] relative z-10 transition-transform hover:scale-105">
              <Check className="w-10 h-10 sm:w-12 sm:h-12 text-[#fde08b] stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-[#f9f3ec] p-6 sm:p-10 rounded-3xl shadow-xl border border-[#c4c8bc]/40 space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#162809] tracking-tight">
              {t('Pesanan Berhasil!', 'Order Placed!')}
            </h1>
            <p className="text-xs sm:text-sm text-[#44483f]">
              {t(
                'Terima kasih telah berbelanja produk olahan sorgum berkualitas dari BESTARI.',
                'Thank you for shopping for quality sorghum products from BESTARI.'
              )}
            </p>
          </div>

          {/* Order ID Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fade88]/80 border border-[#2b3e1d]/10 rounded-full shadow-xs">
            <span className="text-xs text-[#756118] font-medium">{t('Nomor Pesanan:', 'Order Number:')}</span>
            <span className="text-xs font-bold text-[#162809] tracking-wider font-mono">
              {orderId}
            </span>
          </div>

          {/* Order Summary Preview if items exist */}
          {order && order.items && order.items.length > 0 && (
            <div className="text-left bg-white/70 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-[#2b3e1d]/10 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2b3e1d]/10 text-xs font-bold text-[#162809]">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#2b3e1d]" />
                  {t('Ringkasan Pesanan', 'Order Summary')}
                </span>
                <span className="bg-[#2b3e1d]/10 text-[#2b3e1d] px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold">
                  {order.paymentMethod === 'qris' ? t('Pembayaran QRIS', 'QRIS Payment') : order.paymentMethod}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-[#162809]">
                    <div className="truncate max-w-[200px] sm:max-w-[260px]">
                      <span className="font-semibold">{item.product.name}</span>
                      <span className="text-[#666] ml-1">x{item.quantity}</span>
                    </div>
                    <span className="font-semibold font-mono">
                      Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#2b3e1d]/10 flex justify-between items-center text-xs font-bold text-[#162809]">
                <span>{t('Total Pembayaran:', 'Total Payment:')}</span>
                <span className="text-sm font-extrabold text-[#2b3e1d] font-mono">
                  Rp {(order.totalAmount || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Primary CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {/* Konfirmasi via WA — penting buat COD: order ke-save sebagai unpaid,
                user konfirmasi ke admin biar diproses (lihat AUDIT temuan #11) */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#25D366] hover:bg-[#1eb958] text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95"
            >
              <span>{t('Konfirmasi ke Admin via WhatsApp', 'Confirm to Admin via WhatsApp')}</span>
            </a>
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2b3e1d] hover:bg-[#162809] text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer group"
            >
              <span>{t('Kembali ke Beranda', 'Back to Home')}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
