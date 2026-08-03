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
  const [result] = await dbPool.query('DELETE FROM categories WHERE id = ?', [id]);
  return (result as any).affectedRows > 0;
}
