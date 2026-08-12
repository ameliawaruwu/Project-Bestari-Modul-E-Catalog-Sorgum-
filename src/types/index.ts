export interface Product {
  id: string;
  name: string;
  category: 'beras' | 'tepung' | 'camilan' | 'pemanis' | 'benih';
  categoryLabel: string;
  price: number;
  formattedPrice: string;
  originalPrice?: number;
  discountPercent?: number;
  unitInfo: string;
  badge?: string;
  image: string;
  description: string;
  weight: string;
  glutenFree: boolean;
  organic: boolean;
  composition?: string;
  shelfLife?: string;
  attributes?: string;
  shippingInfo?: string;
  origin?: string;
  stock?: number;
  isActive?: boolean;
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

export interface CartItem {
  product: Product;
  quantity: number;
  // ID row cart_items di DB (server) — dipakai mutasi (update qty / delete).
  // Diisi oleh orderApi.getCart() dari backend; item lokal (belum sync) bisa undefined.
  __cartRowId?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
  phone?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  agreeToTerms?: boolean;
  phone?: string;
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

export interface Order {
  id: string;
  userId?: string;
  orderNumber?: string;
  items: CartItem[];
  totalAmount: number;
  status: 'Pending' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Dibatalkan';
  // Status enum BE asli (pending/confirmed/processed/shipped/delivered/cancelled) —
  // FE tampilkan label gabungan (confirmed & processed sama-sama 'Diproses'),
  // tapi untuk transisi status perlu tahu enum asli.
  statusRaw?: string;
  createdAt: string;
  shippingAddress?: string;
  paymentMethod?: 'cod' | 'qris';
  paymentStatus?: 'unpaid' | 'paid' | 'confirmed';
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  province?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  notes?: string;
  courier?: string;
  trackingNumber?: string;
}

export interface CheckoutData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  notes?: string;
  paymentMethod: 'cod' | 'qris';
  voucherCode?: string;
  idempotencyKey?: string;
}
