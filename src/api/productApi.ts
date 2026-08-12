import { Product } from '../types';
import { request } from './http';

// ---------------------------------------------------------------------------
// Backend raw row shape (from GET /api/products)
// ---------------------------------------------------------------------------
interface ProductRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  discount_percent: number;
  stock: number;
  weight_spec: string | null;
  origin: string | null;
  shipping_info: string | null;
  composition: string | null;
  shelf_life: string | null;
  attributes: string | null;
  is_active: number | boolean;
  is_featured: number | boolean;
  category_id: number;
  category_name: string;
  primary_image: string | null;
  created_at: string;
  gluten_free?: number | boolean;
  organic?: number | boolean;
  badge?: string | null;
}

// Map backend category name -> FE category key (contract: src/types/index.ts)
const CATEGORY_KEY_MAP: Record<string, Product['category']> = {
  'beras sorgum': 'beras',
  'tepung sorgum': 'tepung',
  'camilan sehat': 'camilan',
  'pemanis alami': 'pemanis',
  'benih sorgum': 'benih',
  'paket hemat': 'beras', // fallback to beras (no dedicated FE category)
};

function toCategoryKey(categoryName: string): Product['category'] {
  return CATEGORY_KEY_MAP[categoryName.toLowerCase()] || 'beras';
}

function formatRupiah(value: number): string {
  return `IDR ${value.toLocaleString('id-ID')}`;
}

function mapProduct(row: ProductRow): Product {
  const weight = row.weight_spec || '1kg';
  const originalPrice = row.original_price ?? null;
  return {
    id: String(row.id),
    name: row.name,
    category: toCategoryKey(row.category_name),
    categoryLabel: row.category_name || 'Produk Sorgum',
    price: row.price,
    formattedPrice: formatRupiah(row.price),
    originalPrice: originalPrice && originalPrice > row.price ? originalPrice : undefined,
    discountPercent: row.discount_percent || (originalPrice && originalPrice > row.price ? Math.round(((originalPrice - row.price) / originalPrice) * 100) : undefined),
    unitInfo: row.weight_spec || weight,
    weight,
    badge: (row.badge as Product['badge']) || undefined,
    image: row.primary_image || '',
    description: row.description || '',
    glutenFree: !!row.gluten_free,
    organic: !!row.organic,
    composition: row.composition || undefined,
    shelfLife: row.shelf_life || undefined,
    attributes: row.attributes || undefined,
    shippingInfo: row.shipping_info || 'Dikirim dari Yogyakarta.',
    origin: row.origin || undefined,
    stock: row.stock,
    isActive: !!row.is_active,
    // Galeri gambar (hanya ada di detail; list tidak membawa images[])
    images: (row as any).images?.length ? (row as any).images : undefined,
  };
}

// Backend raw row shape (product detail includes images[])
interface ProductDetailRow extends ProductRow {
  images: { id: number; image_url: string; is_primary: number; sort_order: number }[];
}

export const productApi = {
  // Get all products with optional filtering and sorting
  getProducts: async (params?: {
    category?: string;
    searchQuery?: string;
    sortBy?: 'populer' | 'harga-terendah' | 'harga-tertinggi' | 'terbaru';
  }): Promise<Product[]> => {
    const qs = new URLSearchParams();
    qs.set('limit', '100');

    if (params?.category && params.category !== 'semua' && params.category !== 'all') {
      // FE sends category key (beras/tepung/camilan/pemanis/benih) -> backend wants category_id
      // We fetch all and filter client-side to keep mapping simple (data volume is small).
      void qs;
    }

    if (params?.searchQuery && params.searchQuery.trim()) {
      qs.set('search', params.searchQuery.trim());
    }

    if (params?.sortBy) {
      const sortMap: Record<string, string> = {
        'harga-terendah': 'price_asc',
        'harga-tertinggi': 'price_desc',
        terbaru: 'newest',
      };
      const mapped = sortMap[params.sortBy];
      if (mapped) qs.set('sort', mapped);
    }

    const data = await request<any>(`/products?${qs.toString()}`);
    const rows: ProductRow[] = data?.data || [];

    let products = rows.map(mapProduct);

    // Client-side category filter (category key -> category_name)
    if (params?.category && params.category !== 'semua' && params.category !== 'all') {
      const catKey = params.category.toLowerCase();
      products = products.filter((p) => p.category === catKey);
    }

    return products;
  },

  // Get a single product by ID (backend routes by slug; FE passes id or slug)
  getProductById: async (id: string): Promise<Product | null> => {
    // If caller passes a slug, use it directly; otherwise try id
    const slug = id;
    try {
      const data = await request<{ data?: ProductDetailRow }>(`/products/${slug}`);
      if (!data?.data) return null;
      const row = data.data;
      const mapped = mapProduct(row);
      // Prefer primary image from images[] when primary_image empty
      if (!mapped.image && row.images?.length) {
        const primary = row.images.find((i) => i.is_primary) || row.images[0];
        mapped.image = primary.image_url;
      }
      return mapped;
    } catch {
      return null;
    }
  },

  // Get featured products (for home page)
  getFeaturedProducts: async (): Promise<Product[]> => {
    const data = await request<{ data?: ProductRow[] }>('/products/featured');
    return (data?.data || []).map(mapProduct);
  },
};
