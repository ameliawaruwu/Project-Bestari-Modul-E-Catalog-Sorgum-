import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { discountBadgeLabel } from '../utils/discountBadge';

interface ProductCardProps {
  product: Product;
  onClickProduct: (product: Product) => void;
  onRequireLogin?: () => void;
  // Guest di beranda: kartu non-interaktif (tanpa favorit, tanpa klik) — hover saja
  guestNonInteractive?: boolean;
  // Sembunyikan semua aksi (favorit) — dipakai section produk pilihan di beranda
  hideActions?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
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
      {/* Badge diskon otomatis — kiri atas, tidak tabrakan dgn badge manual */}
      {discountBadgeLabel(product) && (
        <span className="absolute top-3.5 left-3.5 z-10 bg-[#D32F2F] text-white border border-[#FFCDD2]/60 px-2.5 py-0.5 rounded-md font-['Plus_Jakarta_Sans'] text-[10px] font-bold tracking-wider shadow-2xs">
          {discountBadgeLabel(product)}
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
          {!nonInteractive && !hideActions && (
            <button
              onClick={handleToggleFavorite}
              className={`p-1 -mr-1 transition-all cursor-pointer flex-shrink-0 ${
                favorite ? 'text-[#D32F2F]' : 'text-gray-400 hover:text-[#D32F2F] hover:scale-110'
              }`}
              title={favorite ? t('Hapus dari Favorit', 'Remove from Favorites') : t('Tambah ke Favorit', 'Add to Favorites')}
              aria-label={favorite ? t('Hapus dari Favorit', 'Remove from Favorites') : t('Tambah ke Favorit', 'Add to Favorites')}
            >
              <span className={`material-symbols-outlined text-lg ${favorite ? 'filled' : ''}`}>{favorite ? 'favorite' : 'favorite_border'}</span>
            </button>
          )}
        </div>

        <h3 className="font-['Playfair_Display'] text-base sm:text-lg font-bold text-[#1B5E20] mb-1 group-hover:text-[#2E7D32] transition-colors leading-snug">
          {product.name}
        </h3>

        <p className="text-[#555555] font-['Plus_Jakarta_Sans'] text-xs mb-4 font-medium">
          {product.unitInfo}
        </p>

        <div className="mt-auto flex justify-between items-center pt-3 border-t border-[#E0E0E0]">
          <div className="flex items-center gap-1.5">
            {product.originalPrice ? (
              <>
                <span className="text-[10px] text-gray-400 line-through font-mono">
                  {product.originalPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                </span>
                <span className="font-['Plus_Jakarta_Sans'] text-sm sm:text-base text-[#1B5E20] font-bold font-mono">
                  {product.formattedPrice}
                </span>
              </>
            ) : (
              <span className="font-['Plus_Jakarta_Sans'] text-sm sm:text-base text-[#1B5E20] font-bold font-mono">
                {product.formattedPrice}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
