import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dbPool from '../lib/db';
import { config } from '../lib/config';
import { AppError } from '../lib/errors_utils';

// ============================================================
// Password Reset Service — Lupa Password via WhatsApp OTP
//
// Flow:
//   1. POST /api/auth/forgot-password { email }
//      - cek user ada + punya phone
//      - generate OTP 6 digit, simpan hash bcrypt di DB (5 menit)
//      - kirim OTP via GoWA webhook ke nomor WA user
//      - SELALU return sukses (anti user-enumeration): kalau email
//        tidak ada, tetap balas pesan sukses tapi tanpa kirim apa-apa
//   2. POST /api/auth/reset-password { email, otp, new_password }
//      - validasi OTP (bcrypt compare) + belum expired + belum used
//      - update password_hash user (bcrypt), tandai OTP used
// ============================================================

const OTP_TTL_MS = config.passwordReset.otpTtlMinutes * 60 * 1000;
const WEBHOOK_URL = config.waWebhook.url;

/** Konversi nomor WA Indonesia ke JID (628xxx@s.whatsapp.net) */
function phoneToJid(phone: string): string {
  let p = phone.replace(/\D/g, '');
  // 0812... -> 62812... (tambah kode negara 62 jika belum)
  if (p.startsWith('0')) p = '62' + p.slice(1);
  if (p.startsWith('8')) p = '62' + p;
  return `${p}@s.whatsapp.net`;
}

/** Kirim pesan WA via GoWA webhook */
async function sendWhatsApp(toJid: string, message: string): Promise<void> {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: toJid, message }),
  });
  if (!res.ok) {
    throw new AppError(`Gagal mengirim WhatsApp (HTTP ${res.status})`, 502);
  }
  const text = await res.text();
  if (!text.includes('notify applied')) {
    throw new AppError(`Webhook WhatsApp: ${text || 'response tidak dikenali'}`, 502);
  }
}

function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString(); // 6 digit
}

/** Hapus token OTP lama yang sudah expired/used untuk email tsb */
async function cleanupOldTokens(email: string): Promise<void> {
  await dbPool.query(
    'DELETE FROM password_reset_tokens WHERE email = ? AND (expires_at < NOW() OR used = 1)',
    [email],
  );
}

/**
 * Step 1 — minta OTP via WhatsApp ke nomor user.
 * Return: { sent: boolean } — sent=false artinya user tidak punya phone,
 * tapi kita TETAP balas sukses biar attacker tidak tahu email terdaftar.
 */
export async function requestPasswordReset(email: string) {
  const [rows] = await dbPool.query(
    'SELECT id, phone FROM users WHERE email = ?',
    [email],
  );
  const user = (rows as any[])[0];

  // User tidak ada ATAU tidak punya phone -> jangan kirim apa-apa,
  // tapi tetap sukses (anti-enumeration).
  if (!user || !user.phone) {
    return { sent: false };
  }

  // Hapus token lama dulu biar tidak numpuk
  await cleanupOldTokens(email);

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await dbPool.query(
    'INSERT INTO password_reset_tokens (email, otp_hash, expires_at) VALUES (?, ?, ?)',
    [email, otpHash, expiresAt],
  );

  const jid = phoneToJid(user.phone);
  const message =
    `🔐 *Kode Verifikasi BESTARI*\n\n` +
    `Kode OTP kamu: *${otp}*\n\n` +
    `Kode berlaku selama ${config.passwordReset.otpTtlMinutes} menit.\n` +
    `Jangan bagikan kode ini ke siapa pun.`;

  await sendWhatsApp(jid, message);

  return { sent: true };
}

/**
 * Step 2 — validasi OTP lalu ganti password.
 */
export async function resetPassword(email: string, otp: string, newPassword: string) {
  // Cari token terbaru yang belum expired & belum used
  const [rows] = await dbPool.query(
    `SELECT id, otp_hash, expires_at, used
       FROM password_reset_tokens
      WHERE email = ? AND used = 0 AND expires_at > NOW()
      ORDER BY id DESC LIMIT 1`,
    [email],
  );
  const token = (rows as any[])[0];
  if (!token) {
    throw new AppError('Kode OTP tidak valid atau sudah kadaluarsa', 400);
  }

  const valid = await bcrypt.compare(otp, token.otp_hash);
  if (!valid) {
    throw new AppError('Kode OTP tidak valid atau sudah kadaluarsa', 400);
  }

  // Update password user
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await dbPool.query(
    'UPDATE users SET password_hash = ? WHERE email = ?',
    [passwordHash, email],
  );

  // Tandai OTP used (invalidasi)
  await dbPool.query(
    'UPDATE password_reset_tokens SET used = 1 WHERE id = ?',
    [token.id],
  );

  return { success: true };
}
