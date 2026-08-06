-- Migration 010: Diskon produk + Spesifikasi (komposisi & masa simpan)
-- original_price: harga sebelum diskon (NULL = tidak ada diskon)
-- discount_percent: 0-90
-- price: harga jual FINAL (setelah diskon) — BE hitung saat simpan
-- composition: komposisi produk (spesifikasi)
-- shelf_life: masa simpan produk (spesifikasi)

ALTER TABLE products
  ADD COLUMN original_price INT UNSIGNED NULL DEFAULT NULL AFTER price,
  ADD COLUMN discount_percent INT UNSIGNED NOT NULL DEFAULT 0 AFTER original_price,
  ADD COLUMN composition TEXT NULL AFTER badge,
  ADD COLUMN shelf_life VARCHAR(100) NULL AFTER composition;
