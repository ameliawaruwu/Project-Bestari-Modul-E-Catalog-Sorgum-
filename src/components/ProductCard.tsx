import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onClickProduct: (product: Product) => void;
  onRequireLogin?: () => void;
  // Guest di beranda: kartu non-interaktif (tanpa favorit, tanpa klik) — hover saja
  guestNonInteractive?: boolean;
  // Sembunyikan semua aksi (favorit) — dipakai section produk pilihan di beranda
  hideActions?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onClickProduct,
  onRequireLogin,
  guestNonInteractive,
  hideActions,
}) => {
  const { t, currentUser, isFavorite, toggleWishlist } = useApp();
  const favorite = isFavorite(product.id);
  const isGuest = !currentUser;
  // Non-interaktif hanya untuk guest & flag aktif (section beranda)
  const nonInteractive = !!guestNonInteractive && isGuest;

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      // Belum login → redirect ke login (buka tab favorit setelah login)
      if (onRequireLogin) onRequireLogin();
      return;
    }
    toggleWishlist(product.id);
  };

  return (
    <div
      onClick={nonInteractive ? undefined : () => onClickProduct(product)}
      className={`group bg-white hover:shadow-md rounded-xl overflow-hidden shadow-2xs transition-all duration-300 flex flex-col relative border border-[#c4c8bc]/50 ${
        nonInteractive ? 'cursor-default' : 'cursor-pointer btn-hover-effect'
      }`}
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
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[#75786e] font-['Roboto'] text-[11px] font-bold uppercase tracking-wider">
            {product.categoryLabel}
          </span>
          {!nonInteractive && !hideActions && (
            <button
              onClick={handleToggleFavorite}
              className={`p-1 -mr-1 transition-all cursor-pointer flex-shrink-0 ${
                favorite ? 'text-red-500' : 'text-[#75786e]/70 hover:text-red-500 hover:scale-110'
              }`}
              title={favorite ? t('Hapus dari Favorit', 'Remove from Favorites') : t('Tambah ke Favorit', 'Add to Favorites')}
              aria-label={favorite ? t('Hapus dari Favorit', 'Remove from Favorites') : t('Tambah ke Favorit', 'Add to Favorites')}
            >
              <span className="material-symbols-outlined text-lg">{favorite ? 'favorite' : 'favorite_border'}</span>
            </button>
          )}
        </div>

        <h3 className="font-['Roboto'] text-base sm:text-lg font-bold text-[#162809] mb-1 group-hover:text-[#2b3e1d] transition-colors leading-snug">
          {product.name}
        </h3>

        <p className="text-[#44483f]/80 font-['Roboto'] text-xs mb-4 font-medium">
          {product.unitInfo}
        </p>

        <div className="mt-auto flex justify-between items-center pt-3 border-t border-[#c4c8bc]/20">
          <div className="flex items-center gap-1.5">
            {product.originalPrice ? (
              <>
                <span className="text-[10px] text-gray-400 line-through font-mono">
                  {product.originalPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                </span>
                <span className="font-['Roboto'] text-sm sm:text-base text-[#162809] font-bold font-mono">
                  {product.formattedPrice}
                </span>
              </>
            ) : (
              <span className="font-['Roboto'] text-sm sm:text-base text-[#162809] font-bold font-mono">
                {product.formattedPrice}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
