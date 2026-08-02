import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { shopSettingsApi, ShopSettings } from '../api';
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
  const { t } = useApp();
  const [hasClickedWa, setHasClickedWa] = useState(false);
  const [settings, setSettings] = useState<ShopSettings>(shopSettingsApi.getSettings());

  useEffect(() => {
    setSettings(shopSettingsApi.getSettings());
  }, []);

  const orderId = order?.id || '#BST-99234';
  const totalAmount = order?.totalAmount || 140000;

  const itemsSummary = order?.items
    ? order.items
        .map(
          (item) =>
            `- ${item.product.name} (${item.product.unitInfo || item.product.weight}) x${
              item.quantity
            } = Rp ${(item.product.price * item.quantity).toLocaleString('id-ID')}`
        )
        .join('\n')
    : '- Whole Sorghum Grains (1kg) x2\n- Premium Sorghum Flour (500g) x1';

  const cleanWaNumber = (settings.whatsappNumber || '6281234567890')
    .replace(/[^0-9]/g, '')
    .replace(/^0/, '62');

  const waMessage = encodeURIComponent(
    `Halo Admin ${settings.storeName || 'BESTARI'}, saya ingin konfirmasi pembayaran QRIS untuk pesanan *${orderId}*.\n\n*Detail Pesanan:*\n${itemsSummary}\n*Total Bayar: Rp ${totalAmount.toLocaleString(
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
    <main className="min-h-screen pt-28 pb-16 px-4 flex flex-col items-center justify-center text-[#1d1b17] animate-fadeIn">
      <div className="max-w-[520px] w-full bg-[#f9f3ec] rounded-2xl p-6 sm:p-10 text-center border border-[#c4c8bc]/40 shadow-xl space-y-6">
        {/* Payment Header */}
        <header>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#fade88]/30 border border-[#715c13]/20 mb-3 text-[#715c13]">
            <span className="material-symbols-outlined text-2xl">qr_code_2</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#162809] mb-2">
            {t('Pembayaran QRIS', 'QRIS Payment')}
          </h1>
          <p className="text-xs sm:text-sm text-[#44483f]">
            {t(
              'Silakan pindai kode QR di bawah ini untuk menyelesaikan pembayaran Anda.',
              'Please scan the QR code below to complete your payment.'
            )}
          </p>
        </header>

        {/* QR Code Card */}
        <div className="relative group my-4">
          <div className="bg-white p-6 rounded-2xl border border-[#c4c8bc]/40 flex flex-col items-center justify-center shadow-sm">
            {settings.qrisImageUrl ? (
              <img
                src={settings.qrisImageUrl}
                alt={`QRIS Code ${settings.storeName}`}
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                {t('Gambar QRIS Belum Dikonfigurasi', 'QRIS Image Not Configured')}
              </div>
            )}
            <p className="font-bold text-sm text-[#162809] mt-3 tracking-wide">
              {settings.storeName || 'BESTARI SORGHUM'}
            </p>
            {settings.qrisNmid && (
              <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                NMID: {settings.qrisNmid}
              </p>
            )}
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="bg-white rounded-xl p-5 space-y-3 border border-[#c4c8bc]/30 text-left shadow-xs">
          <div className="flex justify-between items-center border-b border-[#c4c8bc]/30 pb-2">
            <span className="text-[11px] font-bold text-[#44483f] uppercase tracking-wider">
              ORDER ID
            </span>
            <span className="font-bold text-base text-[#162809]">
              {orderId}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] font-bold text-[#44483f] uppercase tracking-wider">
              {t('TOTAL BAYAR', 'TOTAL AMOUNT')}
            </span>
            <span className="font-bold text-xl text-[#162809]">
              Rp {totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Action Button & Disclaimer */}
        <div className="space-y-4 pt-2">
          <button
            onClick={handleWaClick}
            className="w-full bg-[#2b3e1d] hover:bg-[#162809] text-white py-4 px-6 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer btn-hover-effect"
          >
            <span className="material-symbols-outlined text-xl">chat</span>
            <span>{t('Konfirmasi Pembayaran via WhatsApp', 'Confirm Payment via WhatsApp')}</span>
          </button>

          <p className="text-xs text-[#44483f] font-medium leading-relaxed">
            {t(
              'Setelah memindai, harap tekan tombol di atas untuk mengirim bukti pembayaran ke Admin kami.',
              'After scanning, please press the button above to send payment proof to our Admin.'
            )}
          </p>

          {hasClickedWa && (
            <button
              onClick={onCompleteOrder}
              className="mt-4 w-full bg-[#f3e8d9] hover:bg-[#e1d5c7] border border-[#2b3e1d]/30 text-[#162809] py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-center gap-2 animate-fadeIn shadow-xs"
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
