import { Router, Request, Response } from 'express';
import { getCart, addToCart, updateCartQty, removeFromCart } from '../services/cart_service';
import { verifyToken } from '../lib/jwt_utils';
import dbPool from '../lib/db';

const router = Router();

function getCartOwner(req: Request): { userId?: number; sessionId?: string } {
  // Logged-in user (via Bearer token) -> use userId
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = verifyToken(header.slice(7));
      if (payload?.userId) return { userId: payload.userId };
    } catch {
      // invalid token — fall through to session id
    }
  }
  // Guest -> use session_id from header/query
  const sid = (req.headers['x-session-id'] as string) || (req.query.session_id as string);
  if (!sid) return {};
  return { sessionId: sid };
}

// Works for both guest (via x-session-id header) and logged-in users
router.get('/', async (req: Request, res: Response) => {
  const owner = getCartOwner(req);
  if (!owner.userId && !owner.sessionId) {
    res.status(400).json({ error: 'Session ID diperlukan. Kirim via header x-session-id' });
    return;
  }
  const data = await getCart(owner.userId, owner.sessionId);
  const total = data.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ data, total });
});

router.post('/add', async (req: Request, res: Response) => {
  const owner = getCartOwner(req);
  if (!owner.userId && !owner.sessionId) {
    res.status(400).json({ error: 'Session ID diperlukan. Kirim via header x-session-id' });
    return;
  }

  const { product_id, quantity = 1 } = req.body;
  if (!product_id) { res.status(400).json({ error: 'product_id wajib diisi' }); return; }
  if (quantity < 1) { res.status(400).json({ error: 'Quantity minimal 1' }); return; }

  await addToCart(product_id, quantity, owner.userId, owner.sessionId);
  const data = await getCart(owner.userId, owner.sessionId);
  const total = data.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ message: 'Produk ditambahkan ke keranjang', data, total });
});

router.put('/:id', async (req: Request, res: Response) => {
  const owner = getCartOwner(req);
  if (!owner.userId && !owner.sessionId) {
    res.status(400).json({ error: 'Session ID diperlukan' });
    return;
  }

  const id = parseInt(String(req.params.id));
  const { quantity } = req.body;
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  if (!quantity || quantity < 1) { res.status(400).json({ error: 'Quantity minimal 1' }); return; }

  const updated = await updateCartQty(id, quantity, owner.userId, owner.sessionId);
  if (!updated) { res.status(404).json({ error: 'Item keranjang tidak ditemukan' }); return; }

  const data = await getCart(owner.userId, owner.sessionId);
  const total = data.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ message: 'Jumlah diupdate', data, total });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const owner = getCartOwner(req);
  if (!owner.userId && !owner.sessionId) {
    res.status(400).json({ error: 'Session ID diperlukan' });
    return;
  }

  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const deleted = await removeFromCart(id, owner.userId, owner.sessionId);
  if (!deleted) { res.status(404).json({ error: 'Item keranjang tidak ditemukan' }); return; }

  const data = await getCart(owner.userId, owner.sessionId);
  const total = data.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ message: 'Produk dihapus dari keranjang', data, total });
});

// Merge requires login — parse token inline (same as getCartOwner)
router.post('/merge', async (req: Request, res: Response) => {
  const sid = (req.headers['x-session-id'] as string) || (req.query.session_id as string);
  let userId: number | undefined;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      userId = verifyToken(header.slice(7)).userId;
    } catch {
      // invalid token
    }
  }
  if (!sid || !userId) {
    res.status(400).json({ error: 'Session ID dan login diperlukan' });
    return;
  }

  // Move all session cart items to user
  const [sessionItems] = await dbPool.query(
    'SELECT product_id, quantity FROM cart_items WHERE session_id = ? ORDER BY id',
    [sid],
  );

  for (const item of (sessionItems as any[])) {
    await addToCart(item.product_id, item.quantity, userId);
  }

  await dbPool.query('DELETE FROM cart_items WHERE session_id = ?', [sid]);

  const data = await getCart(userId);
  const total = data.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ message: 'Keranjang berhasil digabung', data, total });
});

export default router;
