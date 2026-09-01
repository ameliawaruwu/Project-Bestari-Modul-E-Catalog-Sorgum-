import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
  onClickProduct: (product: Product) => void;
  guestNonInteractive?: boolean;
  hideActions?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClickProduct,
  guestNonInteractive,
  hideActions,
}) => {
  const { t } = useApp();
  const nonInteractive = !!guestNonInteractive;

  return (
    <div
      onClick={nonInteractive ? undefined : () => onClickProduct(product)}
      className={`group bg-[#FFFFFF] hover:shadow-md rounded-2xl overflow-hidden shadow-2xs transition-all duration-300 flex flex-col relative border border-[#E0E0E0] ${
        nonInteractive ? 'cursor-default' : 'cursor-pointer hover:border-[#2E7D32]/50'
      }`}
    >
      {/* Badge */}
      {product.badge && (
        <span className="absolute top-3.5 right-3.5 z-10 bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] px-2.5 py-0.5 rounded-md font-['Plus_Jakarta_Sans'] text-[10px] font-bold tracking-wider uppercase shadow-2xs">
          {product.badge}
        </span>
      )}
      {/* Image Container */}
      <div className="h-52 sm:h-60 overflow-hidden bg-[#F7F8F6] relative border-b border-[#E0E0E0]">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#E8F5E9]">
            <span className="material-symbols-outlined text-5xl text-[#A5D6A7]">image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

        {/* H3-9: badge "Habis" — stok 0 (produk tetap bisa dilihat detailnya) */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-lg bg-[#D32F2F] text-white text-xs font-extrabold uppercase tracking-wider shadow-lg">
              {t('Habis', 'Sold Out')}
            </span>
          </div>
        )}
      </div>

      {/* Details Container */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[#555555] font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider">
            {product.categoryLabel}
          </span>
        </div>

        <h3 className="font-['Playfair_Display'] text-base sm:text-lg font-bold text-[#1B5E20] mb-1 group-hover:text-[#2E7D32] transition-colors leading-snug">
          {product.name}
        </h3>

        <p className="text-[#555555] font-['Plus_Jakarta_Sans'] text-xs mb-4 font-medium">
          {product.unitInfo}
        </p>

        <div className="mt-auto flex justify-between items-center pt-3 border-t border-[#E0E0E0]">
          <div className="flex items-center gap-1.5">
            <span className="font-['Plus_Jakarta_Sans'] text-sm sm:text-base text-[#1B5E20] font-bold font-mono">
              {product.formattedPrice}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
