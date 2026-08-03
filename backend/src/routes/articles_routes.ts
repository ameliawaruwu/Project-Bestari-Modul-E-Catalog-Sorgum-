import { Router, Request, Response } from 'express';
import { getPublishedArticles, getArticleBySlug, getFaqs } from '../services/articles_service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const result = await getPublishedArticles(
    req.query.category as string | undefined,
    parseInt(String(req.query.limit || '12')),
    parseInt(String(req.query.offset || '0')),
  );
  res.json(result);
});

router.get('/faq/all', async (_req: Request, res: Response) => {
  const data = await getFaqs();
  res.json({ data });
});

router.get('/:slug', async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const article = await getArticleBySlug(slug);
  if (!article) { res.status(404).json({ error: 'Artikel tidak ditemukan' }); return; }
  res.json({ data: article });
});

export default router;
