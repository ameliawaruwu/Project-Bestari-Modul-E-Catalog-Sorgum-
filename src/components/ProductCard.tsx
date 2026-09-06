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
}) => {
  const { t } = useApp();
  const nonInteractive = !!guestNonInteractive;

  return (
    <div
      onClick={nonInteractive ? undefined : () => onClickProduct(product)}
      className={`group bg-white dark:bg-[#0E1A11] rounded-xl overflow-hidden shadow-xs hover:shadow-lg dark:hover:shadow-[0_10px_24px_-6px_rgba(58,143,75,0.2)] transition-all duration-300 flex flex-col relative border border-[#E8F5E9] dark:border-[rgba(165,214,167,0.15)] ${
        nonInteractive ? 'cursor-default' : 'cursor-pointer hover:border-[#3A8F4B]/40 dark:hover:border-[#65B86B]/40 transform hover:-translate-y-1'
      }`}
    >
      {/* Image Container */}
      <div className="h-44 sm:h-48 overflow-hidden bg-gradient-to-b from-[#F0F8EF] to-[#FFFDF5] dark:bg-[#122316] relative border-b border-[#E8F5E9] dark:border-[rgba(165,214,167,0.15)]">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#E8F5E9] dark:bg-[#152718]">
            <span className="material-symbols-outlined text-4xl text-[#3A8F4B]">image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-[#3A8F4B]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Sold out badge */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center">
            <span className="px-2.5 py-1 rounded-md bg-[#D32F2F] text-white text-[11px] font-extrabold uppercase tracking-wider shadow-md">
              {t('Habis', 'Sold Out')}
            </span>
          </div>
        )}
      </div>

      {/* Details Container */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[#6B756E] dark:text-[#CBD5C8] font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-wider">
            {product.categoryLabel}
          </span>
        </div>

        <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#1F5132] dark:text-[#F4F8F3] mb-0.5 group-hover:text-[#3A8F4B] dark:group-hover:text-[#65B86B] transition-colors leading-snug line-clamp-2">
          {product.name}
        </h3>

        {product.unitInfo && (
          <p className="text-[#6B756E] dark:text-[#CBD5C8]/80 font-['Plus_Jakarta_Sans'] text-[11px] mb-3 font-normal">
            {product.unitInfo}
          </p>
        )}

        <div className="mt-auto pt-2.5 border-t border-[#E8F5E9] dark:border-[rgba(165,214,167,0.15)] flex justify-between items-center">
          <span className="font-['JetBrains_Mono'] text-sm sm:text-base text-[#1F5132] dark:text-[#65B86B] font-extrabold">
            {product.formattedPrice}
          </span>

          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EAF6E8] dark:bg-[#152718] group-hover:bg-[#3A8F4B] text-[#1F5132] dark:text-[#86EFAC] group-hover:text-white transition-all duration-200 flex items-center justify-center shadow-2xs group-hover:scale-105"
            aria-label={t('Lihat Detail', 'View Details')}
          >
            <span className="material-symbols-outlined text-base sm:text-lg transition-transform group-hover:translate-x-0.5">
              arrow_forward
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
