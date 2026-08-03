import { Router, Request, Response } from 'express';
import { register, login } from '../services/auth_service';
import { AppError } from '../lib/errors_utils';
import { signToken } from '../lib/jwt_utils';
import { authRequired } from '../middleware/auth';
import { authLimiter } from '../middleware/rate_limit';

const router = Router();

router.use(authLimiter);

function validate(req: Request, fields: string[]): string | null {
  for (const f of fields) {
    if (!req.body[f]) return `${f} wajib diisi`;
  }
  return null;
}

router.post('/register', async (req: Request, res: Response) => {
  const err = validate(req, ['name', 'email', 'password']);
  if (err) { res.status(400).json({ error: err }); return; }

  const { name, email, password } = req.body;

  if (name.length < 2) { res.status(400).json({ error: 'Nama minimal 2 karakter' }); return; }
  if (!email.includes('@') || email.length < 5) { res.status(400).json({ error: 'Format email tidak valid' }); return; }
  if (password.length < 6) { res.status(400).json({ error: 'Password minimal 6 karakter' }); return; }

  try {
    const user = await register({ name, email, password });
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({ message: 'Pendaftaran berhasil', data: { user, token } });
  } catch (e: any) {
    const status = e instanceof AppError ? e.status : 500;
    res.status(status).json({ error: e.message || 'Terjadi kesalahan' });
  }
});

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

router.get('/me', authRequired, (req: Request, res: Response) => {
  res.json({ data: req.user });
});

export default router;
