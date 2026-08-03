-- ================================================
-- BESTARI E-Catalog - Initial Database Schema
-- ================================================

CREATE DATABASE IF NOT EXISTS ecatalog_bestari_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ecatalog_bestari_db;

-- ================================================
-- 1. USERS
-- ================================================
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150)  NOT NULL,
  email         VARCHAR(200)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  phone         VARCHAR(20)   NULL,
  gender        ENUM('laki-laki','perempuan') NULL,
  birth_date    DATE          NULL,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- ================================================
-- 2. USER ADDRESSES
-- ================================================
CREATE TABLE user_addresses (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  label          VARCHAR(100) NOT NULL DEFAULT 'Rumah',
  recipient_name VARCHAR(150) NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  address_line   TEXT         NOT NULL,
  city           VARCHAR(150) NOT NULL,
  province       VARCHAR(150) NOT NULL,
  postal_code    VARCHAR(10)  NOT NULL,
  is_primary     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_addresses_user (user_id)
) ENGINE=InnoDB;

-- ================================================
-- 3. CATEGORIES
-- ================================================
CREATE TABLE categories (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(120) NOT NULL UNIQUE,
  image_url  TEXT         NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ================================================
-- 4. PRODUCTS
-- ================================================
CREATE TABLE products (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id  INT UNSIGNED NOT NULL,
  name         VARCHAR(200) NOT NULL,
  slug         VARCHAR(220) NOT NULL UNIQUE,
  description  TEXT         NULL,
  price        INT UNSIGNED NOT NULL,
  stock        INT UNSIGNED NOT NULL DEFAULT 0,
  weight_spec  VARCHAR(100) NULL COMMENT 'contoh: 1kg, 500g / Vacuum Packed',
  origin       VARCHAR(200) NULL COMMENT 'contoh: Flores, NTT',
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  is_featured  BOOLEAN      NOT NULL DEFAULT FALSE COMMENT 'tampil di beranda',
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_products_category (category_id),
  INDEX idx_products_active (is_active),
  INDEX idx_products_slug (slug),
  INDEX idx_products_price (price),
  FULLTEXT INDEX idx_products_search (name, description)
) ENGINE=InnoDB;

-- ================================================
-- 5. PRODUCT IMAGES
-- ================================================
CREATE TABLE product_images (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  image_url  TEXT         NOT NULL,
  alt_text   VARCHAR(300) NULL,
  is_primary BOOLEAN      NOT NULL DEFAULT FALSE,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_images_product (product_id)
) ENGINE=InnoDB;

-- ================================================
-- 6. CART ITEMS (guest = pakai session_id, user = pakai user_id)
-- ================================================
CREATE TABLE cart_items (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NULL,
  session_id VARCHAR(100) NULL COMMENT 'untuk guest user tanpa login',
  product_id INT UNSIGNED NOT NULL,
  quantity   INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_cart_user (user_id),
  INDEX idx_cart_session (session_id)
) ENGINE=InnoDB;

-- ================================================
-- 7. ORDERS
-- ================================================
CREATE TABLE orders (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number     VARCHAR(20)   NOT NULL UNIQUE COMMENT 'contoh: BST-99234',
  user_id          INT UNSIGNED NULL,
  customer_name    VARCHAR(150)  NOT NULL,
  customer_email   VARCHAR(200)  NULL,
  customer_phone   VARCHAR(20)   NOT NULL,
  shipping_address JSON          NOT NULL COMMENT '{label,recipient_name,phone,address_line,city,province,postal_code}',
  notes            TEXT          NULL,
  subtotal         INT UNSIGNED  NOT NULL,
  shipping_cost    INT UNSIGNED  NOT NULL DEFAULT 0,
  total            INT UNSIGNED  NOT NULL,
  payment_method   ENUM('cod','qris') NOT NULL,
  payment_status   ENUM('unpaid','paid','confirmed') NOT NULL DEFAULT 'unpaid',
  order_status     ENUM('pending','confirmed','processed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',

  -- tracking
  courier          VARCHAR(30)   NULL COMMENT 'JNE, J&T, SiCepat, AnterAja, dll',
  tracking_number  VARCHAR(50)   NULL,
  shipped_at       DATETIME      NULL,

  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (order_status),
  INDEX idx_orders_tracking (tracking_number),
  INDEX idx_orders_created (created_at)
) ENGINE=InnoDB;

-- ================================================
-- 8. ORDER ITEMS (snapshot harga saat order)
-- ================================================
CREATE TABLE order_items (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id     INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NULL COMMENT 'NULL kalau produk udah dihapus',
  product_name VARCHAR(200) NOT NULL,
  price        INT UNSIGNED NOT NULL,
  quantity     INT UNSIGNED NOT NULL DEFAULT 1,
  subtotal     INT UNSIGNED NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_orderitems_order (order_id)
) ENGINE=InnoDB;

-- ================================================
-- 9. BANNERS (hero slides di beranda)
-- ================================================
CREATE TABLE banners (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  image_url   TEXT         NOT NULL,
  target_type ENUM('product','info','store','external') NOT NULL DEFAULT 'store',
  target_link VARCHAR(500) NULL,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_banners_active (is_active)
) ENGINE=InnoDB;

-- ================================================
-- 10. ARTICLES (blog / tips / resep)
-- ================================================
CREATE TABLE articles (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(250) NOT NULL,
  slug         VARCHAR(270) NOT NULL UNIQUE,
  category     VARCHAR(100) NOT NULL COMMENT 'Resep Sehat, Cerita Petani, Nutrisi, dll',
  content      LONGTEXT     NOT NULL,
  excerpt      TEXT         NULL,
  image_url    TEXT         NULL,
  is_published BOOLEAN      NOT NULL DEFAULT FALSE,
  published_at DATETIME     NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_articles_slug (slug),
  INDEX idx_articles_published (is_published, published_at)
) ENGINE=InnoDB;

-- ================================================
-- 11. FAQ
-- ================================================
CREATE TABLE faq (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question   TEXT      NOT NULL,
  answer     TEXT      NOT NULL,
  sort_order INT       NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ================================================
-- 12. SITE SETTINGS (key-value config)
-- ================================================
CREATE TABLE site_settings (
  setting_key   VARCHAR(100) PRIMARY KEY,
  setting_value TEXT         NOT NULL,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ================================================
-- 13. TRACKING LOGS (cache hasil cek-resi)
-- ================================================
CREATE TABLE tracking_logs (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id        INT UNSIGNED NOT NULL,
  courier         VARCHAR(30)  NOT NULL COMMENT 'ekspedisi yg diinput admin',
  tracking_number VARCHAR(50)  NOT NULL,
  expedisi        VARCHAR(100) NULL COMMENT 'nama ekspedisi dari response',
  resi_is_valid   BOOLEAN      NOT NULL DEFAULT TRUE,
  resi_status     VARCHAR(50)  NULL COMMENT 'status dari kurir: Delivered, In Transit, dll',
  pengirim        VARCHAR(200) NULL,
  tujuan          VARCHAR(200) NULL,
  tanggal_kirim   VARCHAR(30)  NULL,
  penerima        VARCHAR(300) NULL COMMENT 'info penerima / last position',
  raw_json        JSON         NULL COMMENT 'full response JSON',
  checked_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_tlog_order (order_id),
  INDEX idx_tlog_number (tracking_number),
  INDEX idx_tlog_checked (checked_at)
) ENGINE=InnoDB;

-- ================================================
-- 14. TRACKING HISTORY (perjalanan paket per checkpoint)
-- ================================================
CREATE TABLE tracking_history (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id        INT UNSIGNED NOT NULL,
  tracking_number VARCHAR(50)  NOT NULL,
  event_date      VARCHAR(30)  NOT NULL COMMENT '"17-01-2025 16:26"',
  description     TEXT         NOT NULL COMMENT '"SHIPMENT RECEIVED BY JNE..."',
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_thist_order (order_id),
  INDEX idx_thist_tracking (tracking_number)
) ENGINE=InnoDB;

-- ================================================
-- DEFAULT DATA
-- ================================================

-- Kategori
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Beras Sorgum',  'beras-sorgum',  1),
  ('Tepung Sorgum', 'tepung-sorgum', 2),
  ('Camilan Sehat', 'camilan-sehat', 3),
  ('Pemanis Alami', 'pemanis-alami', 4),
  ('Paket Hemat',   'paket-hemat',   5);

-- Admin default (password: admin123 — HASH HARUS DIGANTI SAAT DEPLOY!)
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin Utama', 'admin@bestari.id', '$2b$10$placeholder_change_me_on_deploy', 'admin');

-- Site settings default
INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('store_name',        'BESTARI Sorghum'),
  ('whatsapp_number',   '6281234567890'),
  ('store_email',       'halo@bestari.id'),
  ('store_address',     'Yogyakarta, Indonesia'),
  ('shipping_cost',     '15000'),
  ('business_hours',    'Senin - Jumat, 09:00 - 18:00 WIB'),
  ('order_number_prefix','BST-');
