-- ================================================
-- BESTARI E-Catalog - Migration: align schema with FE contract
-- ================================================
-- Aman dijalankan ulang (idempotent): pakai IF NOT EXISTS / INSERT IGNORE.
-- Menambahkan kolom untuk data yang FE butuh: gluten_free, organic, badge,
-- author artikel, kategori FAQ, dan setting QRIS/logo toko.

USE ecatalog_bestari_db;

-- ================================================
-- 1. USERS: benerin hash admin placeholder -> bcrypt asli (admin123)
--    (hash lama '$2b$10$placeholder_change_me_on_deploy' tidak valid utk bcrypt.compare)
-- ================================================
UPDATE users
SET password_hash = '$2b$10$uDUKEKl0fOjiwH1zb.nlUuJeIqpK9Rs.FIL4kscJWtrSVQEPXHU7a'
WHERE email = 'admin@bestari.id'
  AND password_hash = '$2b$10$placeholder_change_me_on_deploy';

-- ================================================
-- 2. PRODUCTS: tambah kolom FE contract
--    (MySQL 8 tidak punya ADD COLUMN IF NOT EXISTS, pakai helper)
-- ================================================
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

CALL add_col_if_missing('products', 'gluten_free', 'BOOLEAN NOT NULL DEFAULT TRUE');
CALL add_col_if_missing('products', 'organic', 'BOOLEAN NOT NULL DEFAULT TRUE');
CALL add_col_if_missing('products', 'badge', 'VARCHAR(30) NULL COMMENT ''BEST SELLER, BARU, DISKON 15%, dll''');

-- ================================================
-- 3. ARTICLES: tambah kolom penulis & waktu baca
-- ================================================
CALL add_col_if_missing('articles', 'author', 'VARCHAR(150) NULL');
CALL add_col_if_missing('articles', 'author_role', 'VARCHAR(150) NULL');
CALL add_col_if_missing('articles', 'read_time', 'VARCHAR(50) NULL');

