import { Router } from 'express';
import { authRequired, adminOnly } from '../middleware/auth';
import { voucherService } from '../services/voucher_service';

const router = Router();

// Public — daftar voucher aktif (untuk ditampilkan di halaman user/cart)
router.get('/vouchers', async (_req, res) => {
  try {
    const vouchers = await voucherService.listActive();
    res.json({ data: vouchers });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Gagal mengambil daftar voucher' });
  }
});

router.get('/admin/vouchers', authRequired, adminOnly, async (_req, res) => {
  try {
    const vouchers = await voucherService.list();
    res.json({ data: vouchers });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Gagal mengambil data voucher' });
  }
});

router.post('/admin/vouchers', authRequired, adminOnly, async (req, res) => {
  try {
    await voucherService.create(req.body);
    res.json({ message: 'Voucher berhasil dibuat' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Gagal membuat voucher' });
  }
});

router.put('/admin/vouchers/:id', authRequired, adminOnly, async (req, res) => {
  try {
    await voucherService.update(Number(req.params.id), req.body);
    res.json({ message: 'Voucher berhasil diperbarui' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Gagal memperbarui voucher' });
  }
});

router.delete('/admin/vouchers/:id', authRequired, adminOnly, async (req, res) => {
  try {
    await voucherService.remove(Number(req.params.id));
    res.json({ message: 'Voucher berhasil dihapus' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Gagal menghapus voucher' });
  }
});

// Public endpoint — validasi kode voucher (tidak butuh auth)
router.post('/vouchers/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || subtotal === undefined) {
      res.status(400).json({ valid: false, message: 'Kode dan subtotal wajib diisi' });
      return;
    }
    const result = await voucherService.validate(code, subtotal);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ valid: false, message: e.message || 'Gagal validasi voucher' });
  }
});

export default router;
