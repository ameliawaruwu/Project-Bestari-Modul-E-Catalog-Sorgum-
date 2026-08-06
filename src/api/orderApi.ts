import { CartItem, Order, CheckoutData, Product } from '../types';
import { request, getSessionId, getToken } from './http';

// ---------------------------------------------------------------------------
// Cart rows from backend (GET /api/cart) — server-side cart via x-session-id / token
// ---------------------------------------------------------------------------
interface CartRow {
  id: number;
  product_id: number;
  quantity: number;
  product_name: string;
  product_slug: string;
  price: number;
  stock: number;
  primary_image: string | null;
}

interface CartResponse {
  data: CartRow[];
  total: number;
}

function mapCartRow(row: CartRow): CartItem {
  const weight = row.product_slug.includes('kg') ? '1kg' : '500g';
  return {
    product: {
      id: String(row.product_id),
      name: row.product_name,
      category: 'beras', // default; real category not returned by cart endpoint
      categoryLabel: 'Produk Sorgum',
      price: row.price,
      formattedPrice: `IDR ${row.price.toLocaleString('id-ID')}`,
      unitInfo: weight,
      weight,
      image: row.primary_image || '',
      description: '',
      glutenFree: true,
      organic: true,
    },
    quantity: row.quantity,
    // Row id cart (server) — dipakai mutasi (update qty / delete).
    __cartRowId: row.id,
  };
}

// Backend order shape (GET /api/orders/mine, POST /api/orders)
interface BackendOrder {
  id: number;
  user_id: number | null;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  shipping_address: Record<string, string>;
  notes: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method: 'cod' | 'qris';
  payment_status: string;
  order_status: string;
  courier: string | null;
  tracking_number: string | null;
  created_at: string;
  items?: { id: number; product_id: number | null; product_name: string; price: number; quantity: number; subtotal: number; image_url?: string | null }[];
}

const STATUS_MAP: Record<string, Order['status']> = {
  pending: 'Pending',
  confirmed: 'Diproses',
  processed: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

// Reverse: label ID -> ENUM BE (dipakai admin update status)
export const STATUS_LABEL_TO_ENUM: Record<Order['status'], string> = {
  Pending: 'pending',
  Diproses: 'processed',
  Dikirim: 'shipped',
  Selesai: 'delivered',
  Dibatalkan: 'cancelled',
};

export function mapOrder(o: BackendOrder): Order {
  const items: CartItem[] = (o.items || []).map((it) => ({
    product: {
      id: String(it.product_id ?? it.id),
      name: it.product_name,
      category: 'beras',
      categoryLabel: 'Produk Sorgum',
      price: it.price,
      formattedPrice: `IDR ${it.price.toLocaleString('id-ID')}`,
      unitInfo: '',
      weight: '',
      image: it.image_url || '',
      description: '',
      glutenFree: true,
      organic: true,
    },
    quantity: it.quantity,
  }));

  const addr = o.shipping_address || {};
  const shippingAddress = [
    addr.address_line, addr.district, addr.city, addr.province, addr.postal_code,
  ].filter(Boolean).join(', ');

  return {
    id: String(o.id), // id numerik BE — dipakai buat API call (admin set tracking/status)
    userId: o.user_id != null ? String(o.user_id) : undefined, // string biar match dgn User.id dari mapUser
    orderNumber: o.order_number, // nomor pesanan buat tampilan (BST-XXXX)
    items,
    totalAmount: o.total,
    status: STATUS_MAP[o.order_status] || 'Pending',
    createdAt: new Date(o.created_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    }),
    shippingAddress,
    paymentMethod: o.payment_method,
    paymentStatus: (o.payment_status as Order['paymentStatus']) || undefined,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerEmail: o.customer_email || undefined,
    province: addr.province,
    city: addr.city,
    district: addr.district,
    postalCode: addr.postal_code,
    notes: o.notes || undefined,
    courier: o.courier || undefined,
    trackingNumber: o.tracking_number || undefined,
  };
}

