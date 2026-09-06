-- ================================================
-- BESTARI E-Catalog - Migration 021: Artikel↔Produk, WA per produk, hapus badge
-- ================================================
USE ecatalog_bestari_db;

-- 1. Relasi banyak-ke-banyak artikel ↔ produk (tag manual produk di artikel)
CREATE TABLE IF NOT EXISTS article_products (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_article_product (article_id, product_id),
  INDEX idx_ap_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Nomor WhatsApp per produk (pemilik/penjual produk). NULL = fallback nomor global toko.
-- (Tidak pakai AFTER badge: kolom badge akan di-drop di langkah 3 — pakai posisi default di akhir.)
ALTER TABLE products
  ADD COLUMN wa_contact VARCHAR(30) NULL;

-- 3. Hapus fitur badge total (kelola badge di admin + kolom badge di produk)
DROP TABLE IF EXISTS badges;
ALTER TABLE products DROP COLUMN badge;
