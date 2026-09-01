import { Product } from './index';

export type AdminActiveNav =
  | 'dashboard'
  | 'landing'
  | 'produk'
  | 'info'
  | 'faq'
  | 'lain';

export interface BannerSlide {
  id: string;
  title: string;
  titleEn?: string;
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
    type: 'text' | 'image' | 'quote';
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

