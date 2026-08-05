import { Order, Product } from './index';

export type AdminActiveNav =
  | 'dashboard'
  | 'landing'
  | 'produk'
  | 'transaksi'
  | 'info'
  | 'user'
  | 'faq'
  | 'voucher'
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
  createdAt?: string;
  author: string;
  views: number;
  content?: string;
  contentBlocks?: Array<{
    type: string;
    content?: string;
    image_url?: string;
    alt?: string;
    caption?: string;
    author?: string;
  }>;
  image?: string;
  subImage?: string;
  quote?: string;
  facts?: Array<{ title: string; desc: string }>;
  isPublished?: boolean;
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

