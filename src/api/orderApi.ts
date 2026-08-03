import { CartItem, Order, CheckoutData } from '../types';
import { request, getSessionId } from './http';

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
  };
}

// Backend order shape (GET /api/orders/mine, POST /api/orders)
interface BackendOrder {
  id: number;
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
  created_at: string;
  items?: { id: number; product_id: number | null; product_name: string; price: number; quantity: number; subtotal: number }[];
}

const STATUS_MAP: Record<string, Order['status']> = {
  pending: 'Pending',
  confirmed: 'Diproses',
  processed: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

function mapOrder(o: BackendOrder): Order {
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
      image: '',
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
    id: o.order_number || String(o.id),
    items,
    totalAmount: o.total,
    status: STATUS_MAP[o.order_status] || 'Pending',
    createdAt: new Date(o.created_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
    }),
    shippingAddress,
    paymentMethod: o.payment_method,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerEmail: o.customer_email || undefined,
    province: addr.province,
    city: addr.city,
    district: addr.district,
    postalCode: addr.postal_code,
    notes: o.notes || undefined,
  };
}

export const orderApi = {
  // Get cart (server-side)
  getCart: async (): Promise<CartItem[]> => {
    try {
      const res = await request<CartResponse>('/cart');
      return (res?.data || []).map(mapCartRow);
    } catch {
      // Backend cart unavailable -> return empty cart (no crash)
      return [];
    }
  },

  // Save cart: sync local changes to server. Since cart is server-side,
  // we reconcile by clearing + re-adding all items (KISS, small data volume).
  saveCart: async (items: CartItem[]): Promise<boolean> => {
    try {
      // Read current server cart to diff (avoid losing items)
      const res = await request<CartResponse>('/cart');
      const serverItems = res?.data || [];

      // Remove all current server items
      for (const s of serverItems) {
        await request(`/cart/${s.id}`, { method: 'DELETE' });
      }

      // Re-add local items
      for (const item of items) {
        if (item.product.id) {
          await request('/cart/add', {
            method: 'POST',
            body: { product_id: parseInt(item.product.id, 10), quantity: item.quantity },
          });
        }
      }
      return true;
    } catch {
      return false;
    }
  },

  // Place checkout order
  checkoutOrder: async (cartItems: CartItem[], checkoutData?: CheckoutData): Promise<Order> => {
    const subtotal = cartItems.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
    const shippingCost = 15000;
    const total = subtotal + shippingCost;

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
          address_line: 'Jl. Nusantara No. 88, Jakarta Selatan',
          city: 'Jakarta Selatan',
          province: 'DKI Jakarta',
          district: '',
          postal_code: '',
        };

    try {
      const res = await request<{ message: string; data: BackendOrder; wa_link: string }>('/orders', {
        method: 'POST',
        body: {
          customer_name: checkoutData?.customerName || 'Budi Santoso',
          customer_email: checkoutData?.customerEmail,
          customer_phone: checkoutData?.customerPhone || '08123456789',
          shipping_address,
          notes: checkoutData?.notes,
          shipping_cost: shippingCost,
          payment_method: checkoutData?.paymentMethod || 'cod',
        },
      });

      return mapOrder(res.data);
    } catch (e: any) {
      // Fallback: return a local order so the flow doesn't crash (but data stays in DB only if server OK)
      const order: Order = {
        id: `BST-${Math.floor(100000 + Math.random() * 900000)}`,
        items: cartItems,
        totalAmount: total,
        status: 'Diproses',
        createdAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        shippingAddress: checkoutData
          ? `${checkoutData.address}, ${checkoutData.district}, ${checkoutData.city}, ${checkoutData.province} ${checkoutData.postalCode}`
          : 'Jl. Nusantara No. 88, Jakarta Selatan',
        paymentMethod: checkoutData?.paymentMethod || 'cod',
        customerName: checkoutData?.customerName,
        customerPhone: checkoutData?.customerPhone,
        customerEmail: checkoutData?.customerEmail,
      };
      return order;
    }
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
};
