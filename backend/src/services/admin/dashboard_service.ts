import dbPool from '../../lib/db';

export async function getDashboardMetrics() {
  // Revenue
  const [revenueRows] = await dbPool.query(
    `SELECT COALESCE(SUM(total), 0) AS total_revenue FROM orders WHERE payment_status = 'paid'`,
  );
  const totalRevenue = (revenueRows as any[])[0].total_revenue;

  // Orders
  const [orderRows] = await dbPool.query('SELECT COUNT(*) AS total FROM orders');
  const totalOrders = (orderRows as any[])[0].total;

  const [pendingRows] = await dbPool.query(
    `SELECT COUNT(*) AS total FROM orders WHERE order_status NOT IN ('delivered','cancelled')`,
  );
  const pendingOrders = (pendingRows as any[])[0].total;

  // Products
  const [productRows] = await dbPool.query('SELECT COUNT(*) AS total FROM products');
  const totalProducts = (productRows as any[])[0].total;

  // Users
  const [userRows] = await dbPool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'user'");
  const totalUsers = (userRows as any[])[0].total;

  // Top products
  const [topProducts] = await dbPool.query(
    `SELECT p.name, p.slug, SUM(oi.quantity) AS total_sold
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     GROUP BY oi.product_id
     ORDER BY total_sold DESC
     LIMIT 5`,
  );

  // Revenue chart (last 30 days)
  const [revenueChart] = await dbPool.query(
    `SELECT DATE(created_at) AS date, SUM(total) AS amount
     FROM orders
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY DATE(created_at)
     ORDER BY date ASC`,
  );

  return {
    total_revenue: totalRevenue,
    total_orders: totalOrders,
    pending_orders: pendingOrders,
    total_products: totalProducts,
    total_users: totalUsers,
    top_products: topProducts,
    revenue_chart: revenueChart,
  };
}
