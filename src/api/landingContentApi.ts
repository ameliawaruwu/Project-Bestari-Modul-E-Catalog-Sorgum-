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

  // Save landing content (admin only) — partial update.
  // Return data landing content TERBARU dari BE (termasuk field *En hasil
  // auto-translate), atau null kalau gagal. Pemanggil (AppContext) wajib pakai
  // return ini untuk update state — JANGAN pakai objek kiriman (yang tidak punya
  // *En baru → halaman bahasa EN jadi mismatch setelah save).
  saveLandingContent: async (fields: Record<string, string>): Promise<Record<string, string> | null> => {
    try {
      const res = await request<{ message: string; data: Record<string, string> }>('/landing-content', {
        method: 'PUT',
        body: { data: fields },
        auth: true,
      });
      return res?.data || null;
    } catch {
      return null;
    }
  },
};
