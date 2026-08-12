import dbPool from '../lib/db';

// Cache in-memory TTL singkat (30s) — landing content jarang berubah (hanya
// saat admin simpan dari panel), tapi di-fetch tiap load beranda oleh semua
// user. Tanpa cache, tiap load = 1 query DB. Data sama untuk semua user.
// Invalidate otomatis saat admin update (upsertLandingContent).
const CACHE_TTL_MS = 30_000;
let cache: { data: Record<string, string>; at: number } | null = null;

// Landing content disimpan key-value di tabel `landing_content`.
// GET public (untuk beranda), PUT admin (untuk simpan dari admin panel).

export async function getLandingContent(): Promise<Record<string, string>> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.data;
  }
  const [rows] = await dbPool.query('SELECT `key`, `value` FROM landing_content');
  const out: Record<string, string> = {};
  (rows as Array<{ key: string; value: string | null }>).forEach((r) => {
    out[r.key] = r.value ?? '';
  });
  cache = { data: out, at: Date.now() };
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
  // Invalidate cache — data berubah.
  cache = null;
  return entries.length;
}
