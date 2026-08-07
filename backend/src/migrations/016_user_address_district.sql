-- 016_user_address_district.sql
-- KECAMATAN (district) di user_addresses: tambah kolom district.
-- Sebelumnya alamat profil tidak punya kecamatan terpisah (hanya address_line + kota).
-- Sekarang: district VARCHAR(150) NULL — optional, alamat lama tetap valid.

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

CALL add_col_if_missing('user_addresses', 'district', "VARCHAR(150) NULL DEFAULT NULL");

DROP PROCEDURE IF EXISTS add_col_if_missing;
