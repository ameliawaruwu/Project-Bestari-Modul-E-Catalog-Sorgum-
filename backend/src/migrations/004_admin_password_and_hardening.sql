-- ================================================
-- 004_admin_password_and_hardening.sql
-- 1. Update password admin -> bcrypt('admin123') (production-safe hash)
-- 2. Pastikan akun admin@bestari.id ada dengan role 'admin'
-- ================================================

-- Update password admin existing (id 2, admin@bestari.id) ke hash bcrypt('admin123')
UPDATE users
SET password_hash = '$2b$10$avuRZLOoipGD8dkB5p6dMOsn985Nem/PCeUavr87ZDp6yRcIi854O'
WHERE email = 'admin@bestari.id'
  AND role = 'admin';

-- Jika akun admin belum ada (fresh DB), buat sekalian
INSERT INTO users (name, email, password_hash, role)
SELECT 'Admin', 'admin@bestari.id', '$2b$10$avuRZLOoipGD8dkB5p6dMOsn985Nem/PCeUavr87ZDp6yRcIi854O', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@bestari.id'
);
