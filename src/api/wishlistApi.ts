import { Product } from '../types';
import { request } from './http';

// Backend wishlist row shape (GET /api/wishlist)
interface WishlistRow {
  wishlist_id: number;
  id: number;
  name: string;
  slug: string;
  price: number;
  short_desc?: string | null;
  image_url?: string | null;
  created_at?: string;
}

function mapWishlistRow(r: WishlistRow): Product {
  return {
    id: String(r.id),
    name: r.name,
    slug: r.slug,
    price: r.price,
    description: r.short_desc || '',
    image: r.image_url || '',
    categoryId: '',
    stock: 0,
    // ProductDetailPage butuh field optional lain — default aman
  } as unknown as Product;
}

export const wishlistApi = {
  // Get my wishlist (auth required)
  getWishlist: async (): Promise<Product[]> => {
    try {
      const res = await request<{ data: WishlistRow[] }>('/wishlist', { auth: true });
      return (res?.data || []).map(mapWishlistRow);
    } catch {
      return [];
    }
  },

  // Add product to wishlist (auth required) — POST /wishlist/:productId
  addToWishlist: async (productId: string | number): Promise<boolean> => {
    try {
      await request(`/wishlist/${productId}`, { method: 'POST', auth: true });
      return true;
    } catch {
      return false;
    }
  },

  // Remove from wishlist by wishlist_id (auth required) — DELETE /wishlist/:id
  removeFromWishlist: async (wishlistId: string | number): Promise<boolean> => {
    try {
      await request(`/wishlist/${wishlistId}`, { method: 'DELETE', auth: true });
      return true;
    } catch {
      return false;
    }
  },
};
