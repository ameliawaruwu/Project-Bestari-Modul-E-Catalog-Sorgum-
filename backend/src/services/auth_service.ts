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
  phone?: string | null;
  password_hash: string;
  role: 'user' | 'admin';
  gender?: string | null;
  birth_date?: string | null;
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
    'SELECT id, name, email, phone, gender, birth_date, role FROM users WHERE id = ?',
    [insertId],
  );
  return (rows as UserRow[])[0];
}

export async function login(input: LoginInput) {
  const { email, password } = input;

  const [rows] = await dbPool.query(
    'SELECT id, name, email, phone, gender, birth_date, password_hash, role FROM users WHERE email = ?',
    [email],
  );

  const user = (rows as UserRow[])[0];
  if (!user) {
    throw new AppError('Email atau password salah', 401);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError('Email atau password salah', 401);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    gender: user.gender ?? null,
    birth_date: user.birth_date ?? null,
  };
}
