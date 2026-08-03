import dbPool from '../lib/db';

interface BannerRow {
  id: number;
  title: string;
  image_url: string;
  target_type: string;
  target_link: string | null;
  sort_order: number;
}

export async function getActiveBanners(): Promise<BannerRow[]> {
  const [rows] = await dbPool.query(
    'SELECT id, title, image_url, target_type, target_link, sort_order FROM banners WHERE is_active = 1 ORDER BY sort_order ASC',
  );
  return rows as BannerRow[];
}

export async function getAllBanners(): Promise<BannerRow[]> {
  const [rows] = await dbPool.query(
    'SELECT * FROM banners ORDER BY sort_order ASC',
  );
  return rows as BannerRow[];
}

export async function createBanner(title: string, image_url: string, target_type = 'store', target_link?: string) {
  const [result] = await dbPool.query(
    'INSERT INTO banners (title, image_url, target_type, target_link) VALUES (?, ?, ?, ?)',
    [title, image_url, target_type, target_link || null],
  );
  return (result as any).insertId;
}

export async function updateBanner(id: number, fields: Record<string, any>) {
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(fields)) {
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
