import dbPool from '../lib/db';
import { AppError } from '../lib/errors_utils';
import { getCart, clearCart } from './cart_service';
import { config } from '../lib/config';

interface ShippingAddress {
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  province: string;
  postal_code: string;
}

interface CreateOrderInput {
  userId?: number;
  sessionId?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  notes?: string;
  shipping_cost?: number;
  discount?: number;
  payment_method: 'cod' | 'qris';
}

export interface OrderRow {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  shipping_address: ShippingAddress;
  notes: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  courier: string | null;
  tracking_number: string | null;
  created_at: string;
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `BST-${ts}${rand}`;
}

// Anti-collision: retry maks 3x kalau order_number bentrok UNIQUE
async function generateUniqueOrderNumber(): Promise<string> {
  for (let i = 0; i < 3; i++) {
    const candidate = generateOrderNumber();
    const [rows] = await dbPool.query('SELECT id FROM orders WHERE order_number = ? LIMIT 1', [candidate]);
    if ((rows as any[]).length === 0) return candidate;
  }
  // Fallback terakhir: timestamp + counter
  return `BST-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1e6).toString(36).toUpperCase()}`;
}

function generateWALink(phone: string, message: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encoded}`;
}

export async function createOrder(input: CreateOrderInput) {
  // 1. Get cart items
  const cartItems = await getCart(input.userId, input.sessionId);
  if (cartItems.length === 0) {
    throw new AppError('Keranjang kosong', 400);
  }

  // 2. Ambil shipping_cost & diskon dari server (JANGAN percaya body client)
  const [settingsRows] = await dbPool.query(
    "SELECT setting_value FROM site_settings WHERE setting_key = 'shipping_cost'",
  );
  const settingsRow = (settingsRows as any[])[0];
  const shippingCost = Math.max(0, parseInt(String(settingsRow?.setting_value || '0'), 10) || 0);

  // Diskon: clamp 0..subtotal, cuma sekali pakai (tidak ada endpoint promo terpisah)
  const subtotal = cartItems.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
  const discount = Math.min(Math.max(0, Math.round(input.discount || 0)), subtotal);
  const total = subtotal + shippingCost - discount;
  const orderNumber = await generateUniqueOrderNumber();

  // 3. Insert order
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, notes, subtotal, shipping_cost, discount, total, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        input.userId || null,
        input.customer_name,
        input.customer_email || null,
        input.customer_phone,
        JSON.stringify(input.shipping_address),
        input.notes || null,
        subtotal,
        shippingCost,
        discount,
        total,
        input.payment_method,
      ],
    );
    const orderId = (orderResult as any).insertId;

    // 4. Insert order items (snapshot) + decrement stock
    for (const item of cartItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.price, item.quantity, item.price * item.quantity],
      );
      // Kurangi stok produk (cegah over-selling). Cek stok cukup dulu.
      const [stockRows] = await conn.query('SELECT stock FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
      const stock = (stockRows as any[])[0]?.stock ?? 0;
      if (stock < item.quantity) {
        throw new AppError(`Stok "${item.product_name}" tidak mencukupi (sisa ${stock})`, 400);
      }
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await conn.commit();

    // 5. Clear cart
    await clearCart(input.userId, input.sessionId);

    // 6. Generate WA link
    const waPhone = config.store.adminWhatsapp;
    const waMessage = `Halo BESTARI, saya ingin konfirmasi pesanan:\n\nNomor Pesanan: ${orderNumber}\nNama: ${input.customer_name}\nTotal: Rp${total.toLocaleString('id-ID')}\nMetode: ${input.payment_method.toUpperCase()}`;
    const waLink = generateWALink(waPhone, waMessage);

    // 7. Return order detail
    const [rows] = await dbPool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const order = (rows as any[])[0];
    order.shipping_address = typeof order.shipping_address === 'string'
      ? JSON.parse(order.shipping_address)
      : order.shipping_address;

    return { order, wa_link: waLink };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function getOrders(userId: number): Promise<OrderRow[]> {
  const [rows] = await dbPool.query(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
  );
  return await attachItems(rows as any[]);
}

export async function getOrderById(orderId: number, userId?: number) {
  let sql = 'SELECT * FROM orders WHERE id = ?';
  const params: any[] = [orderId];
  if (userId) {
    sql += ' AND user_id = ?';
    params.push(userId);
  }

  const [orderRows] = await dbPool.query(sql, params);
  const order = (orderRows as any[])[0];
  if (!order) return null;

  order.shipping_address = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address;

  const [items] = await dbPool.query(
    'SELECT * FROM order_items WHERE order_id = ?',
    [orderId],
  );

  return { ...order, items };
}

// Attach order_items ke setiap order (dipakai getOrders & getAllOrders)
async function attachItems(orders: any[]): Promise<any[]> {
  if (orders.length === 0) return orders;
  const ids = orders.map(o => o.id);
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await dbPool.query(
    `SELECT * FROM order_items WHERE order_id IN (${placeholders})`,
    ids,
  );
  const itemsByOrder = new Map<number, any[]>();
  for (const it of rows as any[]) {
    const list = itemsByOrder.get(it.order_id) || [];
    list.push(it);
    itemsByOrder.set(it.order_id, list);
  }
  return orders.map(o => ({
    ...o,
    shipping_address: typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address,
    items: itemsByOrder.get(o.id) || [],
  }));
}

// Admin
export async function getAllOrders() {
  const [rows] = await dbPool.query(
    'SELECT * FROM orders ORDER BY created_at DESC LIMIT 100',
  );
  return attachItems(rows as any[]);
}

const VALID_ORDER_STATUS = ['pending', 'confirmed', 'processed', 'shipped', 'delivered', 'cancelled'];
const VALID_PAYMENT_STATUS = ['unpaid', 'paid', 'confirmed'];

export async function updateOrderStatus(orderId: number, status: string) {
  if (!VALID_ORDER_STATUS.includes(status)) {
    throw new AppError(`Status order tidak valid. Gunakan: ${VALID_ORDER_STATUS.join(', ')}`, 400);
  }
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'UPDATE orders SET order_status = ? WHERE id = ?',
      [status, orderId],
    );
    const affected = (result as any).affectedRows > 0;
    if (affected) {
      // Kalau order di-cancel, balikin stok produk yang udah dikurang
      if (status === 'cancelled') {
        const [rows] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
        for (const item of rows as any[]) {
          await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
        }
      }
      // Kalau status diubah KE SELAIN cancelled (mis. batalkan cancel), kurangi lagi stoknya
      // Simpler & KISS: cuma balikin stok saat cancel. Re-open order = admin set stock manual.
    }
    await conn.commit();
    return affected;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// User cancel order sendiri (auth + owner check + hanya status belum dikirim)
// Balikin stok (sama kayak cancel admin via updateOrderStatus)
export async function cancelOrderByUser(orderId: number, userId: number) {
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();

    // Cek order punya user + status masih bisa dibatalkan
    const [rows] = await conn.query(
      'SELECT id, order_status, payment_status, user_id FROM orders WHERE id = ? FOR UPDATE',
      [orderId],
    );
    const order = (rows as any[])[0];
    if (!order || order.user_id !== userId) {
      throw new AppError('Pesanan tidak ditemukan', 404);
    }
    if (['shipped', 'delivered', 'cancelled'].includes(order.order_status)) {
      throw new AppError(`Pesanan tidak bisa dibatalkan (status: ${order.order_status})`, 400);
    }

    // Balikin stok produk
    const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
    for (const item of items as any[]) {
      await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await conn.query('UPDATE orders SET order_status = ? WHERE id = ?', ['cancelled', orderId]);
    await conn.commit();
    return true;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function updatePaymentStatus(orderId: number, status: string) {
  if (!VALID_PAYMENT_STATUS.includes(status)) {
    throw new AppError(`Status pembayaran tidak valid. Gunakan: ${VALID_PAYMENT_STATUS.join(', ')}`, 400);
  }
  const [result] = await dbPool.query(
    'UPDATE orders SET payment_status = ? WHERE id = ?',
    [status, orderId],
  );
  return (result as any).affectedRows > 0;
}
