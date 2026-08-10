import dbPool from '../lib/db';
import { AppError } from '../lib/errors_utils';

export interface ProductRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  discount_percent: number;
  stock: number;
  weight_spec: string | null;
  origin: string | null;
  shipping_info: string | null;
  composition: string | null;
  shelf_life: string | null;
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
  shipping_info?: string | null;
  is_featured: boolean;
  gluten_free?: boolean;
  organic?: boolean;
  badge?: string | null;
  original_price?: number | null;
  discount_percent?: number;
  composition?: string | null;
  shelf_life?: string | null;
  attributes?: string | null;
}

const LIST_SELECT = `
  SELECT p.id, p.name, p.slug, p.description, p.price, p.original_price, p.discount_percent,
         p.stock, p.weight_spec, p.origin, p.shipping_info, p.composition, p.shelf_life, p.attributes,
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
    // Cari di NAMA produk saja (bukan description) — user mengharapkan hasil
    // sesuai nama. Sebelumnya pakai FULLTEXT MATCH(name, description) yg juga
    // match kata di deskripsi (mis. "nasi" match "nasional") → hasil tidak sesuai.
    where += ' AND p.name LIKE ?';
    params.push(`%${filters.search.trim()}%`);
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

/**
 * Validasi badge: badge produk WAJIB ada di tabel badges (dikelola via Kelola Badge).
 * Kalau badge tidak dikenal → return null (badge yatim dicegah sejak input).
 * Ini mencegah badge "yatim" (string bebas yang tidak bisa dikelola) muncul lagi.
 */
async function normalizeBadge(badge: string | null | undefined): Promise<string | null> {
  if (!badge || typeof badge !== 'string' || badge.trim() === '') return null;
  const trimmed = badge.trim();
  const [rows] = await dbPool.query('SELECT id FROM badges WHERE name = ? LIMIT 1', [trimmed]);
  if ((rows as any[]).length === 0) return null;
  return trimmed;
}

export async function createProduct(input: CreateProductInput) {
  const { category_id, name, slug, description, stock, weight_spec, origin, is_featured } = input;
  // Harga: FE (admin) adalah single source of truth. FE mengirim TIGA nilai konsisten:
  //   original_price (harga dasar/asli), price (harga jual final = original × (1 - diskon/100)),
  //   discount_percent (0-90).
  // JANGAN hitung ulang di sini (applyDiscount) — kalau FE mengirim price yang SUDAH
  // didiskon (mis. 38.400 dari 48.000 - 20%), applyDiscount akan menghitung diskon dari
  // 38.400 → harga melenceng. Simpan persis apa yang FE kirim.
  const originalPrice = input.original_price != null ? Number(input.original_price) : Number(input.price) || 0;
  const discountPercent = Math.max(0, Math.min(90, Number(input.discount_percent) || 0));
  // Kalau FE TIDAK mengirim original_price/discount_percent (payload lama), kompatibilitas:
  // price dianggap harga jual final & original = price (tanpa diskon) — jangan hitung ulang.
  const price = Number(input.price) || originalPrice;
  const badge = await normalizeBadge(input.badge ?? null);
  const [result] = await dbPool.query(
    `INSERT INTO products (category_id, name, slug, description, price, original_price, discount_percent, stock, weight_spec, origin, shipping_info, is_featured, gluten_free, organic, badge, composition, shelf_life, attributes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [category_id, name, slug, description, price, originalPrice, discountPercent, stock, weight_spec, origin, input.shipping_info ?? null, is_featured ? 1 : 0,
     input.gluten_free ? 1 : 0, input.organic ? 1 : 0, badge, input.composition ?? null, input.shelf_life ?? null,
     input.attributes ?? null],
  );
  return (result as any).insertId;
}

const ALLOWED_COLUMNS = ['category_id', 'name', 'slug', 'description', 'price', 'original_price', 'discount_percent', 'stock', 'weight_spec', 'origin', 'shipping_info', 'is_featured', 'is_active', 'gluten_free', 'organic', 'badge', 'composition', 'shelf_life', 'attributes'];

export async function updateProduct(id: number, input: Partial<CreateProductInput>) {
  // Harga: simpan persis apa yang FE kirim — FE (admin) adalah single source of truth.
  // FE selalu mengirim harga LENGKAP: original_price + price (final) + discount_percent.
  // JANGAN hitung ulang di sini — kalau FE kirim price yang sudah didiskon, hitung ulang
  // akan double-apply (harga melenceng lagi).
  const fields: string[] = [];
  const params: any[] = [];

  // Normalisasi: kalau price dikirim tanpa original_price, original = price (tanpa diskon).
  const cleanInput: Record<string, any> = { ...input };
  if (cleanInput.price !== undefined && cleanInput.original_price === undefined) {
    cleanInput.original_price = Number(cleanInput.price) || 0;
    cleanInput.discount_percent = 0;
  }
  // Normalisasi badge: WAJIB ada di tabel badges (dikelola via Kelola Badge).
  // Badge tidak dikenal → NULL (cegah badge yatim).
  if (cleanInput.badge !== undefined) {
    cleanInput.badge = await normalizeBadge(cleanInput.badge ?? null);
  }

  for (const [key, val] of Object.entries(cleanInput)) {
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
  // Produk yang sudah pernah dipesan TIDAK bisa di-hapus baris (FK order_items →
  // products RESTRICT) → 500 error. Solusi: soft-delete = nonaktifkan + bersihkan
  // relasi yang aman (cart, wishlist, gambar). Riwayat order TETAP utuh.
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    // Cek apakah produk pernah dipesan (ada di order_items)
    const [ordered] = await conn.query('SELECT id FROM order_items WHERE product_id = ? LIMIT 1', [id]);
    const hasOrder = (ordered as any[]).length > 0;
    if (hasOrder) {
      // Soft-delete: nonaktifkan (hilang dari katalog user), simpan data untuk riwayat
      await conn.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    } else {
      // Produk belum pernah dipesan → hapus baris aman (bersihkan relasi dulu)
      await conn.query('DELETE FROM cart_items WHERE product_id = ?', [id]);
      await conn.query('DELETE FROM wishlists WHERE product_id = ?', [id]);
      await conn.query('DELETE FROM product_images WHERE product_id = ?', [id]);
      await conn.query('DELETE FROM products WHERE id = ?', [id]);
    }
    await conn.commit();
    return true;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
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
