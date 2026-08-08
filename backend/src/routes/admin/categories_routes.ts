import { Router, Request, Response } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categories_service';
import { authRequired, adminOnly } from '../../middleware/auth';

const router = Router();
router.use(authRequired, adminOnly);

router.get('/', async (_req: Request, res: Response) => {
  const data = await getCategories();
  res.json({ data });
});

router.post('/', async (req: Request, res: Response) => {
  const { name, slug } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'name dan slug wajib diisi' });
    return;
  }

  const id = await createCategory(name, slug);
  res.status(201).json({ message: 'Kategori berhasil dibuat', data: { id } });
});

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const { name, slug } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'name dan slug wajib diisi' });
    return;
  }

  const updated = await updateCategory(id, name, slug);
  if (!updated) { res.status(404).json({ error: 'Kategori tidak ditemukan' }); return; }
  res.json({ message: 'Kategori berhasil diupdate' });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  try {
    const deleted = await deleteCategory(id);
    if (!deleted) { res.status(404).json({ error: 'Kategori tidak ditemukan' }); return; }
    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (e: any) {
    // Pesan error jelas (mis. "masih ada produk") — bukan 500 mentah
    res.status(400).json({ error: e?.message || 'Gagal menghapus kategori' });
  }
});

export default router;
