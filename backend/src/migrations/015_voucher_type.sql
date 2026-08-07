-- 015_voucher_type.sql
-- VOUCHER TYPE: tambah kolom type (fixed rupiah / percent persen).
-- Sebelumnya voucher hanya diskon rupiah (discount_amount).
-- Sekarang: type='fixed' → discount_amount = nominal Rp;
--           type='percent' → discount_amount = persen (0-100), diskon = % × subtotal.
-- Kolom type default 'fixed' supaya voucher lama tetap berlaku (backward compatible).

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

CALL add_col_if_missing('vouchers', 'type', "ENUM('fixed','percent') NOT NULL DEFAULT 'fixed'");

DROP PROCEDURE IF EXISTS add_col_if_missing;
