-- ================================================
-- BESTARI E-Catalog - Migration 003: complete FE contract alignment
-- 1. Add article fields: sub_image, quote, facts (from FE mock)
-- 2. Add favicon setting key
-- 3. Seed banners (2 items from FE mock)
-- 4. Seed article sub_image/quote/facts from FE mock
-- Idempotent: re-runnable safely.
-- ================================================

USE ecatalog_bestari_db;

-- Helper: add column if missing
DROP PROCEDURE IF EXISTS add_col_if_missing;
DELIMITER //
CREATE PROCEDURE add_col_if_missing(
  IN tbl VARCHAR(100), IN col VARCHAR(100), IN ddl VARCHAR(300)
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
  ) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN `', col, '` ', ddl);
    PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- 1. ARTICLES: add sub_image, quote, facts (FE contract)
CALL add_col_if_missing('articles', 'sub_image', 'TEXT NULL COMMENT ''gambar kedua di detail artikel''');
CALL add_col_if_missing('articles', 'quote', 'TEXT NULL COMMENT ''kutipan inspiratif di detail artikel''');
CALL add_col_if_missing('articles', 'facts', 'JSON NULL COMMENT ''[{"title":"...","desc":"..."}]''');

DROP PROCEDURE IF EXISTS add_col_if_missing;

-- 2. SITE_SETTINGS: add favicon key
INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
  ('favicon_url', '');

-- 3. BANNERS: seed 2 banner dari FE mock (target_type store/external)
INSERT IGNORE INTO banners (id, title, image_url, target_type, target_link, is_active, sort_order) VALUES
  (1, 'Panen Raya Sorgum',
   'https://lh3.googleusercontent.com/aida-public/AB6AXuBedFkef0uf3wThSykVry5S0pnKGNteDPCI4H_u9wXo2Iw6MB2JV9-GWbXBPiXoIINPGG_JNRn_oUg7XoFYH7bLYib2-pxC1R6SOqYMFKB6AYHi1lZWglunj0vDmRrLXAXarWaqQd_yPAqs39gyfrHheQ1wByPzSpB_9OZQV86FLWiUFhpsZ4tuUTDD6NKfMzT3xfwdnRJrmP6dxJnap7TErQ6DfJ3IoO2_VWWB3XP8JuMSECFMNiBl',
   'store', 'Halaman Toko: Semua Produk', 1, 1),
  (2, 'Premium Flour Promo',
   'https://lh3.googleusercontent.com/aida-public/AB6AXuA8wY4rl62cbf__Lmm6OcK6rlnQkthCQP-y7zpoy-tBoB5HOLHpQwSJn0cXw3lZWP1Y8xHrsN1V-eWwjfECt57oXWKH3xB_2E0dg47SLfD7yxZcJfcm830KEZ5_aLP4-nh-4UQrLF4hYkurAbuRJyO065v-dquECxPRORXeR5oKsJONK4OD3xskagnGH9TCjYv5a8V9hq0Qxu0Mr4EQv9LftQeAey3sPDBrw5HPD5OCeqEsyZ7pAqdF',
   'store', 'Detail Produk: Tepung Sorgum Halus', 1, 2);

-- 4. ARTICLES: seed sub_image/quote/facts dari FE mock (hanya artikel 1 yang punya)
UPDATE articles SET
  sub_image = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuHykNwQgW0Rs2Bovsk1_coUM0_feNAbh7qxnNLx9fmCRaL4puO8wRJLeHKQFjM0YytJKC12B2Zy8bTvBK16Acm9iVwOzZymcD_51isSWrea0iG4IL0CcHposBKpAu3nO1-r7rYTkVfJvpESNfBMbwahEuq7FfsqI3vvtIwEPym_pFCJfrjHpyrzrzoqxIKYP67mrjnv4C3Ue85AbHIGvHyfuYpV7aeQ0WbY8y3B7iCoVcq2K1znPAPA',
  quote = 'Sorghum bukan sekadar pengganti; ia adalah peningkatan kualitas nutrisi dalam piring Anda. Dengan indeks glikemik rendah, ia membantu menjaga stabilitas energi sepanjang hari tanpa lonjakan gula darah.',
  facts = JSON_ARRAY(
    JSON_OBJECT('title', 'Gluten-Free', 'desc', 'Aman 100% untuk diet bebas gandum.'),
    JSON_OBJECT('title', 'High Fiber', 'desc', 'Mendukung pencernaan yang optimal.'),
    JSON_OBJECT('title', 'Low Glycemic Index', 'desc', 'Membantu mengontrol gula darah.'),
    JSON_OBJECT('title', 'Rich in Antioxidants', 'desc', 'Melindungi sel tubuh dari radikal bebas.')
  )
WHERE id = 1;
