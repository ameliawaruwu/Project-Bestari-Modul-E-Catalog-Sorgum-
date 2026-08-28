import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { wishlistApi } from '../../api/wishlistApi';
import { discountBadgeLabel } from '../../utils/discountBadge';

interface ProfileFavoritesSectionProps {
  currentUser: { id: string; email: string; role?: string } | null;
  allProducts: Product[];
  ctxWishlistIds: Record<string, number>;
  onToggleWishlist: (productId: string) => Promise<boolean>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  // F4-5: klik card favorit → buka detail produk (bukan hanya like/unlike)
  onSelectProduct: (product: Product) => void;
}

/**
 * TAB "Produk Favorit" — daftar produk yang di-like user (real dari BE wishlist).
 * State lokal: favoriteProducts, wishlistIds (productId -> wishlist_id).
 */
export const ProfileFavoritesSection: React.FC<ProfileFavoritesSectionProps> = ({
  currentUser,
  allProducts,
  ctxWishlistIds,
  onToggleWishlist,
  showToast,
  onSelectProduct,
}) => {
  // Favorite Products — real dari BE wishlist (bukan mock allProducts.slice)
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Record<string, number>>({}); // productId -> wishlist_id

  useEffect(() => {
    if (!currentUser) {
      setFavoriteProducts([]);
      setWishlistIds({});
      return;
    }
    let cancelled = false;
    wishlistApi.getWishlist().then((items) => {
      if (cancelled) return;
      // items dari BE cuma {id, name, price, image...} — lengkapi dengan allProducts by id
      const enriched = items
        .map((w) => {
          const full = allProducts.find((p) => String(p.id) === String(w.id));
          return full || w;
        })
        .filter((p) => p.id);
      setFavoriteProducts(enriched);
      const idMap: Record<string, number> = {};
      // wishlist_id di-map lewat korelasi id product
      items.forEach((w) => { if (w.id) idMap[String(w.id)] = Number((w as any).wishlist_id || 0); });
      setWishlistIds(idMap);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [currentUser, allProducts, ctxWishlistIds]);

  return (
<div className="space-y-6 animate-fadeIn">
  <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#E0E0E0] shadow-2xs">
    <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1B5E20] mb-1">
      Produk Favorit Anda
    </h2>
    <p className="text-xs sm:text-sm text-[#555555] mb-6">
      Koleksi kurasi sorghum pilihan Anda, siap untuk menyempurnakan hidangan sehat keluarga.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
      {favoriteProducts.map((prod) => (
        <div
          key={prod.id}
          onClick={() => onSelectProduct(prod)}
          className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E0E0E0] relative flex flex-col justify-between group hover:shadow-md transition-shadow cursor-pointer"
        >
          {/* Heart Button — stopPropagation supaya klik heart TIDAK buka detail */}
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const ok = await onToggleWishlist(prod.id);
              if (ok) {
                setFavoriteProducts(favoriteProducts.filter((p) => p.id !== prod.id));
                showToast(`${prod.name} dihapus dari favorit.`);
              } else {
                showToast('Gagal menghapus favorit.');
              }
            }}
            className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white/90 text-[#D32F2F] flex items-center justify-center shadow-2xs hover:scale-110 transition-transform cursor-pointer"
          >
            ♥
          </button>

          <div>
            {/* Image */}
            <div className="relative rounded-xl overflow-hidden mb-3 bg-[#F7F8F6] h-48 flex items-center justify-center border border-[#E0E0E0]">
              <img
                src={prod.image}
                alt={prod.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {prod.badge && (
                <span className="absolute top-2 left-2 bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] text-[10px] font-bold px-2 py-0.5 rounded tracking-wider">
                  {prod.badge}
                </span>
              )}
              {discountBadgeLabel(prod) && (
                <span className="absolute top-2 right-2 bg-[#D32F2F] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider">
                  {discountBadgeLabel(prod)}
                </span>
              )}
            </div>

            {/* Title & info */}
            <span className="text-[10px] font-bold uppercase text-[#555555] tracking-wider block">
              {prod.categoryLabel}
            </span>
            <h3 className="font-['Playfair_Display'] font-bold text-base text-[#1B5E20] mb-1">
              {prod.name}
            </h3>
            <p className="text-xs text-[#555555] line-clamp-2 mb-3">
              {prod.description}
            </p>
          </div>

          {/* Price — F4-6: tombol keranjang dihapus (klik card buka detail produk) */}
          <div className="pt-3 border-t border-[#E0E0E0]">
            <span className="text-[10px] text-[#555555] block">{prod.unitInfo}</span>
            <span className="font-bold text-sm text-[#1B5E20]">
              {prod.formattedPrice}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

  );
};
