import { Router, Request, Response } from 'express';
import { getScmSeedStatus, applyScmSeed, clearScmSeed, syncScm } from '../../services/admin/scm_seed_service';
import { authRequired, adminOnly } from '../../middleware/auth';
import { eventBus, EVENTS } from '../../lib/eventBus';

const router = Router();
router.use(authRequired, adminOnly);

// GET /api/admin/scm-seed — status (key terpasang? berapa produk hasil fetch?)
router.get('/', async (_req: Request, res: Response) => {
  res.json({ data: await getScmSeedStatus() });
});

// POST /api/admin/scm-seed/apply — fetch produk dari SCM, ganti produk toko
router.post('/apply', async (_req: Request, res: Response) => {
  const data = await applyScmSeed();
  res.json({ message: 'Produk dari SCM berhasil diambil', data });
  eventBus.emit(EVENTS.PRODUCTS, { action: 'scm-seed-apply' });
  eventBus.emit(EVENTS.ARTICLES, { action: 'scm-seed-apply' });
  eventBus.emit(EVENTS.LANDING, { action: 'scm-seed-apply' });
});

// POST /api/admin/scm-seed/sync — tarik perubahan SCM ke produk toko (produk baru = draft)
router.post('/sync', async (_req: Request, res: Response) => {
  const data = await syncScm();
  if (!data.active) {
    res.json({ message: 'Mode SCM belum aktif — tekan "Fetch dari SCM" dulu.', data });
    return;
  }
  res.json({ message: 'Produk berhasil disinkronkan dengan SCM', data });
  if (data.updated + data.created + data.deactivated > 0) {
    eventBus.emit(EVENTS.PRODUCTS, { action: 'scm-sync' });
  }
});

// POST /api/admin/scm-seed/clear — hapus produk hasil fetch SCM
router.post('/clear', async (_req: Request, res: Response) => {
  const data = await clearScmSeed();
  res.json({ message: 'Data hasil fetch SCM berhasil dihapus', data });
  eventBus.emit(EVENTS.PRODUCTS, { action: 'scm-seed-clear' });
  eventBus.emit(EVENTS.ARTICLES, { action: 'scm-seed-clear' });
  eventBus.emit(EVENTS.LANDING, { action: 'scm-seed-clear' });
});

export default router;
