-- ================================================
-- BESTARI E-Catalog - Migration 022: Hapus konsep stok produk
-- ================================================
-- Produk tidak lagi punya stok (fungsi stok/habis dihapus total).
-- Kolom stock di-drop dari products; pemakaian stock (decrement saat
-- order, label Habis, field "Jumlah Stok" di form CRUD) semua dihapus.
USE ecatalog_bestari_db;

ALTER TABLE products DROP COLUMN stock;
