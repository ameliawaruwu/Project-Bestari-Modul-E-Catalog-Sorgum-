import { Router, Request, Response } from 'express';
import { setTracking, manualPoll, getTrackingHistory } from '../../services/tracking_service';
import { authRequired, adminOnly } from '../../middleware/auth';

const router = Router();
router.use(authRequired, adminOnly);

// GET /api/admin/tracking/:orderId — lihat status pengiriman + riwayat (admin boleh order siapa pun)
router.get('/:orderId', async (req: Request, res: Response) => {
  const orderId = parseInt(String(req.params.orderId));
  if (isNaN(orderId)) { res.status(400).json({ error: 'ID tidak valid' }); return; }
  try {
    const data = await getTrackingHistory(orderId);
    res.json({ data });
  } catch (e: any) {
    res.status(e.status || 500).json({ error: e.message || 'Gagal ambil tracking' });
  }
});

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
