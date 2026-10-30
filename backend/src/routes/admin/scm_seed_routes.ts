import { Router, Request, Response } from 'express';
import { getScmSeedStatus } from '../../services/admin/scm_seed_service';
import { authRequired, adminOnly } from '../../middleware/auth';

const router = Router();
router.use(authRequired, adminOnly);

// GET /api/admin/scm-seed — status (key terpasang? berapa produk hasil fetch?)
router.get('/', async (_req: Request, res: Response) => {
  res.json({ data: await getScmSeedStatus() });
});

// Ambil data dari SCM dinonaktifkan: produk toko dikelola manual lewat admin.
// apply (fetch) & clear (hapus hasil fetch) ditolak supaya data toko tidak tertimpa/terhapus.
router.post(['/apply', '/clear'], (_req: Request, res: Response) => {
  res.status(410).json({ error: 'Sinkron SCM dinonaktifkan. Kelola produk lewat Kelola Produk.' });
});

export default router;
