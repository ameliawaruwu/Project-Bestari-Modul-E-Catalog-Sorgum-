import dbPool from '../lib/db';

export interface BadgeRow {
  id: number;
  name: string;
  is_active: number | boolean;
}

export async function getBadges(includeInactive = false): Promise<BadgeRow[]> {
  const [rows] = await dbPool.query(
    includeInactive
      ? 'SELECT id, name, is_active FROM badges ORDER BY id ASC'
      : 'SELECT id, name, is_active FROM badges WHERE is_active = 1 ORDER BY id ASC',
  );
  return rows as BadgeRow[];
}

export async function createBadge(name: string): Promise<number> {
  const [result] = await dbPool.query('INSERT INTO badges (name) VALUES (?)', [name]);
  return (result as any).insertId;
}

export async function updateBadge(id: number, name: string, isActive: boolean): Promise<boolean> {
  const [result] = await dbPool.query(
    'UPDATE badges SET name = ?, is_active = ? WHERE id = ?',
    [name, isActive ? 1 : 0, id],
  );
  return (result as any).affectedRows > 0;
}

export async function deleteBadge(id: number): Promise<boolean> {
  const conn = await dbPool.getConnection();
  try {
    await conn.beginTransaction();
    // Ambil nama badge dulu (sebelum dihapus) — buat sinkronisasi ke produk
    const [rows] = await conn.query('SELECT name FROM badges WHERE id = ?', [id]);
    const badge = (rows as any[])[0];
    if (!badge) {
      await conn.rollback();
      return false;
    }
    // Sinkronisasi: semua produk yang memakai badge ini kehilangan badge-nya.
    // (badge di products adalah string bebas, jadi hapus manual by name)
    await conn.query('UPDATE products SET badge = NULL WHERE badge = ?', [badge.name]);
    const [result] = await conn.query('DELETE FROM badges WHERE id = ?', [id]);
    await conn.commit();
    return (result as any).affectedRows > 0;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
