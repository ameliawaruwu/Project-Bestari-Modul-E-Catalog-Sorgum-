import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';

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
  const { currentUser, isFavorite, toggleWishlist } = useApp();

  if (!product) return null;

  const favorite = isFavorite(product.id);
  const handleToggleFavorite = () => {
    if (!currentUser) return;
    toggleWishlist(product.id);
  };

  const handleAdd = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FFFFFF] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E0E0E0] flex flex-col md:flex-row relative max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Product Image */}
        <div className="md:w-1/2 h-64 md:h-auto relative bg-[#F7F8F6]">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.badge && (
            <span className="absolute top-4 left-4 bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] px-3 py-1 rounded-full font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-wider">
              {product.badge}
            </span>
          )}
        </div>

        {/* Product Details */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col overflow-y-auto bg-[#FFFFFF]">
          <span className="text-[#555555] font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-wider mb-1">
            {product.categoryLabel}
          </span>

          <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[#1B5E20] mb-2">
            {product.name}
          </h2>

          <p className="text-[#555555] font-['Plus_Jakarta_Sans'] text-xs font-medium mb-4">
            {product.unitInfo}
          </p>

          <p className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1B5E20] mb-4">
            {product.formattedPrice}
          </p>

          <div className="flex gap-2 mb-4">
            {product.glutenFree && (
              <span className="px-2.5 py-1 bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] text-[11px] font-bold rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">eco</span> Bebas Gluten
              </span>
            )}
            {product.organic && (
              <span className="px-2.5 py-1 bg-[#FFF8E1] text-[#C89B3C] border border-[#FFE0B2] text-[11px] font-bold rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">verified</span> 100% Organik
              </span>
            )}
          </div>

          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555] leading-relaxed mb-6 font-normal">
            {product.description}
          </p>

          {/* Quantity Selector & Add Button */}
          <div className="mt-auto pt-4 border-t border-[#E0E0E0] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#555555]">Jumlah:</span>
              <div className="flex items-center gap-3 bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg px-3 py-1 text-[#1B5E20]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 flex items-center justify-center text-lg font-bold hover:text-[#2E7D32] cursor-pointer"
                >
                  -
                </button>
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center text-lg font-bold hover:text-[#2E7D32] cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-[#2E7D32] text-white py-3.5 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-xs sm:text-sm hover:bg-[#1B5E20] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
              <span>Tambah ke Keranjang • IDR {(product.price * quantity).toLocaleString('id-ID')}</span>
            </button>

            {/* Favorite Button */}
            {currentUser && (
              <button
                onClick={handleToggleFavorite}
                className={`w-full flex items-center justify-center gap-2 border py-2.5 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-xs sm:text-sm transition-all active:scale-[0.98] cursor-pointer ${
                  favorite
                    ? 'border-[#D32F2F] bg-[#FFEBEE] text-[#D32F2F]'
                    : 'border-[#E0E0E0] text-[#555555] hover:border-[#D32F2F] hover:text-[#D32F2F]'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{favorite ? 'favorite' : 'favorite_border'}</span>
                <span>
                  {favorite
                    ? 'Hapus dari Favorit'
                    : 'Tambah ke Favorit'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
