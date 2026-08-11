import { Router, Request, Response } from 'express';
import { createOrder, getOrders, getOrderById, cancelOrderByUser } from '../services/checkout_service';
import { authRequired, authOptional } from '../middleware/auth';
import { eventBus, EVENTS } from '../lib/eventBus';

const router = Router();

// === PUBLIC (guest + user login via optional token) ===
router.post('/', authOptional, async (req: Request, res: Response) => {
  const { customer_name, customer_phone, shipping_address, notes, payment_method, voucher_code, idempotency_key } = req.body;

  if (!['cod', 'qris'].includes(payment_method)) {
    res.status(400).json({ error: 'Metode pembayaran: cod atau qris' });
    return;
  }

  // Validasi required field (DB NOT NULL) — cegah 500 & data sampah
  if (!customer_name || !customer_phone) {
    res.status(400).json({ error: 'customer_name dan customer_phone wajib diisi' });
    return;
  }
  if (!shipping_address || typeof shipping_address !== 'object' || Array.isArray(shipping_address)) {
    res.status(400).json({ error: 'shipping_address wajib berupa objek' });
    return;
  }
  const addrRequired = ['recipient_name', 'phone', 'address_line', 'city', 'province', 'postal_code'];
  for (const f of addrRequired) {
    if (!shipping_address[f]) {
      res.status(400).json({ error: `shipping_address.${f} wajib diisi` });
      return;
    }
  }

  try {
    const result = await createOrder({
      userId: req.user?.userId,
      sessionId: (req.headers['x-session-id'] as string) || (req.query.session_id as string),
      customer_name,
      customer_email: req.body.customer_email,
      customer_phone,
      shipping_address,
      notes,
      voucher_code,
      idempotency_key,
      payment_method,
    });
    res.status(201).json({
      message: 'Pesanan berhasil dibuat',
      data: result.order,
      wa_link: result.wa_link,
    });
    eventBus.emit(EVENTS.ORDERS, { action: 'create', id: result.order?.id });
  } catch (e: any) {
    const status = e.status || 500;
    res.status(status).json({ error: e.message || 'Terjadi kesalahan' });
  }
});

// === AUTH REQUIRED ===
router.use(authRequired);

router.get('/mine', async (req: Request, res: Response) => {
  // Teruskan email (dari JWT) supaya order guest dengan email yang sama ikut tampil
  const orders = await getOrders(req.user!.userId, req.user!.email);
  res.json({ data: orders });
});

// User batalkan order sendiri (hanya yang belum dikirim/dibatalkan)
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  try {
    await cancelOrderByUser(id, req.user!.userId);
    res.json({ message: 'Pesanan berhasil dibatalkan' });
    eventBus.emit(EVENTS.ORDERS, { action: 'cancel', id });
  } catch (e: any) {
    res.status(e.status || 500).json({ error: e.message || 'Gagal membatalkan pesanan' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: 'ID tidak valid' }); return; }

  const order = await getOrderById(id, req.user!.userId);
  if (!order) { res.status(404).json({ error: 'Pesanan tidak ditemukan' }); return; }
  res.json({ data: order });
});

export default router;
