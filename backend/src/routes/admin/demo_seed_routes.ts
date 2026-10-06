import { Router, Request, Response } from 'express';
import { clearDemoContent, seedDemoContent, getContentCounts, getDemoTrackingNumbers } from '../../services/admin/demo_seed_service';
import { authRequired, adminOnly } from '../../middleware/auth';
import { eventBus, EVENTS } from '../../lib/eventBus';
import { AppError } from '../../lib/errors_utils';

const router = Router();
router.use(authRequired, adminOnly);

// Kata konfirmasi wajib untuk aksi yang MENGHAPUS data. Bukan pengaman
// keamanan (route sudah adminOnly) — ini pengaman salah-klik: admin harus
// sadar betul bahwa data konten akan dikosongkan.
const CONFIRM_WORD = 'SEED';

// GET /api/admin/demo-seed — status data konten saat ini (jumlah baris).
// Dipakai panel admin untuk menampilkan "sebelum/sesudah" seed.
router.get('/', async (_req: Request, res: Response) => {
  const counts = await getContentCounts();
  // Daftar nomor resi demo yang sedang aktif — ditampilkan di panel supaya
  // operator tahu persis nomor apa yang harus diketik saat presentasi.
  const demoResi = await getDemoTrackingNumbers();
  res.json({ data: { counts, confirmWord: CONFIRM_WORD, demoResi } });
});

// POST /api/admin/demo-seed/clear — kosongkan ISI tabel konten (bukan tabelnya).
// Wajib kirim { confirm: "SEED" } supaya tidak jalan karena salah klik.
router.post('/clear', async (req: Request, res: Response) => {
  const confirm = String(req.body?.confirm || '').trim().toUpperCase();
  if (confirm !== CONFIRM_WORD) {
    throw new AppError(`Kata konfirmasi salah. Ketik "${CONFIRM_WORD}" untuk melanjutkan.`, 400);
  }

  const removed = await clearDemoContent();

  res.json({ message: 'Data konten berhasil dikosongkan', data: removed });
  // Publish setelah response terkirim — biar tabel lain di FE ikut refresh.
  eventBus.emit(EVENTS.PRODUCTS, { action: 'seed-clear' });
  eventBus.emit(EVENTS.ARTICLES, { action: 'seed-clear' });
  eventBus.emit(EVENTS.BANNERS, { action: 'seed-clear' });
  // featuredProductIds dikosongkan → beranda perlu disegarkan juga.
  eventBus.emit(EVENTS.LANDING, { action: 'seed-clear' });
});

// POST /api/admin/demo-seed/apply — isi data demo (idempotent, aman diklik ulang).
router.post('/apply', async (_req: Request, res: Response) => {
  const inserted = await seedDemoContent();

  res.json({ message: 'Data demo berhasil diisi', data: inserted });
  eventBus.emit(EVENTS.PRODUCTS, { action: 'seed-apply' });
  eventBus.emit(EVENTS.ARTICLES, { action: 'seed-apply' });
  eventBus.emit(EVENTS.BANNERS, { action: 'seed-apply' });
  // featuredProductIds (produk unggulan beranda) ikut diperbarui → landing berubah.
  eventBus.emit(EVENTS.LANDING, { action: 'seed-apply' });
});

export default router;
