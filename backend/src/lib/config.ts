import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.ECATALOG_BESTARI_PORT || '20203', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.ECATALOG_BESTARI_DB_HOST || 'localhost',
    port: parseInt(process.env.ECATALOG_BESTARI_DB_PORT || '3306', 10),
    user: process.env.ECATALOG_BESTARI_DB_USER || 'root',
    password: process.env.ECATALOG_BESTARI_DB_PASSWORD || '',
    database: process.env.ECATALOG_BESTARI_DB_NAME || 'ecatalog_bestari_db',
  },

  jwt: {
    secret: process.env.ECATALOG_BESTARI_JWT_SECRET || '',
    expiresIn: process.env.ECATALOG_BESTARI_JWT_EXPIRES_IN || '7d',
  },

  upload: {
    dir: path.resolve(process.env.ECATALOG_BESTARI_UPLOAD_DIR || 'uploads_ecatalog_bestari'),
    // 1MB — konsisten dgn batas nginx client_max_body_size & dokumen TC H8.
    // FE mengompres gambar ke <1MB sebelum upload, ini jaring pengaman backend.
    maxFileSize: parseInt(process.env.ECATALOG_BESTARI_MAX_FILE_SIZE || '1048576', 10),
  },

  tracking: {
    pollIntervalHours: parseInt(process.env.ECATALOG_BESTARI_TRACKING_POLL_HOURS || '4', 10),
  },

  store: {
    adminWhatsapp: process.env.ECATALOG_BESTARI_ADMIN_WA || '6281234567890',
  },

  // GoWA webhook untuk notifikasi WhatsApp (lupa password OTP, dll)
  waWebhook: {
    url: process.env.GOWA_WEBHOOK_URL || 'https://kroomhook.kroombox.com/notify',
  },

  // Password reset (OTP via WhatsApp)
  passwordReset: {
    otpTtlMinutes: parseInt(process.env.ECATALOG_BESTARI_OTP_TTL_MINUTES || '5', 10),
  },

  // Origin yang di-allow CORS (dipisah koma). Default: FE dev (vite).
  corsOrigins: (process.env.ECATALOG_BESTARI_CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
