import { Article } from '../types';
import { request } from './http';
import { formatDate } from '../utils/formatDate';

// Backend article row shape
interface ArticleRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  content: string;
  content_blocks?: string | Array<Record<string, any>> | null;
  excerpt: string | null;
  image_url: string | null;
  is_published: number | boolean;
  published_at: string | null;
  created_at: string;
  author?: string | null;
  author_role?: string | null;
  read_time?: string | null;
  sub_image?: string | null;
  quote?: string | null;
  facts?: string | Array<{ title: string; desc: string }> | null;
}

function mapArticle(a: ArticleRow): Article {
  const dateStr = formatDate(a.published_at || a.created_at, 'long');

  return {
    id: String(a.id),
    slug: a.slug,
    title: a.title,
    category: (a.category as Article['category']) || 'Nutrisi',
    readTime: a.read_time || undefined,
    snippet: a.excerpt || a.content.slice(0, 150),
    content: a.content,
    contentBlocks: a.content_blocks
      ? (typeof a.content_blocks === 'string'
          ? (() => { try { return JSON.parse(a.content_blocks); } catch { return undefined; } })()
          : a.content_blocks)
      : undefined,
    image: a.image_url || '',
    date: dateStr,
    author: a.author || 'Tim Sorgum',
    authorRole: a.author_role || undefined,
    subImage: a.sub_image || undefined,
    quote: a.quote || undefined,
    facts: a.facts ? (typeof a.facts === 'string' ? JSON.parse(a.facts) : a.facts) : undefined,
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

  getArticleBySlug: async (slug: string): Promise<Article | null> => {
    try {
      const res = await request<{ data: ArticleRow }>(`/articles/${slug}`);
      return res?.data ? mapArticle(res.data) : null;
    } catch {
      return null;
    }
  },
};
