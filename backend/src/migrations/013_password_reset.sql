-- ================================================
-- BESTARI E-Catalog - Migration 013
-- Password Reset (Lupa Password via WA OTP)
-- ================================================
USE ecatalog_bestari_db;

-- Tokens OTP untuk reset password
-- - email: user yang minta reset
-- - otp_hash: hash bcrypt dari kode OTP (jangan simpan plaintext)
-- - expires_at: waktu kadaluarsa (5 menit setelah generate)
-- - used: 0 = belum dipakai, 1 = sudah dipakai (invalidasi)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(200) NOT NULL,
  otp_hash   VARCHAR(255) NOT NULL,
  expires_at DATETIME     NOT NULL,
  used       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_password_reset_email (email),
  KEY idx_password_reset_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
