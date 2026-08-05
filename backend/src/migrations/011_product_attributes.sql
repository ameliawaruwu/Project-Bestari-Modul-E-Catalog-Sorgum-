-- Migration 011: attributes (text bebas) menggantikan checkbox gluten_free/organic di form
-- Kolom baru attributes VARCHAR(200) NULL — admin isi bebas, misal "Gluten-Free, Organik"
-- Kolom lama gluten_free & organic dipertahankan untuk kompatibilitas data lama (default 1)
ALTER TABLE products
  ADD COLUMN attributes VARCHAR(200) NULL AFTER shelf_life;
