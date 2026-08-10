-- 020_order_soft_delete.sql
-- Soft-delete transaksi order: admin "hapus" hanya set deleted_at (data arsip
-- TETAP di DB, bisa di-restore), bukan hapus baris. listOrders admin filter
-- deleted_at IS NULL.
-- Idempotent: error 1060 (duplicate column) di-skip oleh migrate.cjs.
ALTER TABLE orders
  ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER payment_status;
