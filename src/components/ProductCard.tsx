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

  const cat = (product.categoryLabel || product.category || '').toLowerCase();
  const badgeClass = cat.includes('beras') || cat.includes('biji')
    ? 'bg-[#FAF3E0] text-[#8C5D1E] dark:bg-[#251E14] dark:text-[#FDE68A] border-[#EAD8B8]/60 dark:border-white/10'
    : cat.includes('tepung')
    ? 'bg-[#EBF5EA] text-[#1F5132] dark:bg-[#132616] dark:text-[#86EFAC] border-[#CDE5CA]/60 dark:border-white/10'
    : cat.includes('camilan') || cat.includes('snack') || cat.includes('makanan')
    ? 'bg-[#FDF0EB] text-[#9E4324] dark:bg-[#291712] dark:text-[#FDBA74] border-[#F2D2C6]/60 dark:border-white/10'
    : 'bg-[#F0F5EE] text-[#2B3E1D] dark:bg-[#162418] dark:text-[#A5D6A7] border-[#D6E6D2]/60 dark:border-white/10';

  return (
    <div
      onClick={nonInteractive ? undefined : () => onClickProduct(product)}
      className={`group bg-white dark:bg-[#0E1A11] rounded-xl overflow-hidden shadow-xs hover:shadow-[0_12px_28px_-6px_rgba(22,40,9,0.12)] dark:hover:shadow-[0_12px_28px_-6px_rgba(58,143,75,0.22)] transition-all duration-300 flex flex-col relative border border-[#E8F5E9] dark:border-[rgba(165,214,167,0.15)] ${
        nonInteractive ? 'cursor-default' : 'cursor-pointer hover:border-[#3A8F4B]/40 dark:hover:border-[#65B86B]/40 transform hover:-translate-y-1 active:scale-[0.98]'
      }`}
    >
      {/* Image Container */}
      <div className="h-44 sm:h-48 overflow-hidden bg-gradient-to-b from-[#F0F8EF] to-[#FFFDF5] dark:bg-[#122316] relative border-b border-[#E8F5E9] dark:border-[rgba(165,214,167,0.15)]">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#E8F5E9] dark:bg-[#152718]">
            <span className="material-symbols-outlined text-4xl text-[#3A8F4B]">image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-[#3A8F4B]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      {/* Details Container */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${badgeClass}`}>
            {product.categoryLabel || product.category}
          </span>
        </div>

        <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-[#162809] dark:text-[#F4F8F3] mb-0.5 group-hover:text-[#2B3E1D] dark:group-hover:text-[#86EFAC] transition-colors leading-snug line-clamp-2">
          {product.name}
        </h3>

        {product.unitInfo && (
          <p className="text-[#6B756E] dark:text-[#CBD5C8]/80 font-['Plus_Jakarta_Sans'] text-[11px] mb-3 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-[#3A8F4B]/80 dark:text-[#65B86B]/80">scale</span>
            <span>{product.unitInfo}</span>
          </p>
        )}

        <div className="mt-auto pt-2.5 border-t border-[#E8F5E9] dark:border-[rgba(165,214,167,0.15)] flex justify-between items-center">
          <span className="font-['JetBrains_Mono'] text-sm sm:text-base text-[#162809] dark:text-[#86EFAC] font-black tracking-tight">
            {product.formattedPrice}
          </span>

          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EAF6E8] dark:bg-[#152718] group-hover:bg-[#1F5132] text-[#1F5132] dark:text-[#86EFAC] group-hover:text-white transition-all duration-200 flex items-center justify-center shadow-2xs group-hover:scale-105"
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