export const orderApi = {
  // Get cart (server-side)
  getCart: async (): Promise<CartItem[]> => {
    try {
      // Snapshot token & session di awal — jangan baca ulang saat request jalan.
      // Kalau user switch saat request in-flight, cart tetep diambil utk owner yg benar.
      const token = getToken();
      const sid = getSessionId();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['x-session-id'] = sid;

      const res = await request<CartResponse>('/cart', { headers });
      return (res?.data || []).map(mapCartRow);
    } catch {
      // Backend cart unavailable -> return empty cart (no crash)
      return [];
    }
  },

  // Merge guest cart (server session) into user's server cart (login/register).
  // Dipanggil SETELAH token user tersimpan. Pakai endpoint BE POST /cart/merge
  // yang atomic: add semua item session cart ke user cart (qty di-merge oleh
  // addToCart), lalu DELETE session cart. Item server user TETAP.
  mergeCart: async (): Promise<boolean> => {
    try {
      const token = getToken();
      if (!token) return false;

      await request('/cart/merge', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      // Bersihin sisa localStorage guest key (kalau ada dari versi lama)
      try { localStorage.removeItem('bestari_cart_items_'); } catch { /* ignore */ }
      return true;
    } catch {
      return false;
    }
  },

  // ─── Server-side cart mutations (server-authoritative, per-owner) ──────
  // Semua panggil API cart langsung; state FE cuma mirror dari DB.

  // Add product ke cart server (login user via token, guest via x-session-id)
  addToCartServer: async (product: Product, quantity: number = 1): Promise<boolean> => {
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await request('/cart/add', {
        method: 'POST',
        body: { product_id: parseInt(product.id, 10), quantity },
        headers,
      });
      return true;
    } catch {
      return false;
    }
  },

  // Update qty item cart (server) — pakai row id yang sudah ada di state cart
  updateCartQtyServer: async (cartRowId: number, quantity: number): Promise<boolean> => {
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await request(`/cart/${cartRowId}`, { method: 'PUT', body: { quantity }, headers });
      return true;
    } catch {
      return false;
    }
  },

  // Hapus item cart (server) — pakai row id yang sudah ada di state cart
  removeCartItemServer: async (cartRowId: number): Promise<boolean> => {
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await request(`/cart/${cartRowId}`, { method: 'DELETE', headers });
      return true;
    } catch {
      return false;
    }
  },

  // Kosongkan cart server (user/guest) — butuh daftar row id dari state cart
  clearCartServer: async (cartRowIds: number[]): Promise<boolean> => {
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      for (const rowId of cartRowIds) {
        await request(`/cart/${rowId}`, { method: 'DELETE', headers });
      }
      return true;
    } catch {
      return false;
    }
  },

  // Place checkout order
  checkoutOrder: async (checkoutData?: CheckoutData): Promise<Order> => {
    // Ambil cart dari SERVER (sumber kebenaran) — bukan dari parameter/localStorage
    await orderApi.getCart();
    // subtotal/ongkir/diskon SEMUA dihitung server (BE hitung dari site_settings + voucher_code)
    // jangan hitung ulang di FE — biar total yang tampil selalu == total BE

    // Idempotency key: 1 key per checkout attempt (cek di CheckoutPage state).
    // BE replay kalau key sama → cegah double-submit order ganda.
    const idempotencyKey =
      checkoutData?.idempotencyKey ||
      (crypto?.randomUUID ? crypto.randomUUID() : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    const shipping_address = checkoutData
      ? {
          label: 'Rumah',
          recipient_name: checkoutData.customerName,
          phone: checkoutData.customerPhone,
          address_line: checkoutData.address,
          city: checkoutData.city,
          province: checkoutData.province,
          district: checkoutData.district,
          postal_code: checkoutData.postalCode,
        }
      : {
          label: 'Rumah',
          recipient_name: '',
          phone: '',
          address_line: '',
          city: '',
          province: '',
          district: '',
          postal_code: '',
        };

    // Token dikirim otomatis oleh http.ts kalau ada (line 65-66).
    // JANGAN pakai auth:true — itu BLOKIR guest checkout (guest gak punya token).
    // BE route POST /api/orders pakai authOptional: terima guest + user login.
    // Kalau gagal, throw error — CheckoutPage yang handle & tampilkan pesan ke user.
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await request<{ message: string; data: BackendOrder; wa_link: string }>('/orders', {
      method: 'POST',
      headers,
      body: {
        customer_name: checkoutData?.customerName || '',
        customer_email: checkoutData?.customerEmail,
        customer_phone: checkoutData?.customerPhone || '',
        shipping_address,
        notes: checkoutData?.notes,
        voucher_code: checkoutData?.voucherCode || undefined,
        idempotency_key: idempotencyKey,
        payment_method: checkoutData?.paymentMethod || 'cod',
      },
    });

    return mapOrder(res.data);
  },

  // Get order history (auth required)
  getOrders: async (): Promise<Order[]> => {
    try {
      const res = await request<{ data: BackendOrder[] }>('/orders/mine');
      return (res?.data || []).map(mapOrder);
    } catch {
      return [];
    }
  },

  // Validate voucher code (public endpoint)
  validateVoucher: async (code: string, subtotal: number): Promise<{ valid: boolean; discount?: number; message?: string }> => {
    const res = await request<{ valid: boolean; discount?: number; message?: string }>('/vouchers/validate', {
      method: 'POST',
      body: { code, subtotal },
    });
    return res;
  },
};
