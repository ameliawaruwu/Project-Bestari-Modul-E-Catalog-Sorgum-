import { Article } from '../types';
import { request } from './http';

// Backend article row shape
interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  is_published: number | boolean;
  published_at: string | null;
  created_at: string;
  author?: string | null;
  author_role?: string | null;
  read_time?: string | null;
}

function mapArticle(a: ArticleRow): Article {
  const date = new Date(a.published_at || a.created_at);
  const dateStr = isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    id: String(a.id),
    title: a.title,
    category: (a.category as Article['category']) || 'Nutrisi',
    readTime: a.read_time || undefined,
    snippet: a.excerpt || a.content.slice(0, 150),
    content: a.content,
    image: a.image_url || '',
    date: dateStr,
    author: a.author || 'Tim Bestari',
    authorRole: a.author_role || undefined,
  };
}

export const articleApi = {
  getArticles: async (): Promise<Article[]> => {
    try {
      const res = await request<{ data: ArticleRow[] }>('/articles');
      return (res?.data || []).map(mapArticle);
    } catch {
      return [];
    }
  },

  getArticleById: async (id: string): Promise<Article | null> => {
    try {
      const res = await request<{ data: ArticleRow }>(`/articles/${id}`);
      return res?.data ? mapArticle(res.data) : null;
    } catch {
      return null;
    }
  },
};
