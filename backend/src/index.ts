import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './lib/config';

// Public / user routes
import authRoutes from './routes/auth_routes';
import productRoutes from './routes/products_routes';
import categoryRoutes from './routes/categories_routes';
import cartRoutes from './routes/cart_routes';
import checkoutRoutes from './routes/checkout_routes';
import trackingRoutes from './routes/tracking_routes';
import bannerRoutes from './routes/banners_routes';
import articleRoutes from './routes/articles_routes';
import settingsRoutes from './routes/settings_routes';
import landingContentRoutes from './routes/landing_content_routes';
import userRoutes from './routes/user/profile_routes';
import addressRoutes from './routes/user/addresses_routes';
import wishlistRoutes from './routes/user/wishlist_routes';

// Admin routes
import adminDashboardRoutes from './routes/admin/dashboard_routes';
import adminSettingsRoutes from './routes/admin/settings_routes';
import adminProductsRoutes from './routes/admin/products_routes';
import adminCategoriesRoutes from './routes/admin/categories_routes';
import adminBannersRoutes from './routes/admin/banners_routes';
import adminArticlesRoutes from './routes/admin/articles_routes';
import adminOrdersRoutes from './routes/admin/orders_routes';
import adminTrackingRoutes from './routes/admin/tracking_routes';
import adminUploadRoutes from './routes/admin/upload_routes';
import adminBadgesRoutes from './routes/admin/badges_routes';
import voucherRoutes from './routes/voucher_routes';
import eventsRoutes from './routes/events_routes';

const app = express();

// Trust proxy: app jalan di belakang nginx (minibox) / Cloudflare, yang meng-set header
// X-Forwarded-For. Tanpa ini express-rate-limit (authLimiter) melempar
// ValidationError ERR_ERL_UNEXPECTED_X_FORWARDED_FOR pada tiap request → request auth
// gagal random ("server tidak dapat terhubung" di panel admin). '1' = percaya hop proxy pertama.
app.set('trust proxy', 1);

app.use(cors({ origin: config.corsOrigins }));
// Limit besar: admin bisa upload logo/QRIS via API upload (file), tapi settings
// JSON juga bisa bawa data URL base64 — naikkan ke 10mb supaya PUT /admin/settings
// tidak gagal 413 untuk base64 gambar QRIS/logo (sebelumnya 100kb default → QRIS
// >100kb gagal tersimpan diam-diam, fix 2026-08-07).
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.resolve(config.upload.dir)));

if (!config.jwt.secret) {
  console.error('[FATAL] ECATALOG_BESTARI_JWT_SECRET wajib diisi di .env');
  process.exit(1);
}

// Public / user
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', checkoutRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/landing-content', landingContentRoutes);
app.use('/api/user', userRoutes);
app.use('/api/user', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Admin
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/products', adminProductsRoutes);
app.use('/api/admin/categories', adminCategoriesRoutes);
app.use('/api/admin/banners', adminBannersRoutes);
app.use('/api/admin/articles', adminArticlesRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/admin/tracking', adminTrackingRoutes);
app.use('/api/admin/upload', adminUploadRoutes);
app.use('/api/admin/badges', adminBadgesRoutes);
app.use('/api', voucherRoutes);

// SSE realtime — harus sebelum 404 catch-all
app.use('/api/events', eventsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
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
