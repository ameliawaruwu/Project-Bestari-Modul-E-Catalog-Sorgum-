import { Router, Request, Response } from 'express';
import { register, login } from '../services/auth_service';
import { requestPasswordReset, resetPassword } from '../services/password_reset_service';
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

router.post('/register', async (req: Request, res: Response) => {
  const err = validate(req, ['name', 'email', 'password']);
  if (err) { res.status(400).json({ error: err }); return; }

  const { name, email, password, phone } = req.body;

  if (name.length < 2) { res.status(400).json({ error: 'Nama minimal 2 karakter' }); return; }
  if (!email.includes('@') || email.length < 5) { res.status(400).json({ error: 'Format email tidak valid' }); return; }
  if (password.length < 6) { res.status(400).json({ error: 'Password minimal 6 karakter' }); return; }

  // Phone opsional tapi kalau diisi harus valid (digit 10-15)
  let phoneClean: string | undefined;
  if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
    phoneClean = String(phone).replace(/\D/g, '');
    if (phoneClean.length < 10 || phoneClean.length > 15) {
      res.status(400).json({ error: 'Format nomor WhatsApp tidak valid' }); return;
    }
  }

  try {
    const user = await register({ name, email, password, phone: phoneClean });
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

router.post('/forgot-password', async (req: Request, res: Response) => {
  const err = validate(req, ['email']);
  if (err) { res.status(400).json({ error: err }); return; }

  const { email } = req.body;
  if (!email.includes('@') || email.length < 5) { res.status(400).json({ error: 'Format email tidak valid' }); return; }

  try {
    // Selalu balas sukses (anti user-enumeration) — kalau email tidak ada,
    // service return { sent: false } tapi kita tetap kirim pesan sama.
    await requestPasswordReset(email);
    res.json({ message: 'Jika email terdaftar, kode OTP akan dikirim ke WhatsApp Anda.' });
  } catch (e: any) {
    const status = e instanceof AppError ? e.status : 500;
    res.status(status).json({ error: e.message || 'Terjadi kesalahan' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  const err = validate(req, ['email', 'otp', 'new_password']);
  if (err) { res.status(400).json({ error: err }); return; }

  const { email, otp, new_password } = req.body;
  if (!email.includes('@') || email.length < 5) { res.status(400).json({ error: 'Format email tidak valid' }); return; }
  if (!/^\d{6}$/.test(String(otp))) { res.status(400).json({ error: 'Kode OTP harus 6 digit angka' }); return; }
  if (new_password.length < 6) { res.status(400).json({ error: 'Password minimal 6 karakter' }); return; }

  try {
    await resetPassword(email, String(otp), new_password);
    res.json({ message: 'Password berhasil diubah. Silakan login dengan password baru.' });
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
