import React, { useState } from 'react';
import { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#EFECE6] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-white/40 flex flex-col md:flex-row relative max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Product Image */}
        <div className="md:w-1/2 h-64 md:h-auto relative bg-[#dfd9d3]">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.badge && (
            <span className="absolute top-4 left-4 bg-[#fde08b] text-[#231b00] px-3 py-1 rounded-full font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-wider">
              {product.badge}
            </span>
          )}
        </div>

        {/* Product Details */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col overflow-y-auto bg-[#f9f3ec]">
          <span className="text-[#715c13] font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-wider mb-1">
            {product.categoryLabel}
          </span>

          <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[#162809] mb-2">
            {product.name}
          </h2>

          <p className="text-[#44483f] font-['Plus_Jakarta_Sans'] text-xs font-medium mb-4">
            {product.unitInfo}
          </p>

          <p className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#162809] mb-4">
            {product.formattedPrice}
          </p>

          <div className="flex gap-2 mb-4">
            {product.glutenFree && (
              <span className="px-2.5 py-1 bg-[#d2eabb] text-[#0e2004] text-[11px] font-bold rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">eco</span> Bebas Gluten
              </span>
            )}
            {product.organic && (
              <span className="px-2.5 py-1 bg-[#fade88] text-[#756118] text-[11px] font-bold rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">verified</span> 100% Organik
              </span>
            )}
          </div>

          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f] leading-relaxed mb-6 font-normal">
            {product.description}
          </p>

          {/* Quantity Selector & Add Button */}
          <div className="mt-auto pt-4 border-t border-[#c4c8bc]/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#44483f]">Jumlah:</span>
              <div className="flex items-center gap-3 bg-[#E1D5C7] rounded-lg px-3 py-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 flex items-center justify-center text-lg font-bold hover:text-[#162809] cursor-pointer"
                >
                  -
                </button>
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center text-lg font-bold hover:text-[#162809] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-[#2b3e1d] text-white py-3.5 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-xs sm:text-sm hover:bg-[#162809] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md btn-hover-effect cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
              <span>Tambah ke Keranjang • IDR {(product.price * quantity).toLocaleString('id-ID')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
