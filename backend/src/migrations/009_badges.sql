-- Migration 009: Tabel badges (badge produk yang bisa dikelola admin)
-- Badge dipakai sebagai referensi dropdown "Badge Highlight Produk" di Kelola Produk.

CREATE TABLE IF NOT EXISTS badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed: badge default (sinkron dengan produk yang sudah pakai badge)
INSERT IGNORE INTO badges (name, is_active) VALUES
  ('BEST SELLER', 1),
  ('DISKON 15%', 1),
  ('BARU', 1);
