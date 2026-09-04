import { Router, Request, Response } from 'express';
import {
  getProducts,
  getProductBySlug,
  getProductByIdPublic,
} from '../services/products_service';

const router = Router();

// === PUBLIC ===

router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));

  const result = await getProducts({
    category: req.query.category ? parseInt(req.query.category as string) : undefined,
    search: req.query.search as string | undefined,
    minPrice: req.query.min_price ? parseInt(req.query.min_price as string) : undefined,
    maxPrice: req.query.max_price ? parseInt(req.query.max_price as string) : undefined,
    sort: req.query.sort as string | undefined,
    page,
    limit,
  });

  res.json(result);
});

router.get('/:slug', async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const isNumeric = /^\d+$/.test(slug);
  const product = isNumeric
    ? await getProductByIdPublic(parseInt(slug))
    : await getProductBySlug(slug);
  if (!product) {
    res.status(404).json({ error: 'Produk tidak ditemukan' });
    return;
  }
  res.json({ data: product });
});

export default router;

