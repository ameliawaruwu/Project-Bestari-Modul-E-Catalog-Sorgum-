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
