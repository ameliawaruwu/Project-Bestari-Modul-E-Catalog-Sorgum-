import { Router, Request, Response } from 'express';
import {
  getCategoriesWithCount,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/categories_service';
import { authRequired, adminOnly } from '../../middleware/auth';

const router = Router();
router.use(authRequired, adminOnly);

// Daftar kategori + jumlah produk per kategori (untuk panel Kelola Kategori).
router.get('/', async (_req: Request, res: Response) => {
  const data = await getCategoriesWithCount();
  res.json({ data });
});

router.post('/', async (req: Request, res: Response) => {
  const { name, slug, sort_order, image_url } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'name dan slug wajib diisi' });
    return;
  }
  if (String(name).trim().length < 2) {
    res.status(400).json({ error: 'Nama kategori minimal 2 karakter' });
    return;
  }
  try {
    const id = await createCategory(
      String(name).trim(),
      String(slug),
      sort_order !== undefined ? Number(sort_order) : 0,
      image_url || null,
    );
    res.status(201).json({ message: 'Kategori berhasil dibuat', data: { id } });
  } catch (e: any) {
    if (e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062) {
      res.status(409).json({ error: 'Nama/slug kategori sudah ada' });
      return;
    }
    throw e;
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const fields: { name?: string; slug?: string; sort_order?: number; image_url?: string | null } = {};
  if (req.body.name !== undefined) fields.name = String(req.body.name).trim();
  if (req.body.slug !== undefined) fields.slug = String(req.body.slug);
  if (req.body.sort_order !== undefined) fields.sort_order = Number(req.body.sort_order);
  if (req.body.image_url !== undefined) fields.image_url = req.body.image_url || null;

  try {
    const updated = await updateCategory(id, fields);
    if (!updated) { res.status(404).json({ error: 'Kategori tidak ditemukan' }); return; }
    res.json({ message: 'Kategori berhasil diupdate' });
  } catch (e: any) {
    if (e?.code === 'ER_DUP_ENTRY' || e?.errno === 1062) {
      res.status(409).json({ error: 'Nama/slug kategori sudah ada' });
      return;
    }
    throw e;
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  try {
    const deleted = await deleteCategory(id);
    if (!deleted) { res.status(404).json({ error: 'Kategori tidak ditemukan' }); return; }
    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (e: any) {
    // FK ON DELETE RESTRICT: kategori masih dipakai produk.
    if (e?.code === 'ER_ROW_IS_REFERENCED_2' || e?.errno === 1451) {
      res.status(409).json({ error: 'Kategori masih dipakai produk. Pindahkan produk ke kategori lain dulu sebelum menghapus.' });
      return;
    }
    throw e;
  }
});

export default router;
