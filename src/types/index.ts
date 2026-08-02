export interface Product {
  id: string;
  name: string;
  category: 'beras' | 'tepung' | 'camilan' | 'pemanis' | 'benih';
  categoryLabel: string;
  price: number;
  formattedPrice: string;
  unitInfo: string;
  badge?: 'BEST SELLER' | 'DISKON 15%' | 'BARU';
  image: string;
  description: string;
  weight: string;
  glutenFree: boolean;
  organic: boolean;
  specification?: string;
  shippingInfo?: string;
}

export interface Article {
  id: string;
  title: string;
  category: 'Nutrisi' | 'Budidaya' | 'Inspirasi' | 'Resep Sehat' | 'Cerita Petani';
  readTime?: string;
  snippet: string;
  content: string;
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
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  agreeToTerms?: boolean;
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
  items: CartItem[];
  totalAmount: number;
  status: 'Pending' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Dibatalkan';
  createdAt: string;
  shippingAddress?: string;
  paymentMethod?: 'cod' | 'qris';
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  province?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  notes?: string;
  paymentProofUrl?: string;
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
  paymentProofUrl?: string;
}
