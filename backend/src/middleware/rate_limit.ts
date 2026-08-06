import rateLimit from 'express-rate-limit';

// Rate limiter untuk endpoint auth (login/register).
// - Prod: max 100 request / 15 menit per IP (anti brute-force).
// - Dev/testing: set RATE_LIMIT_DISABLED=1 untuk bypass total
//   (misal E2E yang login berulang). Default: enabled.
const RATE_LIMIT_DISABLED = process.env.RATE_LIMIT_DISABLED === '1';

export const authLimiter = RATE_LIMIT_DISABLED
  ? // Bypass: middleware kosong (skip rate limit)
    (req: any, _res: any, next: any) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 menit
      max: 100, // max 100 request per window
      // Bypass validasi X-Forwarded-For: app jalan di belakang nginx yang
      // selalu set header ini. express-rate-limit v8 melempar
      // ERR_ERL_UNEXPECTED_X_FORWARDED_FOR kalau validasi tetap on
      // (trust proxy express sudah di-set di index.ts → validasi malah salah
      // deteksi "permissive"). Nonaktifkan validasi ini supaya tidak crash.
      validate: { xForwardedForHeader: false },
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Terlalu banyak percobaan. Coba lagi 15 menit.' },
    });
