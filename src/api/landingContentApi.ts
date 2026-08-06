import { request } from './http';

// Landing content (konten beranda) — key-value di BE.
// GET public (beranda), PUT admin (admin panel landing page).

export const landingContentApi = {
  // Get landing content (public)
  getLandingContent: async (): Promise<Record<string, string>> => {
    try {
      const res = await request<{ data: Record<string, string> }>('/landing-content');
      return res?.data || {};
    } catch {
      return {};
    }
  },

  // Save landing content (admin only) — partial update
  saveLandingContent: async (fields: Record<string, string>): Promise<boolean> => {
    try {
      await request('/landing-content', { method: 'PUT', body: { data: fields }, auth: true });
      return true;
    } catch {
      return false;
    }
  },
};
