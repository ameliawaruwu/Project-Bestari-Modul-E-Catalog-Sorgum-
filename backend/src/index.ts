import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './lib/config';
import { verifyToken } from './lib/jwt_utils';

// Public routes
import authRoutes from './routes/auth_routes';
import productRoutes from './routes/products_routes';
import categoryRoutes from './routes/categories_routes';
import bannerRoutes from './routes/banners_routes';
import articleRoutes from './routes/articles_routes';
import settingsRoutes from './routes/settings_routes';
import landingContentRoutes from './routes/landing_content_routes';
import trackingProxyRoutes from './routes/tracking_proxy_routes';

// Admin routes
import adminSettingsRoutes from './routes/admin/settings_routes';
import adminProductsRoutes from './routes/admin/products_routes';
import adminBannersRoutes from './routes/admin/banners_routes';
import adminArticlesRoutes from './routes/admin/articles_routes';
import adminUploadRoutes from './routes/admin/upload_routes';
import eventsRoutes from './routes/events_routes';

const app = express();

// Trust proxy: app jalan di belakang nginx (minibox) / Cloudflare, yang meng-set header
// X-Forwarded-For. Tanpa ini express-rate-limit (authLimiter) melempar
// ValidationError ERR_ERL_UNEXPECTED_X_FORWARDED_FOR pada tiap request → request auth
// gagal random ("server tidak dapat terhubung" di panel admin). '1' = percaya hop proxy pertama.
app.set('trust proxy', 1);

// ─── Request logger (KISS, tanpa dependency) ─────────────────────────────
// Mencatat tiap HTTP request: method, path, status, durasi (ms), userId
// (kalau token valid), source IP. Satu baris per request biar gampang di-grep
// dari pm2 logs / file log. Skip request statis (uploads) biar tidak spam.
const logRequest = (req: express.Request, res: express.Response) => {
  if (req.path.startsWith('/uploads/')) return;
  const t0 = (req as any)._startAt as number | undefined;
  const dur = t0 ? `${Date.now() - t0}ms` : '-';
  let uid = '-';
  try {
    const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (auth) {
      const payload = verifyToken(auth);
      if (payload?.userId) uid = String(payload.userId);
    }
  } catch { /* token invalid — biarkan '-' */ }
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.ip || '-';
  console.log(`[REQ] ${req.method} ${req.originalUrl} → ${res.statusCode} (${dur}) user=${uid} ip=${ip}`);
};

app.use((req, res, next) => {
  (req as any)._startAt = Date.now();
  res.on('finish', () => logRequest(req, res));
  next();
});

app.use(cors({ origin: config.corsOrigins }));
// Limit besar: admin bisa upload logo/QRIS via API upload (file), tapi settings
// JSON juga bisa bawa data URL base64 — naikkan ke 10mb supaya PUT /admin/settings
// tidak gagal 413 untuk base64 gambar QRIS/logo (sebelumnya 100kb default → QRIS
// >100kb gagal tersimpan diam-diam, fix 2026-08-07).
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

// API tidak boleh di-cache heuristic oleh browser — data berubah realtime
// (SSE) & dikontrol admin. Tanpa ini, sebagian browser meng-cache respons GET
// (ETag/Last-Modified) → user bisa lihat data lama sampai revalidate. no-store
// memaksa tiap load ambil data terbaru dari server.
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

if (!config.jwt.secret) {
  console.error('[FATAL] ECATALOG_BESTARI_JWT_SECRET wajib diisi di .env');
  process.exit(1);
}

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/landing-content', landingContentRoutes);
app.use('/api/tracking', trackingProxyRoutes);

app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/products', adminProductsRoutes);
app.use('/api/admin/banners', adminBannersRoutes);
app.use('/api/admin/articles', adminArticlesRoutes);
app.use('/api/admin/upload', adminUploadRoutes);

// SSE realtime — harus sebelum 404 catch-all
app.use('/api/events', eventsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[Error] ${req.method} ${req.originalUrl}`, err);
  const isProd = config.nodeEnv === 'production';
  // Di prod, jangan bocor pesan error mentah (SQL/stack). Di dev, tampilkan.
  const message = isProd ? 'Terjadi kesalahan pada server' : (err.message || 'Terjadi kesalahan pada server');
  res.status(err.status || 500).json({ error: message });
});

app.listen(config.port, () => {
  console.log(`[Server] E-Catalog BESTARI running on port ${config.port}`);
  console.log(`[Server] Environment: ${config.nodeEnv}`);
});

export default app;
