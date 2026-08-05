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
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Terlalu banyak percobaan. Coba lagi 15 menit.' },
    });
