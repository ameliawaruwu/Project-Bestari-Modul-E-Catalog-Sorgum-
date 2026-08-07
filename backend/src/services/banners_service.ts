import dbPool from '../lib/db';

export interface BannerRow {
  id: number;
  title: string;
  title_en?: string | null;
  image_url: string;
  target_type: string;
  target_link?: string | null;
  sort_order: number;
  is_active: number;
}

export async function getActiveBanners(): Promise<BannerRow[]> {
  const [rows] = await dbPool.query(
    'SELECT id, title, title_en, image_url, target_type, target_link, sort_order, is_active FROM banners WHERE is_active = 1 ORDER BY sort_order ASC',
  );
  return rows as BannerRow[];
}

export async function getAllBanners(): Promise<BannerRow[]> {
  const [rows] = await dbPool.query(
    'SELECT * FROM banners ORDER BY sort_order ASC',
  );
  return rows as BannerRow[];
}

export async function createBanner(title: string, title_en: string | null, image_url: string, target_type = 'store', target_link?: string) {
  const [result] = await dbPool.query(
    'INSERT INTO banners (title, title_en, image_url, target_type, target_link) VALUES (?, ?, ?, ?, ?)',
    [title, title_en || null, image_url, target_type, target_link || null],
  );
  return (result as any).insertId;
}

const BANNER_ALLOWED_COLUMNS = ['title', 'title_en', 'image_url', 'target_type', 'target_link', 'is_active', 'sort_order'];

export async function updateBanner(id: number, fields: Record<string, any>) {
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(fields)) {
    // Whitelist kolom — cegah SQL injection via dynamic column name
    if (!BANNER_ALLOWED_COLUMNS.includes(k)) continue;
    if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
  }
  if (sets.length === 0) return false;
  vals.push(id);
  const [r] = await dbPool.query(`UPDATE banners SET ${sets.join(', ')} WHERE id = ?`, vals);
  return (r as any).affectedRows > 0;
}

export async function deleteBanner(id: number) {
  const [r] = await dbPool.query('DELETE FROM banners WHERE id = ?', [id]);
  return (r as any).affectedRows > 0;
}
