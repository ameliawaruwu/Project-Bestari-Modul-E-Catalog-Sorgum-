export interface Product {
  id: string;
  name: string;
  category: 'beras' | 'tepung' | 'camilan' | 'pemanis' | 'benih';
  categoryLabel: string;
  price: number;
  formattedPrice?: string;
  unitInfo?: string;
  weight?: string;
  image: string;
  description: string;
  glutenFree: boolean;
  organic: boolean;
  composition?: string;
  shelfLife?: string;
  attributes?: string;
  shippingInfo?: string;
  origin?: string;
  stock?: number;
  isActive?: boolean;
  /** Nomor WhatsApp pemilik/penjual produk (fallback: nomor global toko). */
  waContact?: string;
  // Galeri gambar produk (dari product_images, diatur admin di Kelola Produk)
  images?: { id: number; image_url: string; is_primary: number; sort_order: number }[];
}

export type ArticleContentBlock =
  | { type: 'text'; content: string }
  | { type: 'image'; image_url: string; alt?: string; caption?: string }
  | { type: 'quote'; content: string; author?: string };

export interface Article {
  id: string;
  slug?: string;
  title: string;
  category: 'Nutrisi' | 'Budidaya' | 'Inspirasi' | 'Resep Sehat' | 'Cerita Petani' | 'Promosi';
  readTime?: string;
  snippet: string;
  content: string;
  contentBlocks?: ArticleContentBlock[];
  image: string;
  date: string;
  author: string;
  authorRole?: string;
  subImage?: string;
  quote?: string;
  facts?: Array<{ title: string; desc: string }>;
  /** Produk yang ditandai admin sebagai terkait artikel (tag manual). */
  productIds?: number[];
  /** Produk terkait (lengkap, dari relasi article_products). */
  relatedProducts?: Product[];
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  status?: 'AKTIF' | 'DRAFT';
  order?: number;
  tags?: string[];
  updatedAt?: string;
  viewsCount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
  phone?: string;
  birthDate?: string;
  gender?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}
