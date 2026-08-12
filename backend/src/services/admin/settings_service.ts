import dbPool from '../../lib/db';

// Cache in-memory TTL singkat (30s) — site_settings jarang berubah (hanya
// saat admin edit dari panel), tapi di-fetch tiap load halaman oleh semua
// user (Header, QrisPaymentPage, tombol WA). Tanpa cache, tiap load = 1 query.
// Invalidate otomatis saat admin update (updateSettings).
const CACHE_TTL_MS = 30_000;
let cache: { data: Record<string, string>; at: number } | null = null;

export async function getSettings() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.data;
  }
  const [rows] = await dbPool.query('SELECT setting_key, setting_value FROM site_settings');
  const map: Record<string, string> = {};
  for (const r of rows as any[]) {
    map[r.setting_key] = r.setting_value;
  }
  cache = { data: map, at: Date.now() };
  return map;
}

export async function updateSettings(data: Record<string, string>) {
  for (const [key, value] of Object.entries(data)) {
    await dbPool.query(
      'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, value, value],
    );
  }
  // Invalidate cache — data berubah.
  cache = null;
}
