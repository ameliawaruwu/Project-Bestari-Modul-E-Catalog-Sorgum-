import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20, // max 20 request per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan. Coba lagi 15 menit.' },
});
