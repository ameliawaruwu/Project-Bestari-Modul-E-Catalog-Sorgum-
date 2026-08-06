-- 014_user_soft_delete.sql
-- SOFT DELETE user: tambah kolom is_deleted (bukan hapus baris).
-- Sebelumnya admin DELETE users → baris hilang permanen (data order/alamat user ikut yatim).
-- Sekarang: nonaktifkan via UPDATE is_deleted=1; login user ini ditolak.

DROP PROCEDURE IF EXISTS add_col_if_missing;
DELIMITER //
CREATE PROCEDURE add_col_if_missing(
  IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl VARCHAR(255)
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

CALL add_col_if_missing('users', 'is_deleted', 'TINYINT(1) NOT NULL DEFAULT 0');

DROP PROCEDURE IF EXISTS add_col_if_missing;
