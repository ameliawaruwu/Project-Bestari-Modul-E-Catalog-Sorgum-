import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onClickProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClickProduct,
}) => {
  return (
    <div
      onClick={() => onClickProduct(product)}
      className="group bg-white dark:bg-[#1a1815] hover:shadow-md rounded-xl overflow-hidden shadow-2xs transition-all duration-300 flex flex-col relative border border-[#c4c8bc]/50 dark:border-white/10 cursor-pointer btn-hover-effect"
    >
      {/* Top Badge */}
      {product.badge && (
        <span className="absolute top-3.5 right-3.5 z-10 bg-[#fade88] text-[#162809] border border-[#162809]/10 px-3 py-0.5 rounded-md font-['Plus_Jakarta_Sans'] text-[10px] font-bold tracking-wider uppercase shadow-2xs">
          {product.badge}
        </span>
      )}

      {/* Image Container */}
      <div className="h-52 sm:h-60 overflow-hidden bg-[#faf8f5] dark:bg-[#161410] relative border-b border-[#c4c8bc]/20 dark:border-white/10">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>

      {/* Details Container */}
      <div className="p-5 flex flex-col flex-grow">
        <span className="text-[#75786e] dark:text-[#8a8e86] font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider mb-1">
          {product.categoryLabel}
        </span>

        <h3 className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-bold text-[#162809] dark:text-[#f5f3f0] mb-1 group-hover:text-[#2b3e1d] dark:group-hover:text-[#fde08b] transition-colors leading-snug">
          {product.name}
        </h3>

        <p className="text-[#44483f]/80 dark:text-[#b8bcb4] font-['Plus_Jakarta_Sans'] text-xs mb-4 font-medium">
          {product.unitInfo}
        </p>

        {/* Bottom Bar: Price */}
        <div className="mt-auto flex justify-between items-center pt-3 border-t border-[#c4c8bc]/20 dark:border-white/10">
          <span className="font-['Plus_Jakarta_Sans'] text-sm sm:text-base text-[#162809] dark:text-[#fde08b] font-bold font-mono">
            {product.formattedPrice}
          </span>
        </div>
      </div>
    </div>
  );
};
