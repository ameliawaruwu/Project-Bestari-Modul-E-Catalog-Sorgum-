/**
 * Default konten landing page — data UI saja (disimpan di localStorage,
 * TIDAK pernah dikirim ke backend). Dipakai agar beranda tidak kosong saat
 * localStorage belum terisi (hero, "Kisah Kami", benefits, featured).
 */
export interface LandingContent {
  heroTitleId: string;
  heroTitleEn: string;
  heroDescId: string;
  heroDescEn: string;
  heroBtnId: string;
  heroBtnEn: string;
  storyTaglineId: string;
  storyTaglineEn: string;
  storyTitleId: string;
  storyTitleEn: string;
  storyDesc1Id: string;
  storyDesc1En: string;
  storyDesc2Id: string;
  storyDesc2En: string;
  storyImageUrl: string;
  benefitsTitleId: string;
  benefitsTitleEn: string;
  benefitsDescId: string;
  benefitsDescEn: string;
  benefit1TitleId: string;
  benefit1TitleEn: string;
  benefit1DescId: string;
  benefit1DescEn: string;
  benefit1Icon: string;
  benefit2TitleId: string;
  benefit2TitleEn: string;
  benefit2DescId: string;
  benefit2DescEn: string;
  benefit2Icon: string;
  benefit3TitleId: string;
  benefit3TitleEn: string;
  benefit3DescId: string;
  benefit3DescEn: string;
  benefit3Icon: string;
  featuredTitleId: string;
  featuredTitleEn: string;
  featuredDescId: string;
  featuredDescEn: string;
  featuredProductIds: string;
}

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  heroTitleId: 'Sorgum Pilihan Terbaik untuk Hidup Sehat',
  heroTitleEn: 'Premium Sorghum for a Healthier Life',
  heroDescId: 'Temukan produk olahan sorgum berkualitas tinggi dari petani Indonesia untuk keluarga Anda.',
  heroDescEn: 'Discover high-quality sorghum products from Indonesian farmers for your family.',
  heroBtnId: 'Belanja Sekarang',
  heroBtnEn: 'Shop Now',
  storyTaglineId: 'Kisah Kami',
  storyTaglineEn: 'Our Story',
  storyTitleId: 'Dari Lahan Petani ke Meja Anda',
  storyTitleEn: 'From Farm to Your Table',
  storyDesc1Id: 'SORGUM hadir untuk menghidupkan kembali sorgum, biji-bijian kaya nutrisi yang menjadi warisan pangan Nusantara.',
  storyDesc1En: 'SORGUM brings back sorghum, a nutrient-rich grain that is part of Indonesia heritage.',
  storyDesc2Id: 'Kami bekerja langsung dengan petani lokal untuk menghadirkan produk berkualitas dan berkelanjutan.',
  storyDesc2En: 'We work directly with local farmers to deliver quality, sustainable products.',
  storyImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  benefitsTitleId: 'Mengapa Memilih SORGUM?',
  benefitsTitleEn: 'Why Choose SORGUM?',
  benefitsDescId: 'Produk sorgum berkualitas tinggi yang baik untuk Anda dan lingkungan.',
  benefitsDescEn: 'High-quality sorghum products, good for you and the environment.',
  benefit1TitleId: '100% Alami',
  benefit1TitleEn: '100% Natural',
  benefit1DescId: 'Sorgum ditanam tanpa bahan kimia berbahaya.',
  benefit1DescEn: 'Sorghum grown without harmful chemicals.',
  benefit1Icon: 'eco',
  benefit2TitleId: 'Kaya Nutrisi',
  benefit2TitleEn: 'Nutrient Rich',
  benefit2DescId: 'Bebas gluten, tinggi serat, dan kaya antioksidan.',
  benefit2DescEn: 'Gluten-free, high in fiber, rich in antioxidants.',
  benefit2Icon: 'verified',
  benefit3TitleId: 'Mendukung Petani Lokal',
  benefit3TitleEn: 'Support Local Farmers',
  benefit3DescId: 'Setiap pembelian membantu kesejahteraan petani nusantara.',
  benefit3DescEn: 'Every purchase supports Indonesian farmers livelihoods.',
  benefit3Icon: 'groups',
  featuredTitleId: 'Produk Pilihan',
  featuredTitleEn: 'Featured Products',
  featuredDescId: 'Jelajahi produk sorgum terbaik pilihan kami.',
  featuredDescEn: 'Explore our best-selected sorghum products.',
  featuredProductIds: '',
};
