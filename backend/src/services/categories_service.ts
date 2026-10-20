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

// Kategori + jumlah produk yang memakainya (dipakai panel admin supaya tahu
// kategori mana yang aman dihapus / masih terpakai).
export async function getCategoriesWithCount(): Promise<Array<CategoryRow & { product_count: number }>> {
  const [rows] = await dbPool.query(
    `SELECT c.id, c.name, c.slug, c.image_url, c.sort_order,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
     FROM categories c
     ORDER BY c.sort_order ASC, c.id ASC`,
  );
  return rows as Array<CategoryRow & { product_count: number }>;
}

export async function createCategory(name: string, slug: string, sortOrder = 0, imageUrl: string | null = null): Promise<number> {
  const [r] = await dbPool.query(
    'INSERT INTO categories (name, slug, sort_order, image_url) VALUES (?, ?, ?, ?)',
    [name, slug, sortOrder, imageUrl],
  );
  return (r as any).insertId;
}

export async function updateCategory(
  id: number,
  fields: { name?: string; slug?: string; sort_order?: number; image_url?: string | null },
): Promise<boolean> {
  const sets: string[] = [];
  const vals: any[] = [];
  if (fields.name !== undefined) { sets.push('name = ?'); vals.push(fields.name); }
  if (fields.slug !== undefined) { sets.push('slug = ?'); vals.push(fields.slug); }
  if (fields.sort_order !== undefined) { sets.push('sort_order = ?'); vals.push(fields.sort_order); }
  if (fields.image_url !== undefined) { sets.push('image_url = ?'); vals.push(fields.image_url); }
  if (sets.length === 0) return false;
  vals.push(id);
  const [r] = await dbPool.query(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, vals);
  return (r as any).affectedRows > 0;
}

export async function deleteCategory(id: number): Promise<boolean> {
  const [r] = await dbPool.query('DELETE FROM categories WHERE id = ?', [id]);
  return (r as any).affectedRows > 0;
}
