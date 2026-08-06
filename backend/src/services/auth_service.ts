import bcrypt from 'bcrypt';
import dbPool from '../lib/db';
import { AppError } from '../lib/errors_utils';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  is_deleted?: number;
}

export async function register(input: RegisterInput) {
  const { name, email, password, phone } = input;

  const [existing] = await dbPool.query(
    'SELECT id FROM users WHERE email = ?',
    [email],
  );
  if ((existing as any[]).length > 0) {
    throw new AppError('Email sudah terdaftar', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await dbPool.query(
    'INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, phone || null],
  );

  const insertId = (result as any).insertId;
  const [rows] = await dbPool.query(
    'SELECT id, name, email, role FROM users WHERE id = ?',
    [insertId],
  );
  return (rows as UserRow[])[0];
}

export async function login(input: LoginInput) {
  const { email, password } = input;

  const [rows] = await dbPool.query(
    'SELECT id, name, email, password_hash, role, is_deleted FROM users WHERE email = ?',
    [email],
  );

  const user = (rows as UserRow[])[0];
  if (!user) {
    throw new AppError('Email atau password salah', 401);
  }

  // SOFT DELETE: user yang dinonaktifkan admin tidak boleh login lagi
  if (user.is_deleted) {
    throw new AppError('Akun Anda telah dinonaktifkan. Hubungi admin.', 403);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError('Email atau password salah', 401);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
