-- ============================================================
-- 005_order_discount_and_stock.sql
-- 1. Kolom discount di orders (diskon FE yang tadinya gak masuk BE)
-- 2. wishlists table (ada di DB manual tapi gak pernah ke-migration —
--    fresh deploy dari 001-004 bakal 500 "table doesn't exist")
-- ============================================================

ALTER TABLE orders ADD COLUMN discount INT UNSIGNED NOT NULL DEFAULT 0 AFTER shipping_cost;

CREATE TABLE IF NOT EXISTS wishlists (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
  KEY idx_wishlist_user (user_id),
  KEY idx_wishlist_product (product_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. UNIQUE key di tracking_history biar INSERT IGNORE bisa dedupe
--    (sebelumnya cuma INDEX — tiap poll nambah duplikat checkpoint)
ALTER TABLE tracking_history ADD UNIQUE KEY uq_thist_dedup (order_id, tracking_number, event_date, description);
