import dbPool from '../../lib/db';
import { AppError } from '../../lib/errors_utils';
import bcrypt from 'bcrypt';

export async function getAllUsers() {
  const [rows] = await dbPool.query(
    `SELECT id, name, email, phone, role, is_deleted, created_at
     FROM users WHERE role = 'user'
     ORDER BY created_at DESC`,
  );
  return rows;
}

export async function createUser(name: string, email: string, password: string, phone?: string) {
  const [existing] = await dbPool.query('SELECT id FROM users WHERE email = ?', [email]);
  if ((existing as any[]).length > 0) {
    throw new AppError('Email sudah digunakan', 409);
  }

  const hash = await bcrypt.hash(password, 10);
  await dbPool.query(
    "INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, 'user')",
    [name, email, hash, phone || null],
  );
}

export async function updateUserByAdmin(userId: number, fields: Record<string, any>) {
  if (fields.password) {
    fields.password_hash = await bcrypt.hash(fields.password, 10);
    delete fields.password;
  }

  const sets: string[] = [];
  const vals: any[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { sets.push(`${k} = ?`); vals.push(v); }
  }
  if (sets.length === 0) return false;
  vals.push(userId);

  const [r] = await dbPool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ? AND role = 'user'`, vals);
  return (r as any).affectedRows > 0;
}

export async function deleteUserByAdmin(userId: number) {
  // SOFT DELETE: nonaktifkan, bukan hapus baris. Data user (riwayat order, alamat)
  // tetap utuh; login user ini ditolak (auth_service cek is_deleted).
  const [r] = await dbPool.query(
    'UPDATE users SET is_deleted = 1 WHERE id = ? AND role = \'user\'',
    [userId]
  );
  return (r as any).affectedRows > 0;
}
