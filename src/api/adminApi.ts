import { request } from './http';

// ---------------------------------------------------------------------------
// Admin-only API helpers for the SORGUM admin panel.
// All calls attach the Bearer token via http.ts (auth: true).
// ---------------------------------------------------------------------------

export const articleAdminApi = {
  // GET /api/admin/articles — list all (incl. draft)
  listArticles: async (): Promise<any[]> => {
    const res = await request<{ data: any[] }>('/admin/articles', { auth: true });
    return res?.data || [];
  },

  // POST /api/admin/articles
  createArticle: async (fields: {
    title: string;
    category: string;
    author?: string;
    content: string;
    content_blocks?: Array<Record<string, any>>;
    image_url?: string;
    excerpt?: string;
    sub_image?: string;
    quote?: string;
    facts?: Array<{ title: string; desc: string }>;
  }) => {
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
        content_blocks: fields.content_blocks,
        image_url: fields.image_url,
        excerpt: fields.excerpt,
        sub_image: fields.sub_image,
        quote: fields.quote,
        facts: fields.facts,
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

  // DELETE /api/admin/products/:id
  deleteProduct: async (id: string) => {
    await request(`/admin/products/${id}`, { method: 'DELETE', auth: true });
  },

  // POST /api/admin/upload — upload file gambar, dapat URL
  uploadImage: async (file: File | Blob): Promise<string> => {
    // H8: enforce 1MB di FE — error jelas sebelum POST (hindari 413 nginx / 400 multer)
    const size = (file as File).size ?? (file as Blob).size;
    if (size > 1024 * 1024) {
      throw new Error('File terlalu besar. Maksimal 1MB. Gunakan gambar yang lebih kecil atau kompres dulu.');
    }
    const form = new FormData();
    form.append('image', file, (file as File).name || 'image.jpg');
    const res = await request<{ data: { url: string } }>('/admin/upload', {
      method: 'POST',
      body: form,
      isFormData: true,
      auth: true,
    });
    return res?.data?.url || '';
  },

  // POST /api/admin/products/:id/images — daftarkan gambar ke produk
  addImage: async (productId: string, imageUrl: string, isPrimary = false) => {
    await request(`/admin/products/${productId}/images`, {
      method: 'POST',
      body: { image_url: imageUrl, is_primary: isPrimary },
      auth: true,
    });
  },

  // PUT /api/admin/products/:id/images — ganti semua gambar galeri sekaligus
  // (editor galeri Kelola Produk). Gambar pertama jadi primary.
  replaceImages: async (productId: string, images: string[]) => {
    await request(`/admin/products/${productId}/images`, {
      method: 'PUT',
      body: { images },
      auth: true,
    });
  },

  // GET /api/admin/products/:id — detail produk by id (termasuk nonaktif + galeri)
  getProductById: async (id: string) => {
    const res = await request<{ data?: any }>(`/admin/products/${id}`, { auth: true });
    return res?.data || null;
  },
};

export const bannerAdminApi = {  // GET /api/admin/banners
  listBanners: async (): Promise<any[]> => {
    const res = await request<{ data: any[] }>('/admin/banners', { auth: true });
    return res?.data || [];
  },

  // POST /api/admin/banners
  createBanner: async (fields: { title: string; title_en?: string | null; image_url: string; target_type?: string; target_link?: string | null }) => {
    const res = await request<{ data: any }>('/admin/banners', {
      method: 'POST',
      body: {
        title: fields.title,
        title_en: fields.title_en || null,
        image_url: fields.image_url,
        target_type: fields.target_type || 'store',
        target_link: fields.target_link || null,
      },
      auth: true,
    });
    return res?.data;
  },

  // PUT /api/admin/banners/:id
  updateBanner: async (id: string, fields: Record<string, any>) => {
    await request(`/admin/banners/${id}`, { method: 'PUT', body: fields, auth: true });
  },

  // DELETE /api/admin/banners/:id
  deleteBanner: async (id: string) => {
    await request(`/admin/banners/${id}`, { method: 'DELETE', auth: true });
  },
};

// ─── Badge management (Kelola Badge) ───────────────────────────────────────
export interface BadgeItem {
  id: number;
  name: string;
  is_active: number | boolean;
}

export const badgeAdminApi = {
  list: async (): Promise<BadgeItem[]> => {
    const res = await request<{ data: BadgeItem[] }>('/admin/badges', { auth: true });
    return res?.data || [];
  },
  create: async (name: string) => {
    await request('/admin/badges', { method: 'POST', body: { name }, auth: true });
  },
  update: async (id: number, name: string, isActive: boolean) => {
    await request(`/admin/badges/${id}`, { method: 'PUT', body: { name, is_active: isActive }, auth: true });
  },
  remove: async (id: number) => {
    await request(`/admin/badges/${id}`, { method: 'DELETE', auth: true });
  },
};
