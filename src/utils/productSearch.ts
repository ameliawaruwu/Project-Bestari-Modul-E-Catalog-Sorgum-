import { Product } from '../types';

/**
 * Cocokkan satu produk dengan kata kunci pencarian (case-insensitive).
 *
 * Cakupan: NAMA produk + KATEGORI (label tampilan & key internal).
 * Contoh: ketik "camilan" → ketemu semua produk kategori "Camilan Sehat",
 * meskipun nama produknya tidak memuat kata "camilan".
 *
 * Deskripsi sengaja TIDAK diikutkan — supaya pencarian seperti "nasi" tidak
 * ikut mencocokkan kata di dalam deskripsi (mis. "nasional"). Perilaku ini
 * mencerminkan pencarian server-side di
 * `backend/src/services/products_service.ts` (getProducts → filters.search),
 * jadi hasil di Beranda & halaman Produk selalu konsisten.
 */
export function matchesProductSearch(product: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [product.name, product.categoryLabel, product.category].some(
    (value) => typeof value === 'string' && value.toLowerCase().includes(q),
  );
}

/** Filter daftar produk berdasarkan kata kunci (nama produk atau kategori). */
export function filterProductsBySearch(products: Product[], query: string): Product[] {
  if (!query.trim()) return products;
  return products.filter((product) => matchesProductSearch(product, query));
}
