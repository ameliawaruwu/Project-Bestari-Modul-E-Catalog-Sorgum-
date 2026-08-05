-- ================================================
-- 006. CART: owner_key + UNIQUE (owner_key, product_id)
--      Mencegah duplikat baris cart utk produk sama (race double-click /
--      request paralel). Dipakai oleh addToCart upsert atomic.
--      Berlaku untuk DB yang sudah punya data (upgrade dari 005).
-- ================================================

-- 1) Tambah kolom owner_key (nullable dulu utk backfill)
ALTER TABLE cart_items ADD COLUMN owner_key VARCHAR(120) NULL AFTER session_id;

-- 2) Backfill: user -> 'u<userId>:', guest -> 's<sessionId>'
UPDATE cart_items SET owner_key = CONCAT(
  IF(user_id IS NULL, 's', CONCAT('u', user_id)),
  ':',
  IF(session_id IS NULL, '', session_id)
);

-- 3) NOT NULL + unique index
ALTER TABLE cart_items
  MODIFY owner_key VARCHAR(120) NOT NULL,
  ADD UNIQUE INDEX uq_cart_owner_product (owner_key, product_id);
