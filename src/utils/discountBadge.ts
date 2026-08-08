import { Product } from '../types';

/**
 * Badge diskon otomatis — dihitung dari data diskon produk (bukan disimpan di kolom badge).
 * - Ada diskon persen (discountPercent > 0) → "-20%"
 * - Ada diskon harga (originalPrice > price, tanpa persen) → "HEMAT Rp5.000"
 * - Tidak ada diskon → null (tanpa badge diskon)
 *
 * Dipakai di SEMUA render badge produk (ProductCard, ProductDetailPage, ProductsTab,
 * ProfilePage favorit) supaya konsisten — satu sumber kebenaran.
 */
export function discountBadgeLabel(product: Pick<Product, 'price' | 'originalPrice' | 'discountPercent'>): string | null {
  const original = product.originalPrice && product.originalPrice > 0 ? product.originalPrice : null;
  const percent = product.discountPercent && product.discountPercent > 0 ? Math.round(product.discountPercent) : null;

  if (percent) {
    return `-${percent}%`;
  }
  if (original && original > product.price) {
    const diff = original - product.price;
    const fmt = diff >= 1000
      ? `Rp${(diff / 1000).toLocaleString('id-ID')}rb`
      : `Rp${diff.toLocaleString('id-ID')}`;
    return `HEMAT ${fmt}`;
  }
  return null;
}
