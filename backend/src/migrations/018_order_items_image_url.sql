-- 018_order_items_image_url.sql
-- Snapshot gambar produk ke order_items supaya transaksi/riwayat order tetap
-- menampilkan gambar yang benar walau produk diedit/dihapus di kemudian hari.
ALTER TABLE order_items
  ADD COLUMN image_url VARCHAR(500) NULL AFTER product_name;
