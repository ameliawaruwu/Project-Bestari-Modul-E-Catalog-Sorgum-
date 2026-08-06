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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#F7F8F6] w-full max-w-md h-full flex flex-col shadow-2xl border-l border-[#E0E0E0] animate-slideLeft">
        {/* Header */}
        <div className="p-5 border-b border-[#E0E0E0] flex justify-between items-center bg-[#1B5E20] text-white">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            <h3 className="font-['Playfair_Display'] text-xl font-bold">Keranjang Belanja</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#2E7D32] rounded-lg transition-all text-white/80 hover:text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Items List */}
        <div className="flex-grow overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#555555]">
              <span className="material-symbols-outlined text-6xl text-[#C89B3C] mb-3">
                remove_shopping_cart
              </span>
              <p className="font-['Playfair_Display'] text-xl font-semibold text-[#1B5E20] mb-1">
                Keranjang Anda Masih Kosong
              </p>
              <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#555555]">
                Jelajahi produk sorgum terbaik kami dan tambahkan favorit Anda ke keranjang.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="bg-[#FFFFFF] rounded-xl p-3.5 border border-[#E0E0E0] flex gap-3 shadow-2xs relative group"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-lg bg-[#F7F8F6]"
                />
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="font-['Playfair_Display'] text-base font-bold text-[#1B5E20] leading-snug">
                      {item.product.name}
                    </h4>
                    <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#555555] font-medium">
                      {item.product.unitInfo}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#1B5E20]">
                      IDR {(item.product.price * item.quantity).toLocaleString('id-ID')}
                    </span>

                    <div className="flex items-center gap-2 bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg px-2 py-0.5 text-[#1B5E20]">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="text-xs font-bold px-1 hover:text-[#2E7D32] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="text-xs font-bold px-1 hover:text-[#2E7D32] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="text-[#D32F2F] hover:bg-[#FFEBEE] transition-colors p-1.5 rounded-lg cursor-pointer self-start"
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
          <div className="p-5 border-t border-[#E0E0E0] bg-[#FFFFFF] space-y-3">
            <div className="flex justify-between text-xs text-[#555555] font-['Plus_Jakarta_Sans']">
              <span>Subtotal Produk</span>
              <span className="font-bold text-[#1B5E20]">IDR {total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-xs text-[#555555] font-['Plus_Jakarta_Sans']">
              <span>Estimasi Pengiriman</span>
              <span className="text-[#2E7D32] font-semibold">Dihitung di Checkout</span>
            </div>
            <div className="pt-2 border-t border-[#E0E0E0] flex justify-between items-center">
              <span className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold text-[#1B5E20]">Total</span>
              <span className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-bold text-[#1B5E20]">
                IDR {total.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-[#2E7D32] text-white py-3.5 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-sm hover:bg-[#1B5E20] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
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
