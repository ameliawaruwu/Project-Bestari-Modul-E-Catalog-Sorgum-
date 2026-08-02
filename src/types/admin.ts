import { Order, Product } from './index';

export type AdminActiveNav =
  | 'dashboard'
  | 'landing'
  | 'produk'
  | 'transaksi'
  | 'info'
  | 'user'
  | 'faq'
  | 'lain';

export interface UserAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  fullAddress: string;
  isPrimary: boolean;
}

export interface UserOrderHistoryItem {
  orderId: string;
  date: string;
  amount: number;
  formattedAmount: string;
  status: 'Selesai' | 'Diproses' | 'Dikirim' | 'Pending' | 'Dibatalkan';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
  orderCount: number;
  status: 'AKTIF' | 'NONAKTIF';
  isDeleted: boolean;
  deletedAt?: string;
  addresses: UserAddress[];
  orderHistory?: UserOrderHistoryItem[];
}

export interface BannerSlide {
  id: string;
  title: string;
  uploadDate: string;
  targetLink: string;
  image: string;
  active: boolean;
}

export interface ArticleItem {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  views: number;
  content?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  status?: 'AKTIF' | 'DRAFT';
  order?: number;
  tags?: string[];
  updatedAt?: string;
  viewsCount?: number;
}

