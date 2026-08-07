-- ================================================
-- BESTARI E-Catalog - Migration 017: banner title_en
-- Tambah kolom title_en di tabel banners supaya judul banner
-- ikut berubah saat Switch Bahasa (EN). Admin isi judul EN.
-- Idempotent: re-runnable safely.
-- ================================================
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'banners'
    AND COLUMN_NAME = 'title_en'
);

SET @ddl := IF(
  @col_exists = 0,
  'ALTER TABLE banners ADD COLUMN title_en VARCHAR(255) NULL AFTER title',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
