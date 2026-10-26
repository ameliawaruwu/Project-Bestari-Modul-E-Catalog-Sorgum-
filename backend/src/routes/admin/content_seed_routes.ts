import { Router, Request, Response } from 'express';
import {
  getContentSeedStatus,
  applyArticleSeed,
  clearArticleSeed,
  applyTrackingSeed,
  clearTrackingSeed,
} from '../../services/admin/content_seed_service';
import { authRequired, adminOnly } from '../../middleware/auth';
import { eventBus, EVENTS } from '../../lib/eventBus';

const router = Router();
router.use(authRequired, adminOnly);

// GET /api/admin/content-seed — jumlah artikel & status kartu lacak contoh
router.get('/', async (_req: Request, res: Response) => {
  res.json({ data: await getContentSeedStatus() });
});

// POST /api/admin/content-seed/articles/apply — isi artikel dari data katalog
router.post('/articles/apply', async (_req: Request, res: Response) => {
  const data = await applyArticleSeed();
  res.json({ message: 'Artikel berhasil diisi', data });
  eventBus.emit(EVENTS.ARTICLES, { action: 'content-seed-apply' });
});

// POST /api/admin/content-seed/articles/clear — hapus artikel hasil seeder
router.post('/articles/clear', async (_req: Request, res: Response) => {
  const data = await clearArticleSeed();
  res.json({ message: 'Artikel hasil seeder berhasil dihapus', data });
  eventBus.emit(EVENTS.ARTICLES, { action: 'content-seed-clear' });
});

// POST /api/admin/content-seed/tracking/apply — isi kartu Lacak Paket contoh
router.post('/tracking/apply', async (_req: Request, res: Response) => {
  const data = await applyTrackingSeed();
  res.json({ message: 'Data lacak pesanan berhasil diisi', data });
  eventBus.emit(EVENTS.LANDING, { action: 'content-seed-apply' });
});

// POST /api/admin/content-seed/tracking/clear — kosongkan kartu Lacak Paket contoh
router.post('/tracking/clear', async (_req: Request, res: Response) => {
  await clearTrackingSeed();
  res.json({ message: 'Data lacak pesanan berhasil dihapus' });
  eventBus.emit(EVENTS.LANDING, { action: 'content-seed-clear' });
});

export default router;
