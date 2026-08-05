import { Router, Request, Response } from 'express';
import { getCategories } from '../services/categories_service';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const data = await getCategories();
  res.json({ data });
});

export default router;
