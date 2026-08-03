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
  shipping_cost: number;
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

  // 2. Calculate totals
  const subtotal = cartItems.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
  const total = subtotal + input.shipping_cost;
  const orderNumber = generateOrderNumber();

  // 3. Insert order
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, notes, subtotal, shipping_cost, total, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        input.userId || null,
        input.customer_name,
        input.customer_email || null,
        input.customer_phone,
        JSON.stringify(input.shipping_address),
        input.notes || null,
        subtotal,
        input.shipping_cost,
        total,
        input.payment_method,
      ],
    );
    const orderId = (orderResult as any).insertId;

    // 4. Insert order items (snapshot)
    for (const item of cartItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.price, item.quantity, item.price * item.quantity],
      );
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
  return (rows as any[]).map(r => ({
    ...r,
    shipping_address: typeof r.shipping_address === 'string' ? JSON.parse(r.shipping_address) : r.shipping_address,
  }));
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

// Admin
export async function getAllOrders() {
  const [rows] = await dbPool.query(
    'SELECT * FROM orders ORDER BY created_at DESC LIMIT 100',
  );
  return (rows as any[]).map(r => ({
    ...r,
    shipping_address: typeof r.shipping_address === 'string' ? JSON.parse(r.shipping_address) : r.shipping_address,
  }));
}

export async function updateOrderStatus(orderId: number, status: string) {
  const [result] = await dbPool.query(
    'UPDATE orders SET order_status = ? WHERE id = ?',
    [status, orderId],
  );
  return (result as any).affectedRows > 0;
}

export async function updatePaymentStatus(orderId: number, status: string) {
  const [result] = await dbPool.query(
    'UPDATE orders SET payment_status = ? WHERE id = ?',
    [status, orderId],
  );
  return (result as any).affectedRows > 0;
}
