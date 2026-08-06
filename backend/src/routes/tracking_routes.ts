import { Router, Request, Response } from 'express';
import { getTrackingHistory } from '../services/tracking_service';
import { authOptional } from '../middleware/auth';
import dbPool from '../lib/db';

const router = Router();

// Public-ish: FE user panggil tanpa auth, tapi kalau ada token, cek owner.
// Guest (no token) tetap boleh lihat order GUEST (user_id NULL) — biar fitur tracking
// order guest jalan. TAPI order milik user login (user_id terisi) WAJIB pemiliknya —
// guest tanpa token TIDAK boleh enumerasi order orang lain (cegah IDOR/PII leak).
router.get('/:orderId', authOptional, async (req: Request, res: Response) => {
  const orderId = parseInt(String(req.params.orderId));
  if (isNaN(orderId)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const [rows] = await dbPool.query('SELECT user_id FROM orders WHERE id = ?', [orderId]);
  const order = (rows as any[])[0];
  if (!order) { res.status(404).json({ error: 'Pesanan tidak ditemukan' }); return; }

  if (order.user_id !== null) {
    // Order milik user terdaftar → caller WAJIB login sebagai pemiliknya
    if (!req.user?.userId) {
      res.status(403).json({ error: 'Forbidden: perlu login untuk melihat pesanan ini' });
      return;
    }
    if (order.user_id !== req.user.userId) {
      res.status(403).json({ error: 'Forbidden: bukan pesanan Anda' });
      return;
    }
  }

  const data = await getTrackingHistory(orderId);
  res.json({ data });
});

export default router;
