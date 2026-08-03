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

const app = express();

app.use(cors());
app.use(express.json());
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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Terjadi kesalahan pada server',
  });
});

app.listen(config.port, () => {
  console.log(`[Server] E-Catalog BESTARI running on port ${config.port}`);
  console.log(`[Server] Environment: ${config.nodeEnv}`);
});

export default app;
