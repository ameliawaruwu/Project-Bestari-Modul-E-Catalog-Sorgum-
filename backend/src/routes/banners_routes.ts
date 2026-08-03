import { Router, Request, Response } from 'express';
import { getActiveBanners } from '../services/banners_service';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const data = await getActiveBanners();
  res.json({ data });
});

export default router;
