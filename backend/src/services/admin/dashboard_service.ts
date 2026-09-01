import dbPool from '../../lib/db';

export async function getDashboardMetrics() {
  const [productRows] = await dbPool.query('SELECT COUNT(*) AS total FROM products');
  const totalProducts = (productRows as any[])[0].total;

  const [activeProducts] = await dbPool.query('SELECT COUNT(*) AS total FROM products WHERE is_active = 1');
  const activeCount = (activeProducts as any[])[0].total;

  const [userRows] = await dbPool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'user'");
  const totalUsers = (userRows as any[])[0].total;

  const [articleRows] = await dbPool.query('SELECT COUNT(*) AS total FROM articles WHERE is_published = 1');
  const totalArticles = (articleRows as any[])[0].total;

  const [bannerRows] = await dbPool.query('SELECT COUNT(*) AS total FROM banners WHERE is_active = 1');
  const totalBanners = (bannerRows as any[])[0].total;

  return {
    total_revenue: 0,
    total_orders: 0,
    pending_orders: 0,
    total_products: totalProducts,
    active_products: activeCount,
    total_users: totalUsers,
    total_articles: totalArticles,
    total_banners: totalBanners,
    top_products: [],
    revenue_chart: [],
  };
}
