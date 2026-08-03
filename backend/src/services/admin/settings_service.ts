import dbPool from '../../lib/db';

export async function getSettings() {
  const [rows] = await dbPool.query('SELECT setting_key, setting_value FROM site_settings');
  const map: Record<string, string> = {};
  for (const r of rows as any[]) {
    map[r.setting_key] = r.setting_value;
  }
  return map;
}

export async function updateSettings(data: Record<string, string>) {
  for (const [key, value] of Object.entries(data)) {
    await dbPool.query(
      'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, value, value],
    );
  }
}
