import { Router, Request, Response } from 'express';
import { getAllOrders, getOrderById, updateOrderStatus, updatePaymentStatus } from '../../services/checkout_service';
import { authRequired, adminOnly } from '../../middleware/auth';

const router = Router();
router.use(authRequired, adminOnly);

router.get('/', async (_req: Request, res: Response) => {
  const orders = await getAllOrders();
  res.json({ data: orders });
});

router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const order = await getOrderById(id);
  if (!order) { res.status(404).json({ error: 'Pesanan tidak ditemukan' }); return; }
  res.json({ data: order });
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { status } = req.body;
  if (isNaN(id) || !status) { res.status(400).json({ error: 'ID dan status wajib diisi' }); return; }

  const updated = await updateOrderStatus(id, status);
  if (!updated) { res.status(404).json({ error: 'Pesanan tidak ditemukan' }); return; }
  if ((updated as any).unchanged) {
    const STATUS_LABEL: Record<string, string> = {
      pending: 'Pending', confirmed: 'Diproses', processed: 'Diproses',
      shipped: 'Dikirim', delivered: 'Selesai', cancelled: 'Dibatalkan',
    };
    const current = (updated as any).current as string;
    const label = STATUS_LABEL[current] || current;
    res.json({ message: `Pesanan sudah berstatus ${label} (status akhir, tidak dapat diubah).`, unchanged: true });
    return;
  }
  res.json({ message: 'Status pesanan diupdate' });
});

router.patch('/:id/payment', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { status } = req.body;
  if (isNaN(id) || !status) { res.status(400).json({ error: 'ID dan status wajib diisi' }); return; }

  const updated = await updatePaymentStatus(id, status);
  if (!updated) { res.status(404).json({ error: 'Pesanan tidak ditemukan' }); return; }
  res.json({ message: 'Status pembayaran diupdate' });
});

export default router;
