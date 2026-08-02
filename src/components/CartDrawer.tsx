import React, { useState } from 'react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const total = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#EFECE6] w-full max-w-md h-full flex flex-col shadow-2xl border-l border-white/20 animate-slideLeft">
        {/* Header */}
        <div className="p-5 border-b border-[#c4c8bc]/30 flex justify-between items-center bg-[#2b3e1d] text-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            <h3 className="font-['Playfair_Display'] text-xl font-bold">Keranjang Belanja</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#162809] rounded-lg transition-all text-white/80 hover:text-white"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Items List */}
        <div className="flex-grow overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#44483f]">
              <span className="material-symbols-outlined text-6xl text-[#c4c8bc] mb-3">
                remove_shopping_cart
              </span>
              <p className="font-['Playfair_Display'] text-xl font-semibold text-[#1d1b17] mb-1">
                Keranjang Anda Masih Kosong
              </p>
              <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#44483f]">
                Jelajahi produk sorgum terbaik kami dan tambahkan favorit Anda ke keranjang.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="bg-white rounded-xl p-3.5 border border-[#c4c8bc]/30 flex gap-3 shadow-sm relative group"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-lg bg-[#dfd9d3]"
                />
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="font-['Playfair_Display'] text-base font-bold text-[#162809] leading-snug">
                      {item.product.name}
                    </h4>
                    <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#44483f] font-medium">
                      {item.product.unitInfo}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#162809]">
                      IDR {(item.product.price * item.quantity).toLocaleString('id-ID')}
                    </span>

                    <div className="flex items-center gap-2 bg-[#E1D5C7] rounded-lg px-2 py-0.5">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="text-xs font-bold px-1 hover:text-[#162809] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="text-xs font-bold px-1 hover:text-[#162809] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="text-[#75786e] hover:text-red-700 transition-colors p-1 cursor-pointer"
                  title="Hapus"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#c4c8bc]/30 bg-[#f9f3ec] space-y-3">
            <div className="flex justify-between text-xs text-[#44483f] font-['Plus_Jakarta_Sans']">
              <span>Subtotal Produk</span>
              <span>IDR {total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-xs text-[#44483f] font-['Plus_Jakarta_Sans']">
              <span>Estimasi Pengiriman</span>
              <span className="text-[#162809] font-semibold">Dihitung di Checkout</span>
            </div>
            <div className="pt-2 border-t border-[#c4c8bc]/30 flex justify-between items-center">
              <span className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold text-[#1d1b17]">Total</span>
              <span className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-bold text-[#162809]">
                IDR {total.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-[#2b3e1d] text-white py-3.5 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-sm hover:bg-[#162809] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md btn-hover-effect cursor-pointer"
            >
              <span>Lanjut ke Pembayaran</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
