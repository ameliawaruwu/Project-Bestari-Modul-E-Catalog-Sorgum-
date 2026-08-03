import { Router, Request, Response } from 'express';
import { getSettings } from '../services/admin/settings_service';

const router = Router();

// Public store settings — dipakai Header, QrisPaymentPage, tombol WA
// Hanya return key yang aman untuk publik (tidak ada rahasia di sini)
router.get('/', async (_req: Request, res: Response) => {
  const data = await getSettings();
  res.json({ data });
});

export default router;
