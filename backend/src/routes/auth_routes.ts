import { Router, Request, Response } from 'express';
import { login } from '../services/auth_service';
import { AppError } from '../lib/errors_utils';
import { signToken } from '../lib/jwt_utils';
import { authRequired } from '../middleware/auth';
import { authLimiter } from '../middleware/rate_limit';
import dbPool from '../lib/db';

const router = Router();

router.use(authLimiter);

function validate(req: Request, fields: string[]): string | null {
  for (const f of fields) {
    if (!req.body[f]) return `${f} wajib diisi`;
  }
  return null;
}

router.post('/login', async (req: Request, res: Response) => {
  const err = validate(req, ['email', 'password']);
  if (err) { res.status(400).json({ error: err }); return; }

  const { email, password } = req.body;

  if (!email.includes('@') || email.length < 5) { res.status(400).json({ error: 'Format email tidak valid' }); return; }

  try {
    const user = await login({ email, password });
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({ message: 'Login berhasil', data: { user, token } });
  } catch (e: any) {
    const status = e instanceof AppError ? e.status : 500;
    res.status(status).json({ error: e.message || 'Terjadi kesalahan' });
  }
});

router.get('/me', authRequired, async (req: Request, res: Response) => {
  const userId = (req.user as any).userId;
  const [rows] = await dbPool.query(
    'SELECT id, name, email, phone, gender, birth_date, role, created_at FROM users WHERE id = ?',
    [userId],
  );
  const user = (rows as any[])[0];
  if (!user) {
    res.status(404).json({ error: 'User tidak ditemukan' });
    return;
  }
  res.json({ data: user });
});

export default router;
