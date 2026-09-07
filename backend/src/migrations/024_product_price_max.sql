-- 021_product_price_max.sql
-- Menambahkan kolom price_max untuk mendukung rentang harga produk (min_price s.d max_price)
-- Jika price_max NULL atau sama dengan price, harga produk bernilai tunggal.
-- Idempotent: error 1060 (duplicate column) di-skip oleh migrate.cjs.
ALTER TABLE products
  ADD COLUMN price_max INT UNSIGNED NULL DEFAULT NULL AFTER price;
