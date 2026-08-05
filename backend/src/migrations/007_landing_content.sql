-- ================================================
-- 007. LANDING CONTENT: tabel key-value utk konten beranda
--      (hero, story, benefits, featured) — pindah dari localStorage
--      ke DB supaya bisa dikelola admin & permanen.
-- ================================================

CREATE TABLE IF NOT EXISTS landing_content (
  `key`      VARCHAR(80)  NOT NULL PRIMARY KEY,
  `value`    TEXT         NULL,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed dengan nilai default (sama dengan DEFAULT_LANDING_CONTENT di FE).
INSERT INTO landing_content (`key`, `value`) VALUES
('heroTitleId', 'Kemurnian Alam dalam Tiap Butir Sorgum Pilihan'),
('heroTitleEn', 'Purity of Nature in Every Grain of Selected Sorghum'),
('heroDescId', 'Temukan beras sorgum organik, tepung bebas gluten, dan camilan sehat — ditanam dengan cinta oleh petani mitra kami di tanah Nusantara.'),
('heroDescEn', 'Discover organic sorghum rice, gluten-free flour, and healthy snacks — grown with love by our partner farmers across the archipelago.'),
('heroBtnId', 'Belanja Sekarang'),
('heroBtnEn', 'Shop Now'),
('storyTaglineId', 'Kisah Kami'),
('storyTaglineEn', 'Our Story'),
('storyTitleId', 'Dari Ladang Sorgum ke Meja Makan Anda'),
('storyTitleEn', 'From Sorghum Fields to Your Dining Table'),
('storyDesc1Id', 'BESTARI hadir untuk memperkenalkan sorgum sebagai pangan lokal yang sehat, bergizi, dan ramah lingkungan.'),
('storyDesc1En', 'BESTARI is here to introduce sorghum as a healthy, nutritious, and eco-friendly local food.'),
('storyDesc2Id', 'Bersama petani mitra, kami memastikan setiap butir sorgum dipanen pada waktu terbaik dan diolah dengan standar kualitas tinggi.'),
('storyDesc2En', 'Together with partner farmers, we ensure every grain of sorghum is harvested at its best time and processed to high quality standards.'),
('storyImageUrl', ''),
('benefitsTitleId', 'Kenapa Memilih Bestari?'),
('benefitsTitleEn', 'Why Choose Bestari?'),
('benefitsDescId', 'Kami berkomitmen menghadirkan produk pangan berkelanjutan yang sehat bagi tubuh dan ramah bagi bumi.'),
('benefitsDescEn', 'We are committed to delivering sustainable food products that are healthy for the body and friendly to the planet.'),
('benefit1TitleId', 'Bebas Gluten'),
('benefit1TitleEn', 'Gluten Free'),
('benefit1DescId', 'Alternatif gandum yang aman bagi penderita celiac dan mereka yang menjalani diet bebas gluten.'),
('benefit1DescEn', 'A safe alternative to wheat for celiac disease and those on a gluten-free diet.'),
('benefit1Icon', 'eco'),
('benefit2TitleId', '100% Organik Lokal'),
('benefit2TitleEn', '100% Organic & Local'),
('benefit2DescId', 'Ditanam secara alami tanpa pestisida kimia oleh petani mitra kami di tanah Nusantara.'),
('benefit2DescEn', 'Grown naturally without chemical pesticides by our partner farmers across the archipelago.'),
('benefit2Icon', 'verified'),
('benefit3TitleId', 'Berdampak Sosial'),
('benefit3TitleEn', 'Social Impact'),
('benefit3DescId', 'Setiap pembelian Anda mendukung kesejahteraan komunitas petani sorgum di pelosok daerah.'),
('benefit3DescEn', 'Your purchase supports the welfare of sorghum farming communities in remote regions.'),
('benefit3Icon', 'groups'),
('featuredTitleId', 'Koleksi Produk Pilihan'),
('featuredTitleEn', 'Featured Product Collection'),
('featuredDescId', 'Temukan berbagai olahan sorgum organik berkualitas tinggi, mulai dari beras sehat, tepung serbaguna, hingga camilan bergizi'),
('featuredDescEn', 'Discover a variety of high-quality organic sorghum products, ranging from healthy rice, all-purpose flour, to nutritious snacks.')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = CURRENT_TIMESTAMP;
