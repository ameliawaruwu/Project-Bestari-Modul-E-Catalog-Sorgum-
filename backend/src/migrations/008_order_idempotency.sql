-- ================================================
-- 008. IDEMPOTENCY KEY pada orders: cegah double-submit checkout
--      (2 POST paralel → order ganda + stok ganda terdecrement).
--      Client kirim idempotency_key unik per attempt checkout;
--      kalau key sama sudah pernah dipakai → replay order yang ada.
-- ================================================

ALTER TABLE orders
  ADD COLUMN idempotency_key VARCHAR(64) NULL AFTER order_number,
  ADD UNIQUE KEY uq_orders_idempotency (idempotency_key);
