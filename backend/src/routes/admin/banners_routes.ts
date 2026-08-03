import { Router, Request, Response } from 'express';
import { getAllBanners, createBanner, updateBanner, deleteBanner } from '../../services/banners_service';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const data = await getAllBanners();
  res.json({ data });
});

router.post('/', async (req: Request, res: Response) => {
  const { title, image_url, target_type, target_link } = req.body;
  if (!title || !image_url) { res.status(400).json({ error: 'title dan image_url wajib diisi' }); return; }
  const id = await createBanner(title, image_url, target_type || 'store', target_link);
  res.status(201).json({ message: 'Banner berhasil dibuat', data: { id } });
});

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  const updated = await updateBanner(id, req.body);
  if (!updated) { res.status(404).json({ error: 'Banner tidak ditemukan' }); return; }
  res.json({ message: 'Banner diupdate' });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  const deleted = await deleteBanner(id);
  if (!deleted) { res.status(404).json({ error: 'Banner tidak ditemukan' }); return; }
  res.json({ message: 'Banner dihapus' });
});

export default router;
