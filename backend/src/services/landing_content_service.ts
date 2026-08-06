import dbPool from '../lib/db';

// Landing content disimpan key-value di tabel `landing_content`.
// GET public (untuk beranda), PUT admin (untuk simpan dari admin panel).

export async function getLandingContent(): Promise<Record<string, string>> {
  const [rows] = await dbPool.query('SELECT `key`, `value` FROM landing_content');
  const out: Record<string, string> = {};
  (rows as Array<{ key: string; value: string | null }>).forEach((r) => {
    out[r.key] = r.value ?? '';
  });
  return out;
}

// Simpan partial update — hanya key yang dikirim yang diubah.
export async function upsertLandingContent(fields: Record<string, string>) {
  const entries = Object.entries(fields).filter(([k, v]) => typeof v === 'string' && k.trim() !== '');
  if (entries.length === 0) return 0;
  for (const [key, value] of entries) {
    await dbPool.query(
      'INSERT INTO landing_content (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
      [key, value],
    );
  }
  return entries.length;
}
