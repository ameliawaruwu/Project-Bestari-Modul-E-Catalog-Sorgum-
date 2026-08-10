-- 019_shipping_info.sql
-- Kolom shipping_info untuk produk: teks "Informasi Pengiriman" yang admin isi
-- di form produk (mis. "Dikirim dari Yogyakarta. Diproses sebelum jam 15:00 WIB.")
-- Sebelumnya field ini ADA di form admin tapi TIDAK punya kolom DB — data yang
-- diisi admin hilang, dan sisi user hardcode "Dikirim dari Yogyakarta."
-- Idempotent: error 1060 (duplicate column) di-skip oleh migrate.cjs.
ALTER TABLE products
  ADD COLUMN shipping_info TEXT NULL AFTER origin;
