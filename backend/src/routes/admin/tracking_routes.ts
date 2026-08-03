import { Router, Request, Response } from 'express';
import { setTracking, manualPoll } from '../../services/tracking_service';

const router = Router();

router.post('/:orderId/set', async (req: Request, res: Response) => {
  const orderId = parseInt(String(req.params.orderId));
  const { courier, tracking_number } = req.body;

  if (isNaN(orderId) || !courier || !tracking_number) {
    res.status(400).json({ error: 'orderId, courier, tracking_number wajib diisi' });
    return;
  }

  try {
    const result = await setTracking(orderId, courier, tracking_number);
    res.json({ message: 'Resi berhasil diset', data: result });
  } catch (e: any) {
    const status = e.status || 500;
    res.status(status).json({ error: e.message || 'Terjadi kesalahan' });
  }
});

router.post('/:orderId/poll', async (req: Request, res: Response) => {
  const orderId = parseInt(String(req.params.orderId));
  if (isNaN(orderId)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  try {
    const result = await manualPoll(orderId);
    res.json({ message: 'Polling berhasil', data: result });
  } catch (e: any) {
    const status = e.status || 500;
    res.status(status).json({ error: e.message || 'Terjadi kesalahan' });
  }
});

export default router;
