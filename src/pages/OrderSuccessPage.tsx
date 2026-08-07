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
    `Halo Admin ${shopSettings.storeName || 'SORGUM'}, saya ingin konfirmasi pesanan *${orderId}*.\n\n` +
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
    <main className="min-h-screen pt-28 pb-16 px-4 flex items-center justify-center text-[#1B5E20] relative overflow-hidden bg-[#F7F8F6]">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#E8F5E9]/50 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-xl w-full text-center relative z-10">
        {/* Animated Success Badge */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute -inset-2 rounded-full bg-[#2E7D32]/20 blur-md animate-pulse" />
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#2E7D32] rounded-full flex items-center justify-center shadow-xl border-4 border-[#F7F8F6] relative z-10 transition-transform hover:scale-105">
              <Check className="w-10 h-10 sm:w-12 sm:h-12 text-[#C89B3C] stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-[#FFFFFF] p-6 sm:p-10 rounded-3xl shadow-2xs border border-[#E0E0E0] space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1B5E20] tracking-tight font-['Playfair_Display']">
              {t('Pesanan Berhasil!', 'Order Placed!')}
            </h1>
            <p className="text-xs sm:text-sm text-[#555555]">
              {t(
                'Terima kasih telah berbelanja produk olahan sorgum berkualitas dari SORGUM.',
                'Thank you for shopping for quality sorghum products from SORGUM.'
              )}
            </p>
          </div>

          {/* Order ID Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8F5E9] border border-[#A5D6A7] rounded-full shadow-2xs">
            <span className="text-xs text-[#555555] font-medium">{t('Nomor Pesanan:', 'Order Number:')}</span>
            <span className="text-xs font-bold text-[#1B5E20] tracking-wider font-mono">
              {orderId}
            </span>
          </div>

          {/* Order Summary Preview if items exist */}
          {order && order.items && order.items.length > 0 && (
            <div className="text-left bg-[#F7F8F6] rounded-2xl p-4 sm:p-5 border border-[#E0E0E0] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E0E0E0] text-xs font-bold text-[#1B5E20]">
                <span className="flex items-center gap-1.5 font-['Playfair_Display']">
                  <ShoppingBag className="w-4 h-4 text-[#2E7D32]" />
                  {t('Ringkasan Pesanan', 'Order Summary')}
                </span>
                <span className="bg-[#E8F5E9] border border-[#A5D6A7] text-[#1B5E20] px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold">
                  {order.paymentMethod === 'qris' ? t('Pembayaran QRIS', 'QRIS Payment') : order.paymentMethod}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-[#1B5E20]">
                    <div className="truncate max-w-[200px] sm:max-w-[260px]">
                      <span className="font-semibold">{item.product.name}</span>
                      <span className="text-[#555555] ml-1">x{item.quantity}</span>
                    </div>
                    <span className="font-semibold font-mono">
                      Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-[#E0E0E0] flex justify-between items-center text-xs font-bold text-[#1B5E20]">
                <span>{t('Total Pembayaran:', 'Total Payment:')}</span>
                <span className="text-sm font-extrabold text-[#1B5E20] font-mono">
                  Rp {(order.totalAmount || 0).toLocaleString('id-ID')}
                </span>
              </div>

              {/* Keterangan ongkir: belum termasuk, menyusul setelah konfirmasi */}
              <div className="bg-[#FFF8E1] border border-[#FFE0B2] rounded-xl p-3 space-y-1">
                <p className="text-[11px] text-[#555555] leading-relaxed">
                  {t(
                    'Pembayaran QRIS hanya untuk harga barang. Biaya ongkir belum termasuk — akan dikirim oleh admin setelah konfirmasi pesanan.',
                    'QRIS payment covers the product price only. Shipping fee is not included — it will be arranged by admin after order confirmation.'
                  )}
                </p>
                <p className="text-[11px] font-semibold text-[#1B5E20]">
                  {t(
                    'Silakan konfirmasi pembelian Anda ke admin untuk melanjutkan proses pengiriman.',
                    'Please confirm your purchase to admin to continue the shipping process.'
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Primary CTA */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#25D366] hover:bg-[#1eb958] text-white font-bold text-sm rounded-xl transition-all shadow-2xs active:scale-95"
            >
              <span>{t('Konfirmasi ke Admin via WhatsApp', 'Confirm to Admin via WhatsApp')}</span>
            </a>
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-sm rounded-xl transition-all shadow-2xs active:scale-95 cursor-pointer group"
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
