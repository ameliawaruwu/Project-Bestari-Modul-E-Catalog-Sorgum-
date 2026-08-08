import dbPool from '../lib/db';

export interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
}

export async function getCategories(): Promise<CategoryRow[]> {
  const [rows] = await dbPool.query(
    'SELECT id, name, slug, image_url, sort_order FROM categories ORDER BY sort_order ASC',
  );
  return rows as CategoryRow[];
}

export async function createCategory(name: string, slug: string): Promise<number> {
  const [result] = await dbPool.query(
    'INSERT INTO categories (name, slug) VALUES (?, ?)',
    [name, slug],
  );
  return (result as any).insertId;
}

export async function updateCategory(id: number, name: string, slug: string): Promise<boolean> {
  const [result] = await dbPool.query(
    'UPDATE categories SET name = ?, slug = ? WHERE id = ?',
    [name, slug, id],
  );
  return (result as any).affectedRows > 0;
}

export async function deleteCategory(id: number): Promise<boolean> {
  // Kategori yang masih punya produk (FK products.category_id → categories.id RESTRICT)
  // tidak bisa di-hapus baris → 500. Solusi: kalau masih ada produk, TOLAK dengan pesan
  // jelas (admin harus pindahkan/hapus produk dulu); kalau kosong, hapus baris.
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    const [prods] = await conn.query('SELECT id FROM products WHERE category_id = ? LIMIT 1', [id]);
    if ((prods as any[]).length > 0) {
      await conn.rollback();
      throw new Error('Kategori tidak bisa dihapus: masih ada produk di dalamnya. Pindahkan atau hapus produk dulu.');
    }
    const [result] = await conn.query('DELETE FROM categories WHERE id = ?', [id]);
    await conn.commit();
    return (result as any).affectedRows > 0;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
