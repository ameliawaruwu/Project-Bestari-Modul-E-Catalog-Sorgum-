import { Router, Request, Response } from 'express';
import { getAllArticles, createArticle, updateArticle, deleteArticle, getFaqs, createFaq, updateFaq, deleteFaq } from '../../services/articles_service';
import { authRequired, adminOnly } from '../../middleware/auth';

const router = Router();
router.use(authRequired, adminOnly);

// Articles
router.get('/', async (_req: Request, res: Response) => {
  const data = await getAllArticles();
  res.json({ data });
});

router.post('/', async (req: Request, res: Response) => {
  const { title, slug, category, content } = req.body;
  if (!title || !slug || !category || !content) {
    res.status(400).json({ error: 'title, slug, category, content wajib' });
    return;
  }
  const id = await createArticle(req.body);
  res.status(201).json({ message: 'Artikel dibuat', data: { id } });
});

router.put('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  const updated = await updateArticle(id, req.body);
  if (!updated) { res.status(404).json({ error: 'Artikel tidak ditemukan' }); return; }
  res.json({ message: 'Artikel diupdate' });
});

router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  const deleted = await deleteArticle(id);
  if (!deleted) { res.status(404).json({ error: 'Artikel tidak ditemukan' }); return; }
  res.json({ message: 'Artikel dihapus' });
});

// FAQ
router.get('/faq', async (_req: Request, res: Response) => {
  const data = await getFaqs(true); // admin: include DRAFT
  res.json({ data });
});

router.post('/faq', async (req: Request, res: Response) => {
  const { question, answer } = req.body;
  if (!question || !answer) { res.status(400).json({ error: 'question dan answer wajib' }); return; }
  const id = await createFaq(req.body);
  res.status(201).json({ message: 'FAQ dibuat', data: { id } });
});

router.put('/faq/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  const updated = await updateFaq(id, req.body);
  if (!updated) { res.status(404).json({ error: 'FAQ tidak ditemukan' }); return; }
  res.json({ message: 'FAQ diupdate' });
});

router.delete('/faq/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  const deleted = await deleteFaq(id);
  if (!deleted) { res.status(404).json({ error: 'FAQ tidak ditemukan' }); return; }
  res.json({ message: 'FAQ dihapus' });
});

export default router;
