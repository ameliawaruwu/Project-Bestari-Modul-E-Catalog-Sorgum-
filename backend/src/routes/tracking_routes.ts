import { Router, Request, Response } from 'express';
import { getTrackingHistory } from '../services/tracking_service';

const router = Router();

router.get('/:orderId', async (req: Request, res: Response) => {
  const orderId = parseInt(String(req.params.orderId));
  if (isNaN(orderId)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const data = await getTrackingHistory(orderId);
  res.json({ data });
});

export default router;
