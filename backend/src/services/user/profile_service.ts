import dbPool from '../../lib/db';
import bcrypt from 'bcrypt';

export async function getProfile(userId: number) {
  const [rows] = await dbPool.query(
    'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
    [userId],
  );
  return (rows as any[])[0] || null;
}

export async function updateProfile(userId: number, fields: Record<string, any>) {
  const sets: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
  }
  if (sets.length === 0) return false;
  vals.push(userId);
  await dbPool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);

  const [rows] = await dbPool.query(
    'SELECT id, name, email, phone, role FROM users WHERE id = ?',
    [userId],
  );
  return (rows as any[])[0];
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string) {
  const [rows] = await dbPool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
  const user = (rows as any[])[0];
  if (!user) throw new Error('User tidak ditemukan');

  const valid = await bcrypt.compare(oldPassword, user.password_hash);
  if (!valid) throw new Error('Password lama salah');

  const hash = await bcrypt.hash(newPassword, 10);
  await dbPool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
}
