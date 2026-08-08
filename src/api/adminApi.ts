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
        // PENTING: terusan original_price + discount_percent — kalau tidak dikirim,
        // backend simpan diskon 0 → harga "tidak sesuai" (produk diskon jadi tanpa diskon).
        original_price: fields.original_price != null ? fields.original_price : fields.price,
        discount_percent: fields.discount_percent || 0,
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

  // POST /api/admin/upload — upload file gambar, dapat URL
  uploadImage: async (file: File | Blob): Promise<string> => {
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
};

export const orderAdminApi = {
  // GET /api/admin/orders
  listOrders: async (): Promise<any[]> => {
    const res = await request<{ data: any[] }>('/admin/orders', { auth: true });
    return res?.data || [];
  },

  // GET /api/admin/orders/:id
  getOrder: async (id: string) => {
    const res = await request<{ data: any }>(`/admin/orders/${id}`, { auth: true });
    return res?.data;
  },

  // PATCH /api/admin/orders/:id/status
  updateOrderStatus: async (id: string, status: string) => {
    await request(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status }, auth: true });
  },

  // PATCH /api/admin/orders/:id/payment
  updatePaymentStatus: async (id: string, status: string) => {
    await request(`/admin/orders/${id}/payment`, { method: 'PATCH', body: { status }, auth: true });
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

export const trackingAdminApi = {
  // GET /api/admin/tracking/:orderId — status pengiriman + riwayat
  getTracking: async (orderId: string): Promise<any> => {
    const res = await request<{ data: any }>(`/admin/tracking/${orderId}`, { auth: true });
    return res?.data || null;
  },
  // POST /api/admin/tracking/:orderId/set — set kurir + resi (order otomatis jadi 'shipped')
  setTracking: async (orderId: string, courier: string, trackingNumber: string) => {
    await request(`/admin/tracking/${orderId}/set`, {
      method: 'POST',
      body: { courier, tracking_number: trackingNumber },
      auth: true,
    });
  },
};

// Backend user row dari /api/admin/dashboard/users (role 'user' hanya)
export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  is_deleted?: number;
  created_at: string;
}

export const userAdminApi = {
  // GET /api/admin/dashboard/users — list semua customer
  listUsers: async (): Promise<AdminUserRow[]> => {
    const res = await request<{ data: AdminUserRow[] }>('/admin/dashboard/users', { auth: true });
    return res?.data || [];
  },

  // POST /api/admin/dashboard/users — create user baru
  createUser: async (fields: { name: string; email: string; password: string; phone?: string }) => {
    await request('/admin/dashboard/users', {
      method: 'POST',
      body: fields,
      auth: true,
    });
  },

  // PUT /api/admin/dashboard/users/:id
  updateUser: async (id: number, fields: { name?: string; email?: string; phone?: string; password?: string; is_deleted?: number }) => {
    await request(`/admin/dashboard/users/${id}`, { method: 'PUT', body: fields, auth: true });
  },

  // DELETE /api/admin/dashboard/users/:id
  deleteUser: async (id: number) => {
    await request(`/admin/dashboard/users/${id}`, { method: 'DELETE', auth: true });
  },
};

export const voucherAdminApi = {
  list: async (): Promise<any[]> => {
    const res = await request<{ data: any[] }>('/admin/vouchers', { auth: true });
    return res?.data || [];
  },
  create: async (data: any) => {
    return await request('/admin/vouchers', { method: 'POST', body: data, auth: true });
  },
  update: async (id: number, data: any) => {
    return await request(`/admin/vouchers/${id}`, { method: 'PUT', body: data, auth: true });
  },
  remove: async (id: number) => {
    return await request(`/admin/vouchers/${id}`, { method: 'DELETE', auth: true });
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

// ─── Category management (Kelola Kategori) ────────────────────────────────
export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  image_url?: string | null;
  sort_order?: number;
}

export const categoryAdminApi = {
  list: async (): Promise<CategoryItem[]> => {
    const res = await request<{ data: CategoryItem[] }>('/admin/categories', { auth: true });
    return res?.data || [];
  },
  create: async (name: string, slug: string) => {
    await request('/admin/categories', { method: 'POST', body: { name, slug }, auth: true });
  },
  update: async (id: number, name: string, slug: string) => {
    await request(`/admin/categories/${id}`, { method: 'PUT', body: { name, slug }, auth: true });
  },
  remove: async (id: number) => {
    await request(`/admin/categories/${id}`, { method: 'DELETE', auth: true });
  },
};
