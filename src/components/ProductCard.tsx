import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onClickProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onClickProduct,
}) => {
  const { t } = useApp();
  return (
    <div
      onClick={() => onClickProduct(product)}
      className="group bg-white hover:shadow-md rounded-xl overflow-hidden shadow-2xs transition-all duration-300 flex flex-col relative border border-[#c4c8bc]/50 cursor-pointer btn-hover-effect"
    >
      {/* Badge */}
      {product.badge && (
        <span className="absolute top-3.5 right-3.5 z-10 bg-[#fade88] text-[#162809] border border-[#162809]/10 px-3 py-0.5 rounded-md font-['Roboto'] text-[10px] font-bold tracking-wider uppercase shadow-2xs">
          {product.badge}
        </span>
      )}

      {/* Image Container */}
      <div className="h-52 sm:h-60 overflow-hidden bg-[#faf8f5] relative border-b border-[#c4c8bc]/20">
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
        <span className="text-[#75786e] font-['Roboto'] text-[11px] font-bold uppercase tracking-wider mb-1">
          {product.categoryLabel}
        </span>

        <h3 className="font-['Roboto'] text-base sm:text-lg font-bold text-[#162809] mb-1 group-hover:text-[#2b3e1d] transition-colors leading-snug">
          {product.name}
        </h3>

        <p className="text-[#44483f]/80 font-['Roboto'] text-xs mb-4 font-medium">
          {product.unitInfo}
        </p>

        <div className="mt-auto flex justify-between items-center pt-3 border-t border-[#c4c8bc]/20">
          <span className="font-['Roboto'] text-sm sm:text-base text-[#162809] font-bold font-mono">
            {product.formattedPrice}
          </span>

          <button
            onClick={(e) => onAddToCart(product, e)}
            className="w-9 h-9 rounded-lg bg-[#2b3e1d] text-white flex items-center justify-center hover:bg-[#162809] hover:scale-105 active:scale-95 transition-all shadow-2xs focus:outline-none cursor-pointer"
            title={t('Tambah ke Keranjang', 'Add to Cart')}
            aria-label={`${t('Tambah', 'Add')} ${product.name} ${t('ke keranjang', 'to cart')}`}
          >
            <span className="material-symbols-outlined text-base">add_shopping_cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
