import { Router, Request, Response } from 'express';
import { getAllOrders, getOrderById, updateOrderStatus, updatePaymentStatus, softDeleteOrder, restoreOrder } from '../../services/checkout_service';
import { authRequired, adminOnly } from '../../middleware/auth';
import { eventBus, EVENTS } from '../../lib/eventBus';

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
  eventBus.emit(EVENTS.ORDERS, { action: 'status', id });
});

router.patch('/:id/payment', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { status } = req.body;
  if (isNaN(id) || !status) { res.status(400).json({ error: 'ID dan status wajib diisi' }); return; }

  const updated = await updatePaymentStatus(id, status);
  if (!updated) { res.status(404).json({ error: 'Pesanan tidak ditemukan' }); return; }
  res.json({ message: 'Status pembayaran diupdate' });
  eventBus.emit(EVENTS.ORDERS, { action: 'payment', id });
});

// Soft-delete order (admin): hilang dari panel admin, data TETAP di DB (arsip).
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const deleted = await softDeleteOrder(id);
  if (!deleted) { res.status(404).json({ error: 'Pesanan tidak ditemukan atau sudah dihapus' }); return; }
  res.json({ message: 'Pesanan dihapus dari tampilan admin (data tetap di database).' });
  eventBus.emit(EVENTS.ORDERS, { action: 'delete', id });
});

// Restore order yang di-soft-delete (kalau admin salah hapus).
router.post('/:id/restore', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const restored = await restoreOrder(id);
  if (!restored) { res.status(404).json({ error: 'Pesanan tidak ditemukan' }); return; }
  res.json({ message: 'Pesanan dikembalikan ke daftar transaksi.' });
  eventBus.emit(EVENTS.ORDERS, { action: 'restore', id });
});

export default router;
