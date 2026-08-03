import { FaqItem } from '../types';
import { request } from './http';

// Backend faq row shape (public GET /api/articles/faq/all + admin /api/admin/articles/faq)
interface FaqRow {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
  category?: string;
  status?: 'AKTIF' | 'DRAFT';
  tags?: string[] | string | null;
  views_count?: number;
  updated_at?: string;
  created_at?: string;
}

function mapFaq(f: FaqRow): FaqItem {
  let tags: string[] | undefined;
  if (typeof f.tags === 'string') {
    try { tags = JSON.parse(f.tags); } catch { tags = undefined; }
  } else if (Array.isArray(f.tags)) {
    tags = f.tags;
  }

  return {
    id: String(f.id),
    category: f.category || 'Lainnya',
    question: f.question,
    answer: f.answer,
    status: f.status || 'AKTIF',
    order: f.sort_order || 0,
    tags,
    updatedAt: f.updated_at || f.created_at,
    viewsCount: f.views_count || 0,
  };
}

export const faqApi = {
  // Public active FAQs sorted by order
  getFaqs: async (): Promise<FaqItem[]> => {
    try {
      const res = await request<{ data: FaqRow[] }>('/articles/faq/all');
      return (res?.data || [])
        .filter((f) => f.status === undefined || f.status === 'AKTIF')
        .sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99))
        .map(mapFaq);
    } catch {
      return [];
    }
  },

  // Get all FAQs for Admin (includes DRAFTs) — auth required
  getAdminFaqs: async (): Promise<FaqItem[]> => {
    try {
      const res = await request<{ data: FaqRow[] }>('/articles/faq/all');
      return (res?.data || [])
        .sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99))
        .map(mapFaq);
    } catch {
      return [];
    }
  },

  // Save (Create or Update) FAQ — admin
  // Uses existing BE endpoints: POST /admin/articles/faq & PUT /admin/articles/faq/:id
  saveFaq: async (faqData: Partial<FaqItem>): Promise<FaqItem> => {
    const body = {
      question: faqData.question,
      answer: faqData.answer,
      category: faqData.category,
      status: faqData.status,
      sort_order: faqData.order,
      tags: faqData.tags,
    };

    try {
      if (faqData.id) {
        await request(`/admin/articles/faq/${faqData.id}`, { method: 'PUT', body, auth: true });
      } else {
        await request('/admin/articles/faq', { method: 'POST', body, auth: true });
      }
      // Return a best-effort mapped item (BE returns {data:{id}} only)
      return {
        id: faqData.id || `faq-${Date.now()}`,
        question: faqData.question || '',
        answer: faqData.answer || '',
        category: faqData.category || 'Lainnya',
        status: faqData.status || 'AKTIF',
        order: faqData.order || 0,
        tags: faqData.tags,
      };
    } catch (e: any) {
      throw e;
    }
  },

  // Toggle status — admin. BE has no toggle endpoint; emulate via PUT with flipped status.
  toggleStatus: async (id: string): Promise<FaqItem | null> => {
    try {
      // Fetch current, flip status, PUT back
      const listRes = await request<{ data: FaqRow[] }>('/articles/faq/all');
      const row = (listRes?.data || []).find((f) => String(f.id) === id);
      if (!row) return null;

      const newStatus = row.status === 'AKTIF' ? 'DRAFT' : 'AKTIF';
      await request(`/admin/articles/faq/${id}`, {
        method: 'PUT',
        body: { status: newStatus },
        auth: true,
      });
      return mapFaq({ ...row, status: newStatus });
    } catch {
      return null;
    }
  },

  // Delete FAQ — admin
  deleteFaq: async (id: string): Promise<boolean> => {
    try {
      await request(`/admin/articles/faq/${id}`, { method: 'DELETE', auth: true });
      return true;
    } catch {
      return false;
    }
  },

  // Reorder FAQ — admin. BE has no reorder endpoint; emulate by swapping sort_order via PUT.
  reorderFaq: async (id: string, direction: 'UP' | 'DOWN'): Promise<FaqItem[]> => {
    try {
      const listRes = await request<{ data: FaqRow[] }>('/articles/faq/all');
      const rows = [...(listRes?.data || [])].sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));
      const idx = rows.findIndex((f) => String(f.id) === id);
      const target = direction === 'UP' ? idx - 1 : idx + 1;
      if (idx === -1 || target < 0 || target >= rows.length) {
        return rows.map(mapFaq);
      }
      // Swap sort_order
      const a = rows[idx];
      const b = rows[target];
      const tmp = a.sort_order;
      a.sort_order = b.sort_order;
      b.sort_order = tmp;
      await request(`/admin/articles/faq/${a.id}`, { method: 'PUT', body: { sort_order: a.sort_order }, auth: true });
      await request(`/admin/articles/faq/${b.id}`, { method: 'PUT', body: { sort_order: b.sort_order }, auth: true });
      return rows.map(mapFaq);
    } catch {
      return [];
    }
  },
};
