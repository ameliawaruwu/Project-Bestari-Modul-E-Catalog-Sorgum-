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
  const { clause, param } = getOwnerClause(userId, sessionId);

  // Check if already in cart -> increase qty
  const [existing] = await dbPool.query(
    `SELECT id, quantity FROM cart_items c WHERE ${clause} AND product_id = ?`,
    [param, productId],
  );
  const item = (existing as any[])[0];

  if (item) {
    await dbPool.query('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, item.id]);
    return item.id;
  }

  const [result] = await dbPool.query(
    `INSERT INTO cart_items (user_id, session_id, product_id, quantity)
     VALUES (?, ?, ?, ?)`,
    [userId || null, sessionId || null, productId, quantity],
  );
  return (result as any).insertId;
}

export async function updateCartQty(cartId: number, quantity: number) {
  if (quantity < 1) throw new AppError('Quantity minimal 1', 400);
  const [result] = await dbPool.query(
    'UPDATE cart_items SET quantity = ? WHERE id = ?',
    [quantity, cartId],
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

export async function clearCart(userId?: number, sessionId?: string) {
  const { clause, param } = getOwnerClause(userId, sessionId);
  await dbPool.query(`DELETE c FROM cart_items c WHERE ${clause}`, [param]);
}
