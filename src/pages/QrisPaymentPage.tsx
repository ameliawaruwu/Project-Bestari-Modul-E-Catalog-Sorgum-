import React, { useState } from 'react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';

interface QrisPaymentPageProps {
  order: Order | null;
  onConfirmWhatsApp: () => void;
  onCompleteOrder: () => void;
}

export const QrisPaymentPage: React.FC<QrisPaymentPageProps> = ({
  order,
  onConfirmWhatsApp,
  onCompleteOrder,
}) => {
  const { t, shopSettings } = useApp();
  const [hasClickedWa, setHasClickedWa] = useState(false);


  const orderId = order?.orderNumber || order?.id || '(tidak diketahui)';
  const totalAmount = order?.totalAmount || 0;

  const itemsSummary = order?.items
    ? order.items
        .map(
          (item) =>
            `- ${item.product.name} (${item.product.unitInfo || item.product.weight}) x${
              item.quantity
            } = Rp ${(item.product.price * item.quantity).toLocaleString('id-ID')}`
        )
        .join('\n')
    : '';

  const cleanWaNumber = shopSettings.whatsappNumber
    .replace(/[^0-9]/g, '')
    .replace(/^0/, '62');

  const waMessage = encodeURIComponent(
    `Halo Admin ${shopSettings.storeName || 'SORGUM'}, saya ingin konfirmasi pembayaran QRIS untuk pesanan *${orderId}*.\n\n*Detail Pesanan:*\n${itemsSummary}\n*Total Bayar: Rp ${totalAmount.toLocaleString(
      'id-ID'
    )}*\n\nAtas nama: ${order?.customerName || 'Pelanggan'}\nNomor WA: ${
      order?.customerPhone || '-'
    }\n\nMohon diproses, terima kasih! (Lampiran bukti transfer di atas)`
  );

  const waUrl = `https://wa.me/${cleanWaNumber}?text=${waMessage}`;

  const handleWaClick = () => {
    window.open(waUrl, '_blank');
    setHasClickedWa(true);
    onConfirmWhatsApp();
  };

  return (
    <main className="min-h-screen pt-28 pb-16 px-4 flex flex-col items-center justify-center text-[#1B5E20] animate-fadeIn bg-[#F7F8F6]">
      <div className="max-w-[520px] w-full bg-[#FFFFFF] rounded-2xl p-6 sm:p-10 text-center border border-[#E0E0E0] shadow-2xs space-y-6">
        {/* Payment Header */}
        <header>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFF8E1] border border-[#FFE0B2] mb-3 text-[#C89B3C]">
            <span className="material-symbols-outlined text-2xl">qr_code_2</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1B5E20] mb-2 font-['Playfair_Display']">
            {t('Pembayaran QRIS', 'QRIS Payment')}
          </h1>
          <p className="text-xs sm:text-sm text-[#555555]">
            {t(
              'Silakan pindai kode QR di bawah ini untuk menyelesaikan pembayaran Anda.',
              'Please scan the QR code below to complete your payment.'
            )}
          </p>
        </header>

        {/* QR Code Card */}
        <div className="relative group my-4">
          <div className="bg-[#F7F8F6] p-6 rounded-2xl border border-[#E0E0E0] flex flex-col items-center justify-center shadow-2xs">
            {shopSettings.qrisImageUrl ? (
              <img
                src={shopSettings.qrisImageUrl}
                alt={`QRIS Code ${shopSettings.storeName}`}
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 bg-[#FFFFFF] rounded-xl flex items-center justify-center text-[#555555] text-xs">
                {t('Gambar QRIS Belum Dikonfigurasi', 'QRIS Image Not Configured')}
              </div>
            )}
            <p className="font-bold text-sm text-[#1B5E20] mt-3 tracking-wide">
              {shopSettings.storeName || 'SORGUM SORGHUM'}
            </p>
            {shopSettings.qrisNmid && (
              <p className="text-[10px] font-mono text-[#555555] mt-0.5">
                NMID: {shopSettings.qrisNmid}
              </p>
            )}
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="bg-[#F7F8F6] rounded-xl p-5 space-y-3 border border-[#E0E0E0] text-left shadow-2xs">
          <div className="flex justify-between items-center border-b border-[#E0E0E0] pb-2">
            <span className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">
              ORDER ID
            </span>
            <span className="font-bold text-base text-[#1B5E20]">
              {orderId}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">
              {t('TOTAL BAYAR', 'TOTAL AMOUNT')}
            </span>
            <span className="font-bold text-xl text-[#1B5E20]">
              Rp {totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Action Button & Disclaimer */}
        <div className="space-y-4 pt-2">
          <button
            onClick={handleWaClick}
            className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-4 px-6 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">chat</span>
            <span>{t('Konfirmasi Pembayaran via WhatsApp', 'Confirm Payment via WhatsApp')}</span>
          </button>

          <p className="text-xs text-[#555555] font-medium leading-relaxed">
            {t(
              'Setelah memindai, harap tekan tombol di atas untuk mengirim bukti pembayaran ke Admin kami.',
              'After scanning, please press the button above to send payment proof to our Admin.'
            )}
          </p>

          {hasClickedWa && (
            <button
              onClick={onCompleteOrder}
              className="mt-4 w-full bg-[#E8F5E9] hover:bg-[#A5D6A7]/30 border border-[#A5D6A7] text-[#1B5E20] py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-center gap-2 animate-fadeIn shadow-2xs"
            >
              <span>{t('Selesai / Lihat Status Pesanan', 'Done / View Order Status')}</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
};
