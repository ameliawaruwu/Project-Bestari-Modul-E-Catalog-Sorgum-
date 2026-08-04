import dbPool from '../lib/db';
import { AppError } from '../lib/errors_utils';

export interface ProductRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  weight_spec: string | null;
  origin: string | null;
  is_active: number;
  is_featured: number;
  category_id: number;
  category_name: string;
  primary_image: string | null;
  gluten_free: number;
  organic: number;
  badge: string | null;
  created_at: string;
}

export interface ProductDetail extends ProductRow {
  images: { id: number; image_url: string; alt_text: string | null; is_primary: number; sort_order: number }[];
}

interface ProductFilters {
  category?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page: number;
  limit: number;
  includeInactive?: boolean;
}

interface CreateProductInput {
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  weight_spec: string;
  origin: string;
  is_featured: boolean;
  gluten_free?: boolean;
  organic?: boolean;
  badge?: string | null;
}

const LIST_SELECT = `
  SELECT p.id, p.name, p.slug, p.price, p.stock, p.weight_spec, p.origin,
         p.is_active, p.is_featured, p.category_id, p.created_at,
         p.gluten_free, p.organic, p.badge,
         c.name AS category_name,
         (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) AS primary_image
  FROM products p
  JOIN categories c ON c.id = p.category_id
`;

export async function getProducts(filters: ProductFilters) {
  let where = filters.includeInactive ? 'WHERE 1=1' : 'WHERE p.is_active = 1';
  const params: any[] = [];

  if (filters.category) {
    where += ' AND p.category_id = ?';
    params.push(filters.category);
  }
  if (filters.search) {
    where += ' AND MATCH(p.name, p.description) AGAINST(? IN BOOLEAN MODE)';
    params.push(`+${filters.search}*`);
  }
  if (filters.minPrice !== undefined) {
    where += ' AND p.price >= ?';
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    where += ' AND p.price <= ?';
    params.push(filters.maxPrice);
  }

  let orderBy = 'ORDER BY p.created_at DESC';
  if (filters.sort === 'price_asc') orderBy = 'ORDER BY p.price ASC';
  else if (filters.sort === 'price_desc') orderBy = 'ORDER BY p.price DESC';
  else if (filters.sort === 'name_asc') orderBy = 'ORDER BY p.name ASC';
  else if (filters.sort === 'newest') orderBy = 'ORDER BY p.created_at DESC';

  const offset = (filters.page - 1) * filters.limit;

  const countSql = `SELECT COUNT(*) as total FROM products p ${where}`;
  const [countRows] = await dbPool.query(countSql, params);
  const total = (countRows as any[])[0].total;

  const dataSql = `${LIST_SELECT} ${where} ${orderBy} LIMIT ? OFFSET ?`;
  const [rows] = await dbPool.query(dataSql, [...params, filters.limit, offset]);

  return {
    data: rows as ProductRow[],
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const sql = `
    SELECT p.*, c.name AS category_name,
           (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) AS primary_image
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.slug = ? AND p.is_active = 1
  `;
  const [rows] = await dbPool.query(sql, [slug]);
  const product = (rows as ProductRow[])[0];
  if (!product) return null;

  const [images] = await dbPool.query(
    'SELECT id, image_url, alt_text, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
    [product.id],
  );

  return { ...product, images: images as any[] };
}

export async function getFeaturedProducts(limit = 8) {
  const sql = `${LIST_SELECT} WHERE p.is_active = 1 AND p.is_featured = 1 ORDER BY p.created_at DESC LIMIT ?`;
  const [rows] = await dbPool.query(sql, [limit]);
  return rows as ProductRow[];
}

// === ADMIN ===

export async function createProduct(input: CreateProductInput) {
  const { category_id, name, slug, description, price, stock, weight_spec, origin, is_featured } = input;
  const [result] = await dbPool.query(
    `INSERT INTO products (category_id, name, slug, description, price, stock, weight_spec, origin, is_featured, gluten_free, organic, badge)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [category_id, name, slug, description, price, stock, weight_spec, origin, is_featured ? 1 : 0,
     input.gluten_free ? 1 : 0, input.organic ? 1 : 0, input.badge ?? null],
  );
  return (result as any).insertId;
}

const ALLOWED_COLUMNS = ['category_id', 'name', 'slug', 'description', 'price', 'stock', 'weight_spec', 'origin', 'is_featured', 'gluten_free', 'organic', 'badge'];

export async function updateProduct(id: number, input: Partial<CreateProductInput>) {
  const fields: string[] = [];
  const params: any[] = [];

  for (const [key, val] of Object.entries(input)) {
    if (val !== undefined && ALLOWED_COLUMNS.includes(key)) {
      fields.push(`${key} = ?`);
      if (key === 'is_featured' || key === 'gluten_free' || key === 'organic') {
        params.push(val ? 1 : 0);
      } else {
        params.push(val);
      }
    }
  }

  if (fields.length === 0) throw new AppError('Tidak ada data yang diubah', 400);

  params.push(id);
  const [result] = await dbPool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);
  return (result as any).affectedRows > 0;
}

export async function toggleProductActive(id: number) {
  const [result] = await dbPool.query('UPDATE products SET is_active = NOT is_active WHERE id = ?', [id]);
  return (result as any).affectedRows > 0;
}

export async function deleteProduct(id: number) {
  const [result] = await dbPool.query('DELETE FROM products WHERE id = ?', [id]);
  return (result as any).affectedRows > 0;
}

// === IMAGES ===

export async function addProductImage(productId: number, imageUrl: string, altText?: string, isPrimary = false) {
  const [result] = await dbPool.query(
    'INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, ?, 0)',
    [productId, imageUrl, altText || null, isPrimary ? 1 : 0],
  );
  return (result as any).insertId;
}

export async function setPrimaryImage(productId: number, imageId: number) {
  await dbPool.query('UPDATE product_images SET is_primary = 0 WHERE product_id = ?', [productId]);
  await dbPool.query('UPDATE product_images SET is_primary = 1 WHERE id = ? AND product_id = ?', [imageId, productId]);
}

export async function deleteProductImage(imageId: number, productId: number) {
  const [result] = await dbPool.query('DELETE FROM product_images WHERE id = ? AND product_id = ?', [imageId, productId]);
  return (result as any).affectedRows > 0;
}
