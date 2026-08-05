import { Router, Request, Response } from 'express';
import { getBadges, createBadge, updateBadge, deleteBadge } from '../../services/badges_service';
import { authRequired, adminOnly } from '../../middleware/auth';

const router = Router();
router.use(authRequired, adminOnly);

// GET /api/admin/badges
router.get('/', async (_req: Request, res: Response) => {
  const data = await getBadges(true);
  res.json({ data });
});

// POST /api/admin/badges
router.post('/', async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'Nama badge wajib diisi' });
    return;
  }
  try {
    const id = await createBadge(name.trim());
    res.status(201).json({ message: 'Badge berhasil dibuat', data: { id } });
  } catch (e: any) {
    // Duplicate name (UNIQUE)
    if (e?.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Nama badge sudah ada' });
      return;
    }
    throw e;
  }
});

// PUT /api/admin/badges/:id
router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  const { name, is_active } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'Nama badge wajib diisi' });
    return;
  }
  try {
    const updated = await updateBadge(id, name.trim(), !!is_active);
    if (!updated) { res.status(404).json({ error: 'Badge tidak ditemukan' }); return; }
    res.json({ message: 'Badge berhasil diupdate' });
  } catch (e: any) {
    if (e?.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Nama badge sudah ada' });
      return;
    }
    throw e;
  }
});

// DELETE /api/admin/badges/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  const deleted = await deleteBadge(id);
  if (!deleted) { res.status(404).json({ error: 'Badge tidak ditemukan' }); return; }
  res.json({ message: 'Badge berhasil dihapus' });
});

export default router;
