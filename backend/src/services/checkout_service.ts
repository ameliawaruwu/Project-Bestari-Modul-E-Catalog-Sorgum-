import dbPool from '../lib/db';
import { AppError } from '../lib/errors_utils';
import { getCart } from './cart_service';
import { voucherService } from './voucher_service';
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
  voucher_code?: string;
  idempotency_key?: string;
  payment_method: 'cod' | 'qris';
  courier?: string;
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
  // 0. Idempotency: kalau key sudah pernah dipakai → replay order yang ada (cegah double-submit).
  //    Race 2 request dengan key sama: UNIQUE index akan tolak insert ke-2 → rollback → replay.
  if (input.idempotency_key) {
    const [existing] = await dbPool.query(
      'SELECT * FROM orders WHERE idempotency_key = ? LIMIT 1',
      [input.idempotency_key],
    );
    const existingOrder = (existing as any[])[0];
    if (existingOrder) {
      return { order: existingOrder, wa_link: null, replay: true };
    }
  }

  // 1. Get cart items
  const cartItems = await getCart(input.userId, input.sessionId);
  if (cartItems.length === 0) {
    throw new AppError('Keranjang kosong', 400);
  }

  // 2. Diskon: HANYA dari voucher yang DIVERIFIKASI server-side.
  // JANGAN pernah percaya input.discount client (bisa dimanipulasi).
  const subtotal = cartItems.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
  let discount = 0;
  let voucherId: number | null = null;
  if (input.voucher_code) {
    const vResult = await voucherService.validate(input.voucher_code, subtotal);
    if (!vResult.valid || !vResult.voucher) {
      throw new AppError(vResult.message || 'Kode voucher tidak valid', 400);
    }
    discount = Math.min(vResult.voucher.discount_amount, subtotal);
    voucherId = vResult.voucher.id;
  }
  // Ongkir TIDAK dipakai lagi (keputusan 2026-08-07: hapus ongkir dari perhitungan
  // pembayaran, baik UI maupun sistem). Total = subtotal - diskon.
  const total = subtotal - discount;
  const orderNumber = await generateUniqueOrderNumber();

  // 3. Insert order
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();

    let orderId: number;
    try {
      const [orderResult] = await conn.query(
        `INSERT INTO orders (order_number, idempotency_key, user_id, customer_name, customer_email, customer_phone,
          shipping_address, notes, subtotal, shipping_cost, discount, total, payment_method, courier)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          input.idempotency_key || null,
          input.userId || null,
          input.customer_name,
          input.customer_email || null,
          input.customer_phone,
          JSON.stringify(input.shipping_address),
          input.notes || null,
          subtotal,
          0, // shipping_cost — ongkir dihapus dari sistem (2026-08-07)
          discount,
          total,
          input.payment_method,
          input.courier || null,
        ],
      );
      orderId = (orderResult as any).insertId;
    } catch (e: any) {
      // Race double-submit: 2 request dengan idempotency_key SAMA masuk paralel.
      // Yang ke-2 kena UNIQUE constraint → replay order yang sudah ada.
      if (input.idempotency_key && e?.code === 'ER_DUP_ENTRY') {
        const [existing] = await conn.query(
          'SELECT * FROM orders WHERE idempotency_key = ? LIMIT 1',
          [input.idempotency_key],
        );
        const existingOrder = (existing as any[])[0];
        if (existingOrder) {
          await conn.rollback();
          return { order: existingOrder, wa_link: null, replay: true };
        }
      }
      throw e;
    }

    // 4. Insert order items (snapshot) + decrement stock
    for (const item of cartItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, image_url, price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.primary_image || null, item.price, item.quantity, item.price * item.quantity],
      );
      // Kurangi stok produk (cegah over-selling). Cek stok cukup dulu.
      const [stockRows] = await conn.query('SELECT stock FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
      const stock = (stockRows as any[])[0]?.stock ?? 0;
      if (stock < item.quantity) {
        throw new AppError(`Stok "${item.product_name}" tidak mencukupi (sisa ${stock})`, 400);
      }
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    // Voucher terpakai: naikkan used_count dalam transaksi yang sama (konsisten dengan order)
    if (voucherId !== null) {
      await conn.query('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?', [voucherId]);
    }

    // 5. Clear cart — DALAM transaksi yang sama (sebelum commit), biar order + cart
    //    selalu konsisten. Kalau clear gagal → rollback seluruh order (tidak ada order
    //    tanpa cart bersih, dan tidak ada stok terdecrement tanpa order).
    if (input.userId) {
      await conn.query('DELETE FROM cart_items WHERE user_id = ?', [input.userId]);
    } else if (input.sessionId) {
      await conn.query('DELETE FROM cart_items WHERE session_id = ?', [input.sessionId]);
    }

    await conn.commit();

    // 6. Generate WA link
    const waPhone = config.store.adminWhatsapp;
    const waMessage = `Halo SORGUM, saya ingin konfirmasi pesanan:\n\nNomor Pesanan: ${orderNumber}\nNama: ${input.customer_name}\nTotal: Rp${total.toLocaleString('id-ID')}\nMetode: ${input.payment_method.toUpperCase()}`;
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

export async function getOrders(userId: number, email?: string): Promise<OrderRow[]> {
  // User melihat order akunnya (user_id) + order guest yang dibuat dengan email yang sama
  // (order saat belum login — user_id NULL tapi customer_email cocok). Dedupe via DISTINCT.
  const [rows] = await dbPool.query(
    `SELECT DISTINCT o.*
     FROM orders o
     WHERE o.user_id = ?
        OR (o.customer_email IS NOT NULL AND LOWER(o.customer_email) = LOWER(?))
     ORDER BY o.created_at DESC`,
    [userId, email || ''],
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
    `SELECT oi.*,
            COALESCE(oi.image_url, pi.image_url) AS image_url
     FROM order_items oi
     LEFT JOIN (
       SELECT product_id, MIN(image_url) AS image_url
       FROM product_images WHERE is_primary = 1 GROUP BY product_id
     ) pi ON pi.product_id = oi.product_id
     WHERE oi.order_id = ?`,
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
    `SELECT oi.*,
            COALESCE(oi.image_url, pi.image_url) AS image_url
     FROM order_items oi
     LEFT JOIN (
       SELECT product_id, MIN(image_url) AS image_url
       FROM product_images WHERE is_primary = 1 GROUP BY product_id
     ) pi ON pi.product_id = oi.product_id
     WHERE oi.order_id IN (${placeholders})`,
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
  // Soft-delete: order yang dihapus admin (deleted_at SET) TIDAK muncul di
  // panel admin, tapi barisnya tetap di DB (arsip, bisa di-restore).
  const [rows] = await dbPool.query(
    'SELECT * FROM orders WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 100',
  );
  return attachItems(rows as any[]);
}

// Soft-delete order oleh admin — data TETAP di DB, hanya di-set deleted_at.
// (Keputusan user 2026-08-10: "hapus" = hilang dari tampilan admin, arsip tetap.)
export async function softDeleteOrder(orderId: number): Promise<boolean> {
  const [result] = await dbPool.query(
    'UPDATE orders SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [orderId],
  );
  return (result as any).affectedRows > 0;
}

// Restore order yang di-soft-delete (kalau admin salah hapus).
export async function restoreOrder(orderId: number): Promise<boolean> {
  const [result] = await dbPool.query(
    'UPDATE orders SET deleted_at = NULL WHERE id = ?',
    [orderId],
  );
  return (result as any).affectedRows > 0;
}

const VALID_ORDER_STATUS = ['pending', 'confirmed', 'processed', 'shipped', 'delivered', 'cancelled'];
const VALID_PAYMENT_STATUS = ['unpaid', 'paid', 'confirmed'];

// State machine transisi status order — OPSI B+ (longgar total): admin bebas set
// status apa pun, termasuk mundur (mis. Dikirim → Diproses) DAN dari status terminal
// (delivered/cancelled) ke status lain. 
// (Keputusan user 2026-08-06: dropdown FE menampilkan SEMUA status.
//  Keputusan user 2026-08-10: delivered/cancelled TIDAK boleh dikunci — admin harus
//  bisa mengubah status selesai/dibatalkan kalau ada apa-apa setelahnya.)
const ALLOWED_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['pending', 'confirmed', 'processed', 'shipped', 'delivered', 'cancelled'],
  confirmed: ['pending', 'confirmed', 'processed', 'shipped', 'delivered', 'cancelled'],
  processed: ['pending', 'confirmed', 'processed', 'shipped', 'delivered', 'cancelled'],
  shipped: ['pending', 'confirmed', 'processed', 'shipped', 'delivered', 'cancelled'],
  delivered: ['pending', 'confirmed', 'processed', 'shipped', 'delivered', 'cancelled'],
  cancelled: ['pending', 'confirmed', 'processed', 'shipped', 'delivered', 'cancelled'],
};

export async function updateOrderStatus(orderId: number, status: string) {
  if (!VALID_ORDER_STATUS.includes(status)) {
    throw new AppError(`Status order tidak valid. Gunakan: ${VALID_ORDER_STATUS.join(', ')}`, 400);
  }
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    // Cek status sekarang (FOR UPDATE biar race aman)
    const [rows] = await conn.query(
      'SELECT order_status FROM orders WHERE id = ? FOR UPDATE',
      [orderId],
    );
    const order = (rows as any[])[0];
    if (!order) {
      await conn.rollback();
      return false;
    }
    const current = order.order_status;
    // Transisi sama dengan sekarang → idempotent sukses (return true, jangan UPDATE —
    // kalau UPDATE dengan nilai sama, MySQL affectedRows=0 → keliru dianggap gagal/404).
    if (status === current) {
      await conn.rollback();
      return true;
    }
    const allowed = ALLOWED_ORDER_TRANSITIONS[current] || [];
    if (!allowed.includes(status)) {
      // Order sudah terminal (delivered/cancelled) — jangan lempar error mentah ke admin.
      // Return no-op sukses dgn flag unchanged supaya FE bisa tampilkan info ramah
      // (bukan toast error "Transisi status tidak valid" yang ambigu).
      await conn.rollback();
      return { unchanged: true, current };
    }
    const [result] = await conn.query(
      'UPDATE orders SET order_status = ? WHERE id = ?',
      [status, orderId],
    );
    const affected = (result as any).affectedRows > 0;
    if (affected) {
      // Kalau order di-cancel, balikin stok produk yang udah dikurang
      if (status === 'cancelled' && current !== 'cancelled') {
        const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
        for (const item of items as any[]) {
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

// User cancel order sendiri (auth + owner check)
// HANYA status pending yang bisa dicancel user — setelah diproses/dikirim,
// user tidak bisa membatalkan lagi (keputusan user 2026-08-10, koreksi:
// awalnya shipped ikut dibolehkan, ternyata harus pending saja).
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
    if (order.order_status !== 'pending') {
      throw new AppError(`Pesanan hanya bisa dibatalkan saat status Pending (status saat ini: ${order.order_status})`, 400);
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

// State machine transisi status pembayaran — OPSI B (longgar): admin bebas set,
// termasuk mundur (mis. paid → unpaid kalau salah verifikasi). Tidak ada terminal.
// (Keputusan user 2026-08-06: dropdown FE menampilkan SEMUA status pembayaran.)
const ALLOWED_PAYMENT_TRANSITIONS: Record<string, string[]> = {
  unpaid: ['unpaid', 'paid', 'confirmed'],
  paid: ['unpaid', 'paid', 'confirmed'],
  confirmed: ['unpaid', 'paid', 'confirmed'],
};

export async function updatePaymentStatus(orderId: number, status: string) {
  if (!VALID_PAYMENT_STATUS.includes(status)) {
    throw new AppError(`Status pembayaran tidak valid. Gunakan: ${VALID_PAYMENT_STATUS.join(', ')}`, 400);
  }
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT payment_status FROM orders WHERE id = ? FOR UPDATE',
      [orderId],
    );
    const order = (rows as any[])[0];
    if (!order) {
      await conn.rollback();
      return false;
    }
    const current = order.payment_status;
    // Transisi sama → idempotent sukses (return true tanpa UPDATE, hindari affectedRows=0 → 404)
    if (status === current) {
      await conn.rollback();
      return true;
    }
    const allowed = ALLOWED_PAYMENT_TRANSITIONS[current] || [];
    if (!allowed.includes(status)) {
      throw new AppError(`Transisi status pembayaran tidak valid: ${current} → ${status}`, 400);
    }
    const [result] = await conn.query(
      'UPDATE orders SET payment_status = ? WHERE id = ?',
      [status, orderId],
    );
    await conn.commit();
    return (result as any).affectedRows > 0;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
