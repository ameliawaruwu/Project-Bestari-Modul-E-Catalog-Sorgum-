import dbPool from '../../lib/db';

export async function getWishlist(userId: number) {
  const [rows] = await dbPool.query(
    `SELECT w.id AS wishlist_id, p.id, p.name, p.slug, p.price, p.description AS short_desc,
            (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) AS image_url,
            w.created_at
     FROM wishlists w
     JOIN products p ON w.product_id = p.id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC`,
    [userId],
  );
  return rows;
}

export async function addToWishlist(userId: number, productId: number) {
  const [existing] = await dbPool.query(
    'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
    [userId, productId],
  );
  if ((existing as any[]).length > 0) return null;

  await dbPool.query(
    'INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)',
    [userId, productId],
  );
  return (existing as any[]).length > 0 ? null : productId;
}

export async function removeFromWishlist(userId: number, wishlistId: number) {
  const [r] = await dbPool.query(
    'DELETE FROM wishlists WHERE id = ? AND user_id = ?',
    [wishlistId, userId],
  );
  return (r as any).affectedRows > 0;
}
