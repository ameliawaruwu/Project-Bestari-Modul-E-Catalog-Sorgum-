import { request } from './http';

// ---------------------------------------------------------------------------
// Admin-only API helpers for the BESTARI admin panel.
// All calls attach the Bearer token via http.ts (auth: true).
// ---------------------------------------------------------------------------

export const articleAdminApi = {
  // GET /api/admin/articles — list all (incl. draft)
  listArticles: async (): Promise<any[]> => {
    const res = await request<{ data: any[] }>('/admin/articles', { auth: true });
    return res?.data || [];
  },

  // POST /api/admin/articles
  createArticle: async (fields: { title: string; category: string; author?: string; content: string }) => {
    // Backend expects slug too — generate from title
    const slug = fields.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80) + `-${Date.now().toString(36).slice(-4)}`;
    const res = await request<{ data: { id: number } }>('/admin/articles', {
      method: 'POST',
      body: {
        title: fields.title,
        slug,
        category: fields.category,
        content: fields.content,
        author: fields.author,
        is_published: true,
      },
      auth: true,
    });
    return res?.data;
  },

  // PUT /api/admin/articles/:id
  updateArticle: async (id: string, fields: Record<string, any>) => {
    await request(`/admin/articles/${id}`, { method: 'PUT', body: fields, auth: true });
  },

  // DELETE /api/admin/articles/:id
  deleteArticle: async (id: string) => {
    await request(`/admin/articles/${id}`, { method: 'DELETE', auth: true });
  },
};

export const productAdminApi = {
  // GET /api/admin/products — all products incl. inactive
  listProducts: async (): Promise<any[]> => {
    const res = await request<{ data: any[] }>('/admin/products', { auth: true });
    return res?.data || [];
  },

  // POST /api/admin/products
  createProduct: async (fields: Record<string, any>) => {
    const slug = (fields.name || 'produk')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80) + `-${Date.now().toString(36).slice(-4)}`;
    const res = await request<{ data: { id: number } }>('/admin/products', {
      method: 'POST',
      body: {
        category_id: fields.category_id,
        name: fields.name,
        slug,
        description: fields.description || '',
        price: fields.price,
        stock: fields.stock,
        weight_spec: fields.weight_spec || '',
        origin: fields.origin || '',
        is_featured: !!fields.is_featured,
        gluten_free: !!fields.gluten_free,
        organic: !!fields.organic,
        badge: fields.badge || null,
      },
      auth: true,
    });
    return res?.data;
  },

  // PUT /api/admin/products/:id
  updateProduct: async (id: string, fields: Record<string, any>) => {
    await request(`/admin/products/${id}`, { method: 'PUT', body: fields, auth: true });
  },

  // PATCH /api/admin/products/:id/toggle-active
  toggleActive: async (id: string) => {
    await request(`/admin/products/${id}/toggle-active`, { method: 'PATCH', auth: true });
  },

  // DELETE /api/admin/products/:id
  deleteProduct: async (id: string) => {
    await request(`/admin/products/${id}`, { method: 'DELETE', auth: true });
  },
};
