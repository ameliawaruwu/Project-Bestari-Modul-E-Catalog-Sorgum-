import { CartItem, Order, CheckoutData } from '../types';

const CART_STORAGE_KEY = 'bestari_cart_items';
const ORDERS_STORAGE_KEY = 'bestari_orders';

export const orderApi = {
  // Get cart items
  getCart: async (): Promise<CartItem[]> => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    // Default initial cart item matching badge "2" in header design
    return [
      {
        product: {
          id: 'prod-1',
          name: 'Tepung Sorghum Putih',
          category: 'tepung',
          categoryLabel: 'Tepung Sorgum',
          price: 68000,
          formattedPrice: 'IDR 68.000',
          unitInfo: 'PILIHAN: 1KG',
          weight: '1kg',
          badge: 'BEST SELLER',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCw-vao9RWgUUnbRfIFPvx9LbFTh1_nMYJ_Idzr-ReE5z91epWxtZF3bHWZO9oivNX-f9bNirUzNCw1pfaddzpzjd5hmT3A8blNq0RY88-fsr_ai8QY9cnnEikBoxQTV_hdfMIwEdOcvrRswgEMVqQe3GgZJwkkbAbsgrlEJKWU4N_WdIIZ98E5GKMd1mjrwXyPL7zZ-j0li63zbFguRRh2GLXlMwNg3lTBwmoyEqST8RCxjPE3pzc',
          description: 'Tepung sorghum putih organik halus kelas premium.',
          glutenFree: true,
          organic: true,
        },
        quantity: 2,
      },
      {
        product: {
          id: 'prod-2',
          name: 'Biji Sorghum Utuh',
          category: 'beras',
          categoryLabel: 'Beras Sorgum',
          price: 34000,
          formattedPrice: 'IDR 34.000',
          unitInfo: 'PILIHAN: 500G',
          weight: '500g',
          badge: 'BEST SELLER',
          image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvZa3BFO_HMfgtKCLz6wMJ4ajj9x5KCIkxvKTM6OGQhHNRxYXxRFP4zsrFfUMUgYmaHyDg_picy_R354oBxMzWaq1hZUoqAHjm-s4CZYXAHbd4lrSat-WB4kZco2jo6dgLjA6aghObPCCeFMg49KuwW78cmUbAFIJUeCB3TnpPjAz-1uYS-xnJ0bZtxf1B7Bn7QPFxBBSPmXeUEq9OCVCWtWNs-lM9tN7nnNYutibg8J5aOaYtyXo',
          description: 'Biji sorghum utuh kaya nutrisi alami.',
          glutenFree: true,
          organic: true,
        },
        quantity: 2,
      },
    ];
  },

  // Save cart state
  saveCart: async (items: CartItem[]): Promise<boolean> => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
    return true;
  },

  // Place checkout order
  checkoutOrder: async (cartItems: CartItem[], checkoutData?: CheckoutData): Promise<Order> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const totalItemAmount = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const shippingFee = 15000;
    const grandTotal = totalItemAmount + shippingFee;

    const fullAddress = checkoutData
      ? `${checkoutData.address}, ${checkoutData.district}, ${checkoutData.city}, ${checkoutData.province} ${checkoutData.postalCode}`
      : 'Jl. Nusantara No. 88, Jakarta Selatan';

    const newOrder: Order = {
      id: `BST-${Math.floor(100000 + Math.random() * 900000)}`,
      items: cartItems,
      totalAmount: grandTotal,
      status: 'Diproses',
      createdAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      shippingAddress: fullAddress,
      paymentMethod: checkoutData?.paymentMethod || 'cod',
      customerName: checkoutData?.customerName || 'Budi Santoso',
      customerPhone: checkoutData?.customerPhone || '08123456789',
      customerEmail: checkoutData?.customerEmail || 'alamat@email.com',
      province: checkoutData?.province,
      city: checkoutData?.city,
      district: checkoutData?.district,
      postalCode: checkoutData?.postalCode,
      notes: checkoutData?.notes,
      paymentProofUrl: checkoutData?.paymentProofUrl,
    };

    try {
      const existing = localStorage.getItem(ORDERS_STORAGE_KEY);
      const orders: Order[] = existing ? JSON.parse(existing) : [];
      orders.unshift(newOrder);
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }

    return newOrder;
  },

  // Get order history
  getOrders: async (): Promise<Order[]> => {
    try {
      const existing = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (existing) {
        return JSON.parse(existing);
      }
    } catch {
      // ignore
    }
    return [];
  },
};

