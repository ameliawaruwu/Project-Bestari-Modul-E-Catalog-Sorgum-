import React, { useState } from 'react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';

interface OrdersPageProps {
  onNavigateProducts: () => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigateProducts }) => {
  const { t, orders: allOrders, currentUser } = useApp();

  // Show only orders belonging to the current logged-in user
  const orders = allOrders.filter(
    (o) => !currentUser || o.customerEmail === currentUser.email || o.userId === currentUser.id
  );

  const loading = false;


  return (
    <div className="pt-24 pb-20 px-4 md:px-10 max-w-4xl mx-auto animate-fadeIn min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#162809] mb-2">
          {t('Riwayat Pesanan Saya', 'My Order History')}
        </h1>
        <p className="text-xs sm:text-sm text-[#44483f]">
          {t(
            'Pantau status pengiriman dan riwayat belanja produk sorgum BESTARI Anda.',
            'Track delivery status and shopping history of your BESTARI sorghum products.'
          )}
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-[#f9f3ec] animate-pulse rounded-2xl border border-[#c4c8bc]/30"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
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
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-[#f9f3ec] rounded-2xl p-6 border border-[#c4c8bc]/40 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#c4c8bc]/30 pb-4 mb-4 gap-2">
                <div>
                  <span className="text-xs text-[#44483f] block">
                    {t('No. Pesanan:', 'Order No.')} <strong className="text-[#1d1b17] font-bold">{ord.id}</strong>
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