-- ================================================
-- 4. FAQ: tambah kolom kategori/status/tags (FE contract)
-- ================================================
CALL add_col_if_missing('faq', 'category', 'VARCHAR(100) NOT NULL DEFAULT ''Lainnya''');
CALL add_col_if_missing('faq', 'status', 'ENUM(''AKTIF'',''DRAFT'') NOT NULL DEFAULT ''AKTIF''');
CALL add_col_if_missing('faq', 'tags', 'JSON NULL');
CALL add_col_if_missing('faq', 'views_count', 'INT UNSIGNED NOT NULL DEFAULT 0');
CALL add_col_if_missing('faq', 'updated_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

DROP PROCEDURE IF EXISTS add_col_if_missing;

-- ================================================
-- 5. SITE_SETTINGS: tambah key QRIS & logo toko
-- ================================================
INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
  ('store_logo',          ''),
  ('qris_image_url',      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIKWh-z2qzILYDC9woreBeFgSVM7_5bAXQw5pYZ_WwXgCifGERVX51aW8YsqJjhz82BHNB45qL6bJnxNWBWwpAxsM67_7x2OTYNFuUS0K4XILgSk6ErmPXJ-UP3WMQhaf0M_b3gWRwVKHSZ6kbqzO0x1MUI3RpV0ldxSddeaWujNrHtPTNPk0WLMpMDYC-ht49m3cEFZM04MALEK2_xXvp7VSo9wE4R95RE8g09iTX-hLm7IdsDkg'),
  ('qris_nmid',           'ID1029384756382'),
  ('qris_status',         'AKTIF');

-- ================================================
-- 6. SEED: produk dari mock FE (insert kalau tabel kosong)
--    id kategori: 1=Beras Sorgum, 2=Tepung Sorgum, 3=Camilan Sehat, 4=Pemanis Alami, 5=Paket Hemat
-- ================================================
INSERT INTO products
  (id, category_id, name, slug, description, price, stock, weight_spec, origin, is_active, is_featured, gluten_free, organic, badge)
VALUES
  (1, 1, 'Sorgum Putih Premium', 'sorgum-putih-premium',
   'Beras sorgum putih pilihan berkualitas tinggi. Bebas gluten, kaya serat, serta indeks glikemik rendah. Sangat cocok sebagai pengganti nasi putih harian Anda.',
   45000, 100, '1kg / Kemasan Vacuum', 'Yogyakarta', 1, 1, 1, 1, 'BEST SELLER'),
  (2, 2, 'Tepung Sorgum Halus', 'tepung-sorgum-halus',
   'Tepung sorgum dengan kehalusan ekstra untuk pembuatan kue, roti, cookies, dan adonan bebas gluten. Menghasilkan tekstur yang lembut dan citarasa khas yang lezat.',
   28500, 75, '500g / Gluten Free', 'Yogyakarta', 1, 1, 1, 1, NULL),
  (3, 3, 'Keripik Sorgum Gurih', 'keripik-sorgum-gurih',
   'Camilan renyah terbuat dari biji sorgum olahan dengan bumbu rempah alami Nusantara. Tanpa MSG buatan dan tanpa pengawet.',
   18000, 150, '150g / Varian Original', 'Yogyakarta', 1, 1, 1, 1, 'DISKON 15%'),
  (4, 4, 'Nira Sorgum Murni', 'nira-sorgum-murni',
   'Sirup pemanis sehat hasil ektraksi nira batang sorgum pilihan. Memiliki aroma karamel alami dengan kadar glikemik lebih rendah daripada gula pasir biasa.',
   55000, 40, '250ml / Botol Kaca', 'Yogyakarta', 1, 1, 1, 1, NULL),
  (5, 1, 'Sorgum Merah Organik', 'sorgum-merah-organik',
   'Sorgum varietas merah tinggi antioksidan dan tanin baik. Memberikan tekstur kenyal unik serta aroma earthy yang menyegarkan.',
   48000, 60, '1kg / Kemasan Pouch', 'Yogyakarta', 1, 0, 1, 1, 'BEST SELLER'),
  (6, 2, 'Tepung Sorgum Whole Grain', 'tepung-sorgum-whole-grain',
   'Tepung sorgum utuh yang digiling bersama lapisan dedak kaya nutrisi. Sangat baik untuk pembuatan roti gandum bebas gluten.',
   50000, 50, '1kg / Premium Kraft', 'Yogyakarta', 1, 0, 1, 1, NULL),
  (7, 3, 'Popcorn Sorgum Karamel', 'popcorn-sorgum-karamel',
   'Biji sorgum yang dimekarkan (popped sorghum) berlapis nira karamel manis gurih. Bebas kulit biji yang tajam, sangat aman untuk anak-anak.',
   22000, 80, '100g / Crunchy', 'Yogyakarta', 1, 0, 1, 1, 'BARU'),
  (8, 5, 'Benih Sorgum Bioguma', 'benih-sorgum-bioguma',
   'Benih sorgum unggul bersertifikat nasional dengan kemurnian varietas tinggi dan ketahanan luar biasa terhadap kekeringan.',
   35000, 200, '250g / Daya Tumbuh 90%', 'Yogyakarta', 1, 0, 1, 1, NULL)
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  name = VALUES(name),
  slug = VALUES(slug),
  description = VALUES(description),
  price = VALUES(price),
  stock = VALUES(stock),
  weight_spec = VALUES(weight_spec),
  origin = VALUES(origin),
  is_active = VALUES(is_active),
  is_featured = VALUES(is_featured),
  gluten_free = VALUES(gluten_free),
  organic = VALUES(organic),
  badge = VALUES(badge);

-- Gambar produk (primary) — pakai seed yg ada di mock FE
INSERT IGNORE INTO product_images (id, product_id, image_url, alt_text, is_primary, sort_order) VALUES
  (1, 1, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDx6V_oUnfKzyojm9uXQ7bSN6saxNNJzgrPhjyFQ8SDKkwHBRL_MjAtQ9wWncQju2t0FE095pnEc_KY0CAkXND0ZFmkKncxnCLaoz85Fx4_p818g2JXproo8RQRnDBzZALrKLSfKPiQVF-HikX7czDtanpQjjZbF7NGwy0DsKUT2yDAqx4-esjUOFhaf0e9oAZ7w7KV3MmH3BosDB1jK0DgJcYibaN7d2Vo68vjaZR_58IEQO_Zl5E', 'Sorgum Putih Premium', 1, 1),
  (2, 2, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCT58lbeofGcpFr3_TlQKMcFrDEm5paW61VIp4lUX7FNcwBpy2jGrRDI_bTV6D3xl734Ed5N_XzRUk8jGzavp71kXWzaBgTLsSzzkVUwe2PGdZn8sBoLo5SSYQjJnhDQvJx7uTfyUuRVLZ4IjCk0FxbBMTHiHxs-qlZpPMEncJD4MTDNjyRTeR97BlFxVm34Vd_a8EcGkI1-8xc4hXzhj2wFatY2JeF4DyLu7OEb8QcqWUCQCsxFQ', 'Tepung Sorgum Halus', 1, 1),
  (3, 3, 'https://lh3.googleusercontent.com/aida-public/AB6AXuChhho1BMJZZaFlDCWIDd7G4FnTpc4Uezlehk2e_4kBIoXdumL5tmhI4PP6tlBMDuK_T2uyuFAedSDM46r7OM8jRsr-vnIqz2pRxA_Nfkvbps2v8fbM6TVcQvsXyx67Fsbam2biUSykKZuM86WiAe_MgjnqhaJFQnwJJd9ds7Eixbh7KT4WaXRO_Mr_L5j1wYzHVZVsdnn6DkhepnAKoc2kMnt5ffMK5l87FTQxGeJC_1SHkdGsebA', 'Keripik Sorgum Gurih', 1, 1),
  (4, 4, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbY5z9z1K79M0ziqec1Mb7F4I2muS4Zm8NW5Uid8y_BzB3mrQsqqsN5A_477zuvUHVqUc43NKzFA6rWjjbNNggkbgYF-7qguCvh4gRN0Ifhirk8KvOENAGcp0XLZUyLiU30jAEpCPdzw8kXkkxp1Te6R0Wm-axJnAQbvjLyMVxuWrx8QMpPWj6laDHLAoXXlA22nVLFNN5bkdMT26qgatfPxE2NQn3BXxZhYQk-tGi5nk7HP85rpg', 'Nira Sorgum Murni', 1, 1),
  (5, 5, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800', 'Sorgum Merah Organik', 1, 1),
  (6, 6, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800', 'Tepung Sorgum Whole Grain', 1, 1),
  (7, 7, 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=800', 'Popcorn Sorgum Karamel', 1, 1),
  (8, 8, 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=800', 'Benih Sorgum Bioguma', 1, 1);

-- ================================================
-- 7. SEED: artikel dari mock FE (kalau tabel kosong)
-- ================================================
INSERT IGNORE INTO articles
  (id, title, slug, category, content, excerpt, image_url, is_published, published_at, author, author_role, read_time)
VALUES
  (1, 'Manfaat Sorghum untuk Diet Bebas Gluten', 'manfaat-sorghum-untuk-diet-bebas-gluten', 'Nutrisi',
   'Diet bebas gluten bukan lagi sekadar tren kesehatan, melainkan kebutuhan bagi banyak individu dengan intoleransi gluten atau penyakit celiac. Di tengah pencarian alternatif gandum yang berkelanjutan dan padat nutrisi, Sorghum muncul sebagai primadona baru di dunia kuliner modern. Biji-bijian kuno ini tidak hanya aman bagi pencernaan, tetapi juga membawa profil nutrisi yang melampaui biji-bijian konvensional lainnya.\n\nSorghum secara alami bebas gluten, menjadikannya bahan dasar yang sangat aman untuk berbagai olahan pangan. Namun, keunggulannya tidak berhenti di sana. Sorghum mengandung serat yang sangat tinggi, membantu menjaga kesehatan mikrobioma usus dan memberikan rasa kenyang lebih lama, yang sangat krusial dalam manajemen berat badan.\n\nIntegrasi sorghum ke dalam diet harian sangatlah mudah. Anda dapat menggunakan tepung sorghum sebagai pengganti tepung terigu dalam pembuatan kue, atau mengolah biji sorghum utuh layaknya nasi atau quinoa. Teksturnya yang sedikit kenyal dan rasanya yang cenderung netral dengan sentuhan nutty menjadikannya kanvas sempurna untuk berbagai bumbu masakan Indonesia.\n\nDi BESTARI, kami berdedikasi untuk menghadirkan sorghum dalam kualitas terbaik melalui proses pengolahan yang menjaga integritas nutrisinya. Dari ladang yang terawat hingga ke meja makan Anda, setiap butir sorghum kami adalah manifestasi dari komitmen terhadap kesehatan dan keberlanjutan lingkungan.',
   'Sorghum adalah alternatif biji-bijian bebas gluten yang kaya serat. Pelajari bagaimana mengintegrasikannya ke dalam pola makan harian Anda tanpa mengorbankan rasa.',
   'https://lh3.googleusercontent.com/aida-public/AB6AXuBi2ENR_93XnNmbYtIH2_fKZTLCzLu5Hzf7KwqpYvD1zJElInu2beJowvQirSxwryo8Yl7qdouBtOZ0P2_intlG3pYvjDuMzZBcRbRIMzGGNuffvJbS7t5T3qrArGBZsIKsNXo2_5alWI_F3wCEZIEWFyPhc3h4QwhM7xzTd-oBPdYlvh_weFLUDKcgneLUGCYToPzmcVISwwLQyx_REPe3H_GHTaxn7rjt_cCvXS947BwkXZYC1iGB4w',
   1, '2023-10-12 08:00:00', 'Arisanti Putri', 'Lead Product Researcher', '5 Menit Baca'),
  (2, 'Ketahanan Pangan Melalui Pertanian Lokal', 'ketahanan-pangan-melalui-pertanian-lokal', 'Budidaya',
   'Pertanian lokal memegang peranan krusial dalam menghadapi krisis iklim global. Sorghum, dengan daya tahannya yang luar biasa terhadap kekeringan dan lahan marjinal, menjadi pilar utama kedaulatan pangan di wilayah Indonesia Timur.\n\nMelalui kemitraan berkeadilan dengan para petani lokal di Flores dan Nusa Tenggara, BESTARI membina ratusan hektar lahan sorghum organik. Hasil panen yang stabil tidak hanya meningkatkan taraf hidup keluarga petani, tetapi juga menjamin ketersediaan bahan pangan bergizi tinggi secara berkelanjutan.',
   'Mengapa sorghum menjadi kunci masa depan pertanian Indonesia di tengah perubahan iklim global. Kisah dari para petani lokal binaan BESTARI.',
   'https://lh3.googleusercontent.com/aida-public/AB6AXuC-U92ef1AWrRunC_1mYdC7EQH-yNArhPFBQ6oIdXQMm5M0Jy3PMHVPA29vpLt3JyBO5kmgn07CgjPENJcM4obBHNSZSOQSHfSDhYz_HD-Sd6i_AwP3C8h82A2jtXbTuq5AelCOPEliINBXjBJBUEr34MgWC3meRH8oWhEpCKWlR87CeaTLotYRfyLjVV0r3ch2LUsQ3HpICgyg3mEa8-RDYDyqj4LkKEbWN9VN3VNwmQeaednwsXf3Hg',
   1, '2023-09-28 08:00:00', 'Ahmad Subagyo', 'Koordinator Petani Lokal', '8 Menit Baca'),
  (3, 'Inovasi Kuliner: Sorghum di Meja Makan Modern', 'inovasi-kuliner-sorghum-di-meja-makan-modern', 'Inspirasi',
   'Sorghum tidak lagi terbatas pada olahan tradisional. Di tangan para profesional kuliner, biji-bijian ini diubah menjadi berbagai hidangan modern seperti risotto sorghum, gluten-free pasta, hingga dessert lezat.\n\nFlavour profile sorghum yang subtle dan sedikit nutty memberikan dimensi rasa baru yang diminati oleh para pecinta kuliner sehat maupun restoran fine dining.',
   'Eksplorasi resep kreatif dari chef ternama yang menggunakan sorghum sebagai bintang utama dalam hidangan kontemporer yang menggugah selera.',
   'https://lh3.googleusercontent.com/aida-public/AB6AXuDM3gs3-phAENScDeuisQGmk3iMEPfRWGM1tnPsGl2GrcuKF5fcxGlXrKDXn3Jzj8Oy0TVxdi-UXpD8gOOtQtuXctoYqXdnD78Fe9NUWzgtGa-iyJOMa0yDB2NG8CejhHfba11qTzv6myxY7F3PVm7Yq-gInGnsWh_FxgsgsxvOuveJ8YU9rDEoYhTL9i1QAC9RymUi91ztAF9c0qMYE1QcIi0pbnCtdNtMdW14xgHI_vSs8iJQeNlMqA',
   1, '2023-09-15 08:00:00', 'Chef Budi Santoso', 'Culinary Specialist', '6 Menit Baca'),
  (4, 'Memahami Indeks Glikemik Rendah pada Sorghum', 'memahami-indeks-glikemik-rendah-pada-sorghum', 'Nutrisi',
   'Indeks glikemik (GI) mengukur seberapa cepat karbohidrat dalam makanan meningkatkan kadar gula darah. Sorghum memiliki indeks glikemik tergolong rendah, sehingga dicerna secara perlahan dan melepaskan glukosa secara bertahap.\n\nHal ini menjadikan sorghum pilihan pangan ideal bagi individu yang mengelola diabetes melitus tipe 2 atau sedang menjalani program pemeliharaan berat badan ideal.',
   'Penjelasan ilmiah mengenai mengapa sorghum sangat direkomendasikan bagi penderita diabetes dan mereka yang menjaga kadar gula darah.',
   'https://lh3.googleusercontent.com/aida-public/AB6AXuAh5o959jhbN3WAEQeFnpCBu3rXVlovo0i8uV_YZMoQSMfZrXwc6MNO1aoPP4RKAm1IPaxknmQagSnVSs5r_pO_bHrgnV3KYfCIQoeq0eHUye1GYQshy9xQa34RpNFex9deQAMHct3qs_d4vvkBT7HIIeMl08ueRRmNuJvgIkd_zy0yfGbBH5fy70xa_9JhRAm8M4tgEIGHCUGXKo5bf-_pY-h8dV94RLm808QVTcuDEM42TqGWdiXsKA',
   1, '2023-09-02 08:00:00', 'Dr. Rina Wati', 'M.Gizi, Konsultan Nutrisi', '4 Menit Baca'),
  (5, 'Sorghum: Jejak Sejarah yang Terlupakan', 'sorghum-jejak-sejarah-yang-terlupakan', 'Budidaya',
   'Sebelum maraknya dominasi beras di abad ke-20, sorghum atau cantel merupakan salah satu makanan pokok penting di banyak wilayah kering di Nusantara. Relief di candi Borobudur bahkan menggambarkan tanaman sorgum sebagai bagian dari kekayaan flora Nusantara.\n\nKini, revitalisasi sorghum membuka lembaran baru sejarah keanekaragaman pangan Indonesia.',
   'Menelusuri sejarah sorghum di nusantara, dari tanaman pangan utama hingga posisinya yang mulai kembali diperhitungkan dalam ekonomi modern.',
   'https://lh3.googleusercontent.com/aida-public/AB6AXuB-5o9-XbQB38iqcCd5H7EzCbzBfIXEGXP06KKUq3h-Gr8wFzU4lS6kPoD5FGvrwAwrUe1riwP-DHEb8-Lytp58igCD6Nme-MOBtRMKiflVcvT6_d_oLlZfdX6Cx-kK7gOQillh1EubxF8O-9Vcq9236psgOUQp5lFhzYq-RIyb6M83Gylh0DKFCxRr-ckFrLjWu5Y5ALJvCLzdPfnVqBkD2JW513WVDAObk-9QggWi9fx2Gss4MXvoxA',
   1, '2023-08-20 08:00:00', 'Tim Sejarah Bestari', 'Peneliti Pangan Nusantara', '10 Menit Baca'),
  (6, 'Masa Depan Berkelanjutan dengan BESTARI', 'masa-depan-berkelanjutan-dengan-bestari', 'Inspirasi',
   'Inovasi pangan berkelanjutan adalah jantung dari pengembagan produk BESTARI. Dengan meminimalkan jejak karbon melalui rantai pasok lokal dan kemasan ramah lingkungan, kami memastikan setiap produk memberikan dampak positif bagi alam dan kesehatan.',
   'Bagaimana visi BESTARI dalam menciptakan ekosistem pangan yang tidak hanya sehat bagi konsumen, tetapi juga ramah bagi bumi.',
   'https://lh3.googleusercontent.com/aida-public/AB6AXuD-9bJk2rqAziBbwuSlpCqsuLtRlnjmXr2kQNqbuxPxap-mpe-kwRkZ4geiGi0QAmDUaSuftNPX6faSuVhUmx6M1Iyynf-lIJkbJ7uTAMgJ1HF0hwOyfP9NuI4AfjIvCa-708ejAAUmGkRHqIUgfcYZKMmzyXhz2XBDCktAwsaE2uKP1n96Uce_RjwklTkI2PMzkEvvy3OXDHE7cm8AqXKKNLJvcHQY6Bv-lENnifdjN7m7hWK2Q_ojGA',
   1, '2023-08-05 08:00:00', 'Redaksi Bestari', 'Tim Keberlanjutan', '7 Menit Baca');

-- ================================================
-- 8. SEED: FAQ dari mock FE (kalau tabel kosong)
-- ================================================
INSERT IGNORE INTO faq (id, question, answer, sort_order, category, status, tags, views_count)
VALUES
  (1, 'Apakah semua produk Bestari 100% Bebas Gluten (Gluten-Free)?',
   'Ya, seluruh produk Bestari diolah di fasilitas terpisah yang khusus menangani biji-bijian bebas gluten untuk menjamin tidak ada kontaminasi silang gandum.',
   1, 'Tentang Produk', 'AKTIF', JSON_ARRAY('gluten-free','keamanan','organik'), 1240),
  (2, 'Bagaimana cara menyimpan tepung dan beras sorgum agar tahan lama?',
   'Simpan produk dalam wadah kedap udara di tempat yang sejuk, kering, dan terhindar dari sinar matahari langsung. Untuk daya simpan maksimal hingga 12 bulan, Anda dapat menyimpannya di dalam kulkas.',
   2, 'Tentang Produk', 'AKTIF', JSON_ARRAY('penyimpanan','daya simpan','kulkas'), 980),
  (3, 'Apa perbedaan beras sorgum putih dan sorgum hitam?',
   'Sorgum putih memiliki rasa yang cenderung lembut dan netral, sangat cocok untuk konsumsi harian pengganti beras putih. Sorgum hitam memiliki rasa lebih umami/rich, serat lebih tinggi, serta kaya antioksidan antosianin alami.',
   3, 'Tentang Produk', 'AKTIF', JSON_ARRAY('sorgum putih','sorgum hitam','nutrisi'), 1510),
  (4, 'Metode pembayaran apa saja yang diterima di toko Bestari?',
   'Kami menerima berbagai metode pembayaran instan dan aman, meliputi Transfer Bank (BCA, Mandiri, BRI, BNI), QRIS, E-Wallet (GoPay, OVO, ShopeePay), serta sistem COD (Bayar di Tempat).',
   4, 'Pemesanan & Pembayaran', 'AKTIF', JSON_ARRAY('pembayaran','qris','cod','e-wallet'), 890),
  (5, 'Apakah ada minimal pembelian untuk promo gratis ongkir?',
   'Ya, minimal pembelian sebesar Rp 150.000 berhak mendapatkan voucher subsidi ongkos kirim hingga Rp 20.000 ke seluruh kota di Indonesia.',
   5, 'Pemesanan & Pembayaran', 'AKTIF', JSON_ARRAY('promo','gratis ongkir','voucher'), 2100),
  (6, 'Berapa lama estimasi pengiriman pesanan sampai ke tujuan?',
   'Estimasi pengiriman untuk wilayah Jabodetabek dan Jawa Barat adalah 1-2 hari kerja. Untuk wilayah Pulau Jawa lainnya 2-3 hari kerja, dan luar Pulau Jawa berkisar 3-7 hari kerja tergantung opsi kurir ekpedisi.',
   6, 'Pengiriman', 'AKTIF', JSON_ARRAY('estimasi','ekspedisi','kurir'), 1750),
  (7, 'Bagaimana jika kemasan produk mengalami kerusakan saat diterima?',
   'Seluruh produk dikemas menggunakan corrugated box tebal dan bubble wrap. Namun jika terdapat kendala kerusakan, silakan foto/video unboxing dan hubungi Tim CS via WhatsApp dalam 2x24 jam untuk pengiriman ulang gratis.',
   7, 'Pengiriman', 'AKTIF', JSON_ARRAY('garansi','retur','unboxing'), 620);
