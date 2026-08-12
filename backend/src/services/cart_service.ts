import dbPool from '../lib/db';
import { AppError } from '../lib/errors_utils';

export interface CartItemRow {
  id: number;
  user_id: number | null;
  session_id: string | null;
  product_id: number;
  quantity: number;
  product_name: string;
  product_slug: string;
  price: number;
  stock: number;
  primary_image: string | null;
}

function getOwnerClause(userId?: number, sessionId?: string) {
  if (userId) return { clause: 'c.user_id = ?', param: userId };
  if (sessionId) return { clause: 'c.session_id = ?', param: sessionId };
  throw new AppError('user_id atau session_id diperlukan', 400);
}

const ITEM_SELECT = `
  SELECT c.id, c.user_id, c.session_id, c.product_id, c.quantity,
         p.name AS product_name, p.slug AS product_slug, p.price, p.stock,
         (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) AS primary_image
  FROM cart_items c
  JOIN products p ON p.id = c.product_id AND p.is_active = 1
`;

export async function getCart(userId?: number, sessionId?: string): Promise<CartItemRow[]> {
  const { clause, param } = getOwnerClause(userId, sessionId);
  const [rows] = await dbPool.query(`${ITEM_SELECT} WHERE ${clause}`, [param]);
  return rows as CartItemRow[];
}

export async function addToCart(productId: number, quantity: number, userId?: number, sessionId?: string) {
  // owner_key: unik per owner (user_id XOR session_id) — constraint UNIQUE
  // (owner_key, product_id) mencegah duplikat baris cart utk produk sama,
  // termasuk saat race (double-click / request paralel).
  const ownerKey = userId
    ? `u${userId}:`
    : sessionId
      ? `s${sessionId}`
      : (() => { throw new AppError('user_id atau session_id diperlukan', 400); })();

  // Atomic upsert: kalau baris (owner, product) sudah ada, qty ditambah.
  // ON DUPLICATE KEY UPDATE menjamin tidak ada duplikat walau 2 request paralel.
  const [result] = await dbPool.query(
    `INSERT INTO cart_items (user_id, session_id, owner_key, product_id, quantity)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
    [userId || null, sessionId || null, ownerKey, productId, quantity, quantity],
  );
  return (result as any).insertId;
}

export async function updateCartQty(cartId: number, quantity: number, userId?: number, sessionId?: string) {
  if (quantity < 1) throw new AppError('Quantity minimal 1', 400);
  const { clause, param } = getOwnerClause(userId, sessionId);
  const [result] = await dbPool.query(
    `UPDATE cart_items AS c SET quantity = ? WHERE id = ? AND ${clause}`,
    [quantity, cartId, param],
  );
  return (result as any).affectedRows > 0;
}

export async function removeFromCart(cartId: number, userId?: number, sessionId?: string) {
  const { clause, param } = getOwnerClause(userId, sessionId);
  const [result] = await dbPool.query(
    `DELETE c FROM cart_items c WHERE id = ? AND ${clause}`,
    [cartId, param],
  );
  return (result as any).affectedRows > 0;
}

