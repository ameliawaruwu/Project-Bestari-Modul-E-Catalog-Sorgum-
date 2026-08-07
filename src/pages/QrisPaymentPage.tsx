import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';
import { shopSettingsApi } from '../api/shopSettingsApi';

interface QrisPaymentPageProps {
  order: Order | null;
  onCompleteOrder: () => void;
}

export const QrisPaymentPage: React.FC<QrisPaymentPageProps> = ({
  order,
  onCompleteOrder,
}) => {
  const { t, shopSettings } = useApp();
  // Local copy QRIS settings — di-refresh saat halaman dibuka supaya gambar
  // QRIS yang baru diupload admin langsung tampil (AppContext cuma fetch
  // sekali saat mount, tanpa ini gambar tetap lama sampai full reload).
  const [qris, setQris] = useState(shopSettings);

  useEffect(() => {
    let cancelled = false;
    shopSettingsApi.getSettingsAsync().then((s) => {
      if (!cancelled) {
        setQris(s as unknown as typeof shopSettings);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderId = order?.orderNumber || order?.id || '(tidak diketahui)';
  const totalAmount = order?.totalAmount || 0;

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
            {qris.qrisImageUrl ? (
              <img
                src={qris.qrisImageUrl}
                alt={`QRIS Code ${qris.storeName}`}
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 bg-[#FFFFFF] rounded-xl flex items-center justify-center text-[#555555] text-xs">
                {t('Gambar QRIS Belum Dikonfigurasi', 'QRIS Image Not Configured')}
              </div>
            )}
            <p className="font-bold text-sm text-[#1B5E20] mt-3 tracking-wide">
              {qris.storeName || 'SORGUM SORGHUM'}
            </p>
            {qris.qrisNmid && (
              <p className="text-[10px] font-mono text-[#555555] mt-0.5">
                NMID: {qris.qrisNmid}
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

        {/* Keterangan pembayaran: QRIS hanya harga barang, ongkir menyusul */}
        <div className="bg-[#FFF8E1] border border-[#FFE0B2] rounded-xl p-4 text-left text-xs text-[#555555] space-y-1.5 shadow-2xs">
          <p className="font-bold text-[#C89B3C] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">info</span>
            {t('Informasi Pembayaran', 'Payment Information')}
          </p>
          <p>
            {t(
              'Pembayaran QRIS hanya untuk harga barang. Biaya ongkir belum termasuk — akan dikirim oleh admin setelah konfirmasi pesanan.',
              'QRIS payment covers the product price only. Shipping fee is not included — it will be arranged by admin after order confirmation.'
            )}
          </p>
          <p className="font-semibold text-[#1B5E20]">
            {t(
              'Silakan konfirmasi pembelian Anda ke admin untuk melanjutkan proses pengiriman.',
              'Please confirm your purchase to admin to continue the shipping process.'
            )}
          </p>
        </div>

        {/* Action Button — langsung lanjut ke status pesanan */}
        <div className="space-y-4 pt-2">
          <button
            onClick={onCompleteOrder}
            className="mt-4 w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white py-4 px-6 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-2xs"
          >
            <span>{t('Selesai / Lihat Status Pesanan', 'Done / View Order Status')}</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </main>
  );
};
