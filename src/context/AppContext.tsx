import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Article, FaqItem, CartItem, User, Order, LoginPayload, RegisterPayload, AuthResponse } from '../types';
import { BannerSlide } from '../types/admin';

export interface ShopSettings {
  storeName: string;
  logoUrl: string;
  qrisImageUrl: string;
  qrisNmid: string;
  whatsappNumber: string;
  qrisStatus: 'AKTIF' | 'NONAKTIF';
  faviconUrl?: string;
  storeAddress?: string;
  storeEmail?: string;
}

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
}

type Language = 'id' | 'en';
type Theme = 'light' | 'dark';

interface AppContextProps {
  language: Language;
  theme: Theme;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  t: (idText: string, enText: string) => string;

  // Products
  products: Product[];
  saveProduct: (productData: any) => void;
  deleteProduct: (id: string) => void;

  // FAQs
  faqs: FaqItem[];
  saveFaq: (faqData: any) => Promise<void>;
  deleteFaq: (id: string) => Promise<void>;
  toggleFaqStatus: (id: string) => Promise<void>;
  reorderFaq: (id: string, direction: 'UP' | 'DOWN') => Promise<void>;

  // Articles / Information
  articles: Article[];
  saveArticle: (articleData: any) => void;
  deleteArticle: (id: string) => void;

  // Banners
  banners: BannerSlide[];
  saveBanner: (bannerData: { id?: string; title: string; targetLink: string; image: string }) => void;
  deleteBanner: (id: string) => void;
  toggleBanner: (id: string) => void;

  // Shop Settings
  shopSettings: ShopSettings;
  saveShopSettings: (settings: Partial<ShopSettings>) => void;

  // Landing Page Content
  landingContent: LandingContent;
  saveLandingContent: (content: LandingContent) => void;

  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  deleteOrder: (id: string) => void;

  // Auth
  currentUser: User | null;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  removeCartItem: (productId: string) => void;
  clearCart: () => void;
  appliedDiscount: number;
  setAppliedDiscount: (val: number) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Initial default data definitions
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Sorgum Putih Premium',
    category: 'beras',
    categoryLabel: 'Beras Sorgum',
    price: 45000,
    formattedPrice: 'IDR 45.000',
    unitInfo: '1kg / Kemasan Vacuum',
    weight: '1kg',
    badge: 'BEST SELLER',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDx6V_oUnfKzyojm9uXQ7bSN6saxNNJzgrPhjyFQ8SDKkwHBRL_MjAtQ9wWncQju2t0FE095pnEc_KY0CAkXND0ZFmkKncxnCLaoz85Fx4_p818g2JXproo8RQRnDBzZALrKLSfKPiQVF-HikX7czDtanpQjjZbF7NGwy0DsKUT2yDAqx4-esjUOFhaf0e9oAZ7w7KV3MmH3BosDB1jK0DgJcYibaN7d2Vo68vjaZR_58IEQO_Zl5E',
    description: 'Beras sorgum putih pilihan berkualitas tinggi. Bebas gluten, kaya serat, serta indeks glikemik rendah. Sangat cocok sebagai pengganti nasi putih harian Anda.',
    glutenFree: true,
    organic: true,
    specification: 'Kadar air <14%, Kemurnian 99%, Kemasan Vacuum Food Grade, Bebas Gluten, Organik.',
    shippingInfo: 'Dikirim dari Yogyakarta. Diproses di hari yang sama jika dipesan sebelum pukul 15:00 WIB.',
  },
  {
    id: 'prod-2',
    name: 'Tepung Sorgum Halus',
    category: 'tepung',
    categoryLabel: 'Tepung Sorgum',
    price: 28500,
    formattedPrice: 'IDR 28.500',
    unitInfo: '500g / Gluten Free',
    weight: '500g',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCT58lbeofGcpFr3_TlQKMcFrDEm5paW61VIp4lUX7FNcwBpy2jGrRDI_bTV6D3xl734Ed5N_XzRUk8jGzavp71kXWzaBgTLsSzzkVUwe2PGdZn8sBoLo5SSYQjJnhDQvJx7uTfyUuRVLZ4IjCk0FxbBMTHiHxs-qlZpPMEncJD4MTDNjyRTeR97BlFxVm34Vd_a8EcGkI1-8xc4hXzhj2wFatY2JeF4DyLu7OEb8QcqWUCQCsxFQ',
    description: 'Tepung sorgum dengan kehalusan ekstra untuk pembuatan kue, roti, cookies, dan adonan bebas gluten. Menghasilkan tekstur yang lembut dan citarasa khas yang lezat.',
    glutenFree: true,
    organic: true,
    specification: 'Kehalusan Mesh 100, 100% Sorghum Putih Murni, Tanpa Pengawet, Masa Simpan 12 Bulan.',
    shippingInfo: 'Dikirim dari Yogyakarta. Bubble wrap & kardus gratis untuk pengiriman aman.',
  },
  {
    id: 'prod-3',
    name: 'Keripik Sorgum Gurih',
    category: 'camilan',
    categoryLabel: 'Camilan Sehat',
    price: 18000,
    formattedPrice: 'IDR 18.000',
    unitInfo: '150g / Varian Original',
    weight: '150g',
    badge: 'DISKON 15%',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChhho1BMJZZaFlDCWIDd7G4FnTpc4Uezlehk2e_4kBIoXdumL5tmhI4PP6tlBMDuK_T2uyuFAedSDM46r7OM8jRsr-vnIqz2pRxA_Nfkvbps2v8fbM6TVcQvsXyx67Fsbam2biUSykKZuM86WiAe_MgjnqhaJFQnwJJd9ds7Eixbh7KT4WaXRO_Mr_L5j1wYzHVZVsdnn6DkhepnAKoc2kMnt5ffMK5l87FTQxGeJC_1SHkdGsebA',
    description: 'Camilan renyah terbuat dari biji sorgum olahan dengan bumbu rempah alami Nusantara. Tanpa MSG buatan dan tanpa pengawet.',
    glutenFree: true,
    organic: true,
    specification: 'Berat bersih 150g, Menggunakan Minyak Kelapa Sehat, Tanpa Pewarna Sintetis.',
    shippingInfo: 'Dikirim dari Yogyakarta. Pengiriman setiap hari kerja (Senin - Sabtu).',
  },
  {
    id: 'prod-4',
    name: 'Nira Sorgum Murni',
    category: 'pemanis',
    categoryLabel: 'Pemanis Alami',
    price: 55000,
    formattedPrice: 'IDR 55.000',
    unitInfo: '250ml / Botol Kaca',
    weight: '250ml',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbY5z9z1K79M0ziqec1Mb7F4I2muS4Zm8NW5Uid8y_BzB3mrQsqqsN5A_477zuvUHVqUc43NKzFA6rWjjbNNggkbgYF-7qguCvh4gRN0Ifhirk8KvOENAGcp0XLZUyLiU30jAEpCPdzw8kXkkxp1Te6R0Wm-axJnAQbvjLyMVxuWrx8QMpPWj6laDHLAoXXlA22nVLFNN5bkdMT26qgatfPxE2NQn3BXxZhYQk-tGi5nk7HP85rpg',
    description: 'Sirup pemanis sehat hasil ektraksi nira batang sorgum pilihan. Memiliki aroma karamel alami dengan kadar glikemik lebih rendah daripada gula pasir biasa.',
    glutenFree: true,
    organic: true,
    specification: 'Volume 250ml, Botol Kaca Steril, 100% Konsentrat Nira Sorgum Murni.',
    shippingInfo: 'Dikirim dari Yogyakarta. Dikemas khusus menggunakan bubble wrap tebal (bergaransi pfecah).',
  },
  {
    id: 'prod-5',
    name: 'Sorgum Merah Organik',
    category: 'beras',
    categoryLabel: 'Beras Sorgum',
    price: 48000,
    formattedPrice: 'IDR 48.000',
    unitInfo: '1kg / Kemasan Pouch',
    weight: '1kg',
    badge: 'BEST SELLER',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800',
    description: 'Sorgum varietas merah tinggi antioksidan dan tanin baik. Memberikan tekstur kenyal unik serta aroma earthy yang menyegarkan.',
    glutenFree: true,
    organic: true,
    specification: 'Biji Sorghum Merah Pilihan, Serat Tinggi, Kemasan Pouch Zipper Stand-up.',
    shippingInfo: 'Dikirim dari Yogyakarta. Menggunakan kurir reguler/kargo dengan aman.',
  },
  {
    id: 'prod-6',
    name: 'Benih Sorgum Bioguma',
    category: 'benih',
    categoryLabel: 'Benih',
    price: 35000,
    formattedPrice: 'IDR 35.000',
    unitInfo: '250g / Daya Tumbuh 90%',
    weight: '250g',
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&q=80&w=800',
    description: 'Benih sorgum unggul bersertifikat nasional dengan kemurnian varietas tinggi dan ketahanan luar biasa terhadap kekeringan.',
    glutenFree: true,
    organic: true,
    specification: 'Daya Kecambah >90%, Kemurnian Fisik 98%, Kadar Air <12%, Isi Bersih 250g.',
    shippingInfo: 'Dikirim dari Yogyakarta. Pengiriman siap kirim ke seluruh wilayah Indonesia.',
  },
  {
    id: 'prod-7',
    name: 'Popcorn Sorgum Karamel',
    category: 'camilan',
    categoryLabel: 'Camilan Sehat',
    price: 22000,
    formattedPrice: 'IDR 22.000',
    unitInfo: '100g / Crunchy',
    weight: '100g',
    badge: 'BARU',
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=800',
    description: 'Biji sorgum yang dimekarkan (popped sorghum) berlapis nira karamel manis gurih. Bebas kulit biji yang tajam, sangat aman untuk anak-anak.',
    glutenFree: true,
    organic: true,
    specification: 'Berat bersih 100g, Bebas Trans-Fat, Lapisan Karamel Nira Asli.',
    shippingInfo: 'Dikirim dari Yogyakarta. Pengemasan rapi dan aman dengan bubble wrap.',
  },
  {
    id: 'prod-8',
    name: 'Tepung Sorgum Whole Grain',
    category: 'tepung',
    categoryLabel: 'Tepung Sorgum',
    price: 50000,
    formattedPrice: 'IDR 50.000',
    unitInfo: '1kg / Premium Kraft',
    weight: '1kg',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
    description: 'Tepung sorgum utuh yang digiling bersama lapisan dedak kaya nutrisi. Sangat baik untuk pembuatan roti gandum bebas gluten.',
    glutenFree: true,
    organic: true,
    specification: '100% Whole Grain Sorghum, Digiling Dingin (Cold Milled), Serat Sangat Tinggi.',
    shippingInfo: 'Dikirim dari Yogyakarta. Dipack aman menggunakan kantong kertas Kraft food grade.',
  },
];

const INITIAL_FAQS: FaqItem[] = [
  {
    id: 'FAQ-001',
    category: 'Tentang Produk',
    question: 'Apakah semua produk Bestari 100% Bebas Gluten (Gluten-Free)?',
    answer: 'Ya, seluruh produk Bestari diolah di fasilitas terpisah yang khusus menangani biji-bijian bebas gluten untuk menjamin tidak ada kontaminasi silang gandum.',
    status: 'AKTIF',
    order: 1,
    tags: ['gluten-free', 'keamanan', 'organik'],
    updatedAt: '2023-10-24 10:15',
    viewsCount: 1240,
  },
  {
    id: 'FAQ-002',
    category: 'Tentang Produk',
    question: 'Bagaimana cara menyimpan tepung dan beras sorgum agar tahan lama?',
    answer: 'Simpan produk dalam wadah kedap udara di tempat yang sejuk, kering, dan terhindar dari sinar matahari langsung. Untuk daya simpan maksimal hingga 12 bulan, Anda dapat menyimpannya di dalam kulkas.',
    status: 'AKTIF',
    order: 2,
    tags: ['penyimpanan', 'daya simpan', 'kulkas'],
    updatedAt: '2023-10-22 14:30',
    viewsCount: 980,
  },
  {
    id: 'FAQ-003',
    category: 'Tentang Produk',
    question: 'Apa perbedaan beras sorgum putih dan sorgum hitam?',
    answer: 'Sorgum putih memiliki rasa yang cenderung lembut dan netral, sangat cocok untuk konsumsi harian pengganti beras putih. Sorgum hitam memiliki rasa lebih umami/rich, serat lebih tinggi, serta kaya antioksidan antosianin alami.',
    status: 'AKTIF',
    order: 3,
    tags: ['sorgum putih', 'sorgum hitam', 'nutrisi'],
    updatedAt: '2023-10-20 09:00',
    viewsCount: 1510,
  },
  {
    id: 'FAQ-004',
    category: 'Pemesanan & Pembayaran',
    question: 'Metode pembayaran apa saja yang diterima di toko Bestari?',
    answer: 'Kami menerima berbagai metode pembayaran instan dan aman, meliputi Transfer Bank (BCA, Mandiri, BRI, BNI), QRIS, E-Wallet (GoPay, OVO, ShopeePay), serta sistem COD (Bayar di Tempat).',
    status: 'AKTIF',
    order: 4,
    tags: ['pembayaran', 'qris', 'cod', 'e-wallet'],
    updatedAt: '2023-10-18 11:45',
    viewsCount: 890,
  },
  {
    id: 'FAQ-005',
    category: 'Pemesanan & Pembayaran',
    question: 'Apakah ada minimal pembelian untuk promo gratis ongkir?',
    answer: 'Ya, minimal pembelian sebesar Rp 150.000 berhak mendapatkan voucher subsidi ongkos kirim hingga Rp 20.000 ke seluruh kota di Indonesia.',
    status: 'AKTIF',
    order: 5,
    tags: ['promo', 'gratis ongkir', 'voucher'],
    updatedAt: '2023-10-15 16:20',
    viewsCount: 2100,
  },
  {
    id: 'FAQ-006',
    category: 'Pengiriman',
    question: 'Berapa lama estimasi pengiriman pesanan sampai ke tujuan?',
    answer: 'Estimasi pengiriman untuk wilayah Jabodetabek dan Jawa Barat adalah 1-2 hari kerja. Untuk wilayah Pulau Jawa lainnya 2-3 hari kerja, dan luar Pulau Jawa berkisar 3-7 hari kerja tergantung opsi kurir ekpedisi.',
    status: 'AKTIF',
    order: 6,
    tags: ['estimasi', 'ekspedisi', 'kurir'],
    updatedAt: '2023-10-12 08:30',
    viewsCount: 1750,
  },
  {
    id: 'FAQ-007',
    category: 'Pengiriman',
    question: 'Bagaimana jika kemasan produk mengalami kerusakan saat diterima?',
    answer: 'Seluruh produk dikemas menggunakan corrugated box tebal dan bubble wrap. Namun jika terdapat kendala kerusakan, silakan foto/video unboxing dan hubungi Tim CS via WhatsApp dalam 2x24 jam untuk pengiriman ulang gratis.',
    status: 'AKTIF',
    order: 7,
    tags: ['garansi', 'retur', 'unboxing'],
    updatedAt: '2023-10-10 13:10',
    viewsCount: 620,
  },
];

const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-1',
    title: 'Manfaat Sorghum untuk Diet Bebas Gluten',
    category: 'Nutrisi',
    readTime: '5 Menit Baca',
    snippet: 'Sorghum adalah alternatif biji-bijian bebas gluten yang kaya serat. Pelajari bagaimana mengintegrasikannya ke dalam pola makan harian Anda tanpa mengorbankan rasa.',
    content: 'Diet bebas gluten bukan lagi sekadar tren kesehatan, melainkan kebutuhan bagi banyak individu dengan intoleransi gluten atau penyakit celiac. Di tengah pencarian alternatif gandum yang berkelanjutan dan padat nutrisi, Sorghum muncul sebagai primadona baru di dunia kuliner modern. Biji-bijian kuno ini tidak hanya aman bagi pencernaan, tetapi juga membawa profil nutrisi yang melampaui biji-bijian konvensional lainnya.\n\nSorghum secara alami bebas gluten, menjadikannya bahan dasar yang sangat aman untuk berbagai olahan pangan. Namun, keunggulannya tidak berhenti di sana. Sorghum mengandung serat yang sangat tinggi, membantu menjaga kesehatan mikrobioma usus dan memberikan rasa kenyang lebih lama, yang sangat krusial dalam manajemen berat badan.\n\nIntegrasi sorghum ke dalam diet harian sangatlah mudah. Anda dapat menggunakan tepung sorghum sebagai pengganti tepung terigu dalam pembuatan kue, atau mengolah biji sorghum utuh layaknya nasi atau quinoa. Teksturnya yang sedikit kenyal dan rasanya yang cenderung netral dengan sentuhan \'nutty\' menjadikannya kanvas sempurna untuk berbagai bumbu masakan Indonesia.\n\nDi BESTARI, kami berdedikasi untuk menghadirkan sorghum dalam kualitas terbaik melalui proses pengolahan yang menjaga integritas nutrisinya. Dari ladang yang terawat hingga ke meja makan Anda, setiap butir sorghum kami adalah manifestasi dari komitmen terhadap kesehatan dan keberlanjutan lingkungan.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBi2ENR_93XnNmbYtIH2_fKZTLCzLu5Hzf7KwqpYvD1zJElInu2beJowvQirSxwryo8Yl7qdouBtOZ0P2_intlG3pYvjDuMzZBcRbRIMzGGNuffvJbS7t5T3qrArGBZsIKsNXo2_5alWI_F3wCEZIEWFyPhc3h4QwhM7xzTd-oBPdYlvh_weFLUDKcgneLUGCYToPzmcVISwwLQyx_REPe3H_GHTaxn7rjt_cCvXS947BwkXZYC1iGB4w',
    subImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuHykNwQgW0Rs2Bovsk1_coUM0_feNAbh7qxnNLx9fmCRaL4puO8wRJLeHKQFjM0YytJKC12B2Zy8bTvBK16Acm9iVwOzZymcD_51isSWrea0iG4IL0CcHposBKpAu3nO1-r7rYTkVfJvpESNfBMbwahEuq7FfsqI3vvtIwEPym_pFCJfrjHpyrzrzoqxIKYP67mrjnv4C3Ue85AbHIGvHyfuYpV7aeQ0WbY8y3B7iCoVcq2K1znPAPA',
    quote: 'Sorghum bukan sekadar pengganti; ia adalah peningkatan kualitas nutrisi dalam piring Anda. Dengan indeks glikemik rendah, ia membantu menjaga stabilitas energi sepanjang hari tanpa lonjakan gula darah.',
    date: '12 Oktober 2023',
    author: 'Arisanti Putri',
    authorRole: 'Lead Product Researcher',
    facts: [
      { title: 'Gluten-Free', desc: 'Aman 100% untuk diet bebas gandum.' },
      { title: 'High Fiber', desc: 'Mendukung pencernaan yang optimal.' },
      { title: 'Low Glycemic Index', desc: 'Membantu mengontrol gula darah.' },
      { title: 'Rich in Antioxidants', desc: 'Melindungi sel tubuh dari radikal bebas.' },
    ],
  },
  {
    id: 'art-2',
    title: 'Ketahanan Pangan Melalui Pertanian Lokal',
    category: 'Budidaya',
    readTime: '8 Menit Baca',
    snippet: 'Mengapa sorghum menjadi kunci masa depan pertanian Indonesia di tengah perubahan iklim global. Kisah dari para petani lokal binaan BESTARI.',
    content: 'Pertanian lokal memegang peranan krusial dalam menghadapi krisis iklim global. Sorghum, dengan daya tahannya yang luar biasa terhadap kekeringan dan lahan marjinal, menjadi pilar utama kedaulatan pangan di wilayah Indonesia Timur.\n\nMelalui kemitraan berkeadilan dengan para petani lokal di Flores dan Nusa Tenggara, BESTARI membina ratusan hektar lahan sorghum organik. Hasil panen yang stabil tidak hanya meningkatkan taraf hidup keluarga petani, tetapi juga menjamin ketersediaan bahan pangan bergizi tinggi secara berkelanjutan.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-U92ef1AWrRunC_1mYdC7EQH-yNArhPFBQ6oIdXQMm5M0Jy3PMHVPA29vpLt3JyBO5kmgn07CgjPENJcM4obBHNSZSOQSHfSDhYz_HD-Sd6i_AwP3C8h82A2jtXbTuq5AelCOPEliINBXjBJBUEr34MgWC3meRH8oWhEpCKWlR87CeaTLotYRfyLjVV0r3ch2LUsQ3HpICgyg3mEa8-RDYDyqj4LkKEbWN9VN3VNwmQeaednwsXf3Hg',
    date: '28 September 2023',
    author: 'Ahmad Subagyo',
    authorRole: 'Koordinator Petani Lokal',
  },
  {
    id: 'art-3',
    title: 'Inovasi Kuliner: Sorghum di Meja Makan Modern',
    category: 'Inspirasi',
    readTime: '6 Menit Baca',
    snippet: 'Eksplorasi resep kreatif dari chef ternama yang menggunakan sorghum sebagai bintang utama dalam hidangan kontemporer yang menggugah selera.',
    content: 'Sorghum tidak lagi terbatas pada olahan tradisional. Di tangan para profesional kuliner, biji-bijian ini diubah menjadi berbagai hidangan modern seperti risotto sorghum, gluten-free pasta, hingga dessert lezat.\n\nFlavour profile sorghum yang subtle dan sedikit \'nutty\' memberikan dimensi rasa baru yang diminati oleh para pecinta kuliner sehat maupun restoran fine dining.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDM3gs3-phAENScDeuisQGmk3iMEPfRWGM1tnPsGl2GrcuKF5fcxGlXrKDXn3Jzj8Oy0TVxdi-UXpD8gOOtQtuXctoYqXdnD78Fe9NUWzgtGa-iyJOMa0yDB2NG8CejhHfba11qTzv6myxY7F3PVm7Yq-gInGnsWh_FxgsgsxvOuveJ8YU9rDEoYhTL9i1QAC9RymUi91ztAF9c0qMYE1QcIi0pbnCtdNtMdW14xgHI_vSs8iJQeNlMqA',
    date: '15 September 2023',
    author: 'Chef Budi Santoso',
    authorRole: 'Culinary Specialist',
  },
  {
    id: 'art-4',
    title: 'Memahami Indeks Glikemik Rendah pada Sorghum',
    category: 'Nutrisi',
    readTime: '4 Menit Baca',
    snippet: 'Penjelasan ilmiah mengenai mengapa sorghum sangat direkomendasikan bagi penderita diabetes dan mereka yang menjaga kadar gula darah.',
    content: 'Indeks glikemik (GI) mengukur seberapa cepat karbohidrat dalam makanan meningkatkan kadar gula darah. Sorghum memiliki indeks glikemik tergolong rendah, sehingga dicerna secara perlahan dan melepaskan glukosa secara bertahap.\n\nHal ini menjadikan sorghum pilihan pangan ideal bagi individu yang mengelola diabetes melitus tipe 2 atau sedang menjalani program pemeliharaan berat badan ideal.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAh5o959jhbN3WAEQeFnpCBu3rXVlovo0i8uV_YZMoQSMfZrXwc6MNO1aoPP4RKAm1IPaxknmQagSnVSs5r_pO_bHrgnV3KYfCIQoeq0eHUye1GYQshy9xQa34RpNFex9deQAMHct3qs_d4vvkBT7HIIeMl08ueRRmNuJvgIkd_zy0yfGbBH5fy70xa_9JhRAm8M4tgEIGHCUGXKo5bf-_pY-h8dV94RLm808QVTcuDEM42TqGWdiXsKA',
    date: '02 September 2023',
    author: 'Dr. Rina Wati',
    authorRole: 'M.Gizi, Konsultan Nutrisi',
  },
  {
    id: 'art-5',
    title: 'Sorghum: Jejak Sejarah yang Terlupakan',
    category: 'Budidaya',
    readTime: '10 Menit Baca',
    snippet: 'Menelusuri sejarah sorghum di nusantara, dari tanaman pangan utama hingga posisinya yang mulai kembali diperhitungkan dalam ekonomi modern.',
    content: 'Sebelum maraknya dominasi beras di abad ke-20, sorghum atau cantel merupakan salah satu makanan pokok penting di banyak wilayah kering di Nusantara. Relief di candi Borobudur bahkan menggambarkan tanaman sorgum sebagai bagian dari kekayaan flora Nusantara.\n\nKini, revitalisasi sorghum membuka lembaran baru sejarah keanekaragaman pangan Indonesia.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-5o9-XbQB38iqcCd5H7EzCbzBfIXEGXP06KKUq3h-Gr8wFzU4lS6kPoD5FGvrwAwrUe1riwP-DHEb8-Lytp58igCD6Nme-MOBtRMKiflVcvT6_d_oLlZfdX6Cx-kK7gOQillh1EubxF8O-9Vcq9236psgOUQp5lFhzYq-RIyb6M83Gylh0DKFCxRr-ckFrLjWu5Y5ALJvCLzdPfnVqBkD2JW513WVDAObk-9QggWi9fx2Gss4MXvoxA',
    date: '20 Agustus 2023',
    author: 'Tim Sejarah Bestari',
    authorRole: 'Peneliti Pangan Nusantara',
  },
  {
    id: 'art-6',
    title: 'Masa Depan Berkelanjutan dengan BESTARI',
    category: 'Inspirasi',
    readTime: '7 Menit Baca',
    snippet: 'Bagaimana visi BESTARI dalam menciptakan ekosistem pangan yang tidak hanya sehat bagi konsumen, tetapi juga ramah bagi bumi.',
    content: 'Inovasi pangan berkelanjutan adalah jantung dari pengembagan produk BESTARI. Dengan meminimalkan jejak karbon melalui rantai pasok lokal dan kemasan ramah lingkungan, kami memastikan setiap produk memberikan dampak positif bagi alam dan kesehatan.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-9bJk2rqAziBbwuSlpCqsuLtRlnjmXr2kQNqbuxPxap-mpe-kwRkZ4geiGi0QAmDUaSuftNPX6faSuVhUmx6M1Iyynf-lIJkbJ7uTAMgJ1HF0hwOyfP9NuI4AfjIvCa-708ejAAUmGkRHqIUgfcYZKMmzyXhz2XBDCktAwsaE2uKP1n96Uce_RjwklTkI2PMzkEvvy3OXDHE7cm8AqXKKNLJvcHQY6Bv-lENnifdjN7m7hWK2Q_ojGA',
    date: '05 Agustus 2023',
    author: 'Redaksi Bestari',
    authorRole: 'Tim Keberlanjutan',
  },
  {
    id: 'art-promo-default',
    title: 'Hemat Belanja Sehat: Promo Diskon 10%',
    category: 'Promosi',
    readTime: '3 Menit Baca',
    snippet: 'Gunakan kode promo BESTARI10 untuk mendapatkan potongan instan Rp 15.000 tanpa batas minimum pembelian.',
    content: 'Kami berkomitmen mendukung gaya hidup sehat Anda dengan memberikan diskon spesial untuk pembelian perdana seluruh lini tepung dan beras sorgum organik. Cukup masukkan kode voucher BESTARI10 saat checkout untuk menikmati potongan instan Rp 15.000.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
    date: '02 Agustus 2026',
    author: 'Promosi Bestari',
  }
];

const INITIAL_BANNERS: BannerSlide[] = [
  {
    id: 'b-1',
    title: 'Panen Raya Sorgum',
    uploadDate: '12 Okt 2023',
    targetLink: 'Halaman Toko: Semua Produk',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBedFkef0uf3wThSykVry5S0pnKGNteDPCI4H_u9wXo2Iw6MB2JV9-GWbXBPiXoIINPGG_JNRn_oUg7XoFYH7bLYib2-pxC1R6SOqYMFKB6AYHi1lZWglunj0vDmRrLXAXarWaqQd_yPAqs39gyfrHheQ1wByPzSpB_9OZQV86FLWiUFhpsZ4tuUTDD6NKfMzT3xfwdnRJrmP6dxJnap7TErQ6DfJ3IoO2_VWWB3XP8JuMSECFMNiBl',
    active: true,
  },
  {
    id: 'b-2',
    title: 'Premium Flour Promo',
    uploadDate: '05 Okt 2023',
    targetLink: 'Detail Produk: Tepung Sorgum Halus',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8wY4rl62cbf__Lmm6OcK6rlnQkthCQP-y7zpoy-tBoB5HOLHpQwSJn0cXw3lZWP1Y8xHrsN1V-eWwjfECt57oXWKH3xB_2E0dg47SLfD7yxZcJfcm830KEZ5_aLP4-nh-4UQrLF4hYkurAbuRJyO065v-dquECxPRORXeR5oKsJONK4OD3xskagnGH9TCjYv5a8V9hq0Qxu0Mr4EQv9LftQeAey3sPDBrw5HPD5OCeqEsyZ7pAqdF',
    active: true,
  },
];

const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  storeName: 'BESTARI Sorghum',
  logoUrl: '',
  qrisImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIKWh-z2qzILYDC9woreBeFgSVM7_5bAXQw5pYZ_WwXgCifGERVX51aW8YsqJjhz82BHNB45qL6bJnxNWBWwpAxsM67_7x2OTYNFuUS0K4XILgSk6ErmPXJ-UP3WMQhaf0M_b3gWRwVKHSZ6kbqzO0x1MUI3RpV0ldxSddeaWujNrHtPTNPk0WLMpMDYC-ht49m3cEFZM04MALEK2_xXvp7VSo9wE4R95RE8g09iTX-hLm7IdsDkg',
  qrisNmid: 'NMID: ID1029384756382',
  whatsappNumber: '+62 812-3456-7890',
  qrisStatus: 'AKTIF',
  faviconUrl: '',
  storeAddress: 'Sleman, DI Yogyakarta, Indonesia',
  storeEmail: 'halo@bestari.id',
};

const DEFAULT_LANDING_CONTENT: LandingContent = {
  heroTitleId: 'Kemurnian Alam dalam Tiap Butir Sorgum Pilihan',
  heroTitleEn: 'Purity of Nature in Every Premium Sorghum Grain',
  heroDescId: 'Nikmati kebaikan nutrisi lokal yang diproses dengan standar kualitas tinggi untuk gaya hidup sehat Anda.',
  heroDescEn: 'Enjoy the goodness of local nutrition processed with high quality standards for your healthy lifestyle.',
  heroBtnId: 'Belanja Sekarang',
  heroBtnEn: 'Shop Now',
  storyTaglineId: 'Kisah Kami',
  storyTaglineEn: 'Our Story',
  storyTitleId: 'Kembalinya Warisan Pangan Leluhur Nusantara',
  storyTitleEn: 'The Return of the Ancestral Food Heritage of Nusantara',
  storyDesc1Id: 'Di Bestari, kami percaya bahwa kesehatan sejati dimulai dari apa yang ditanam oleh alam secara murni. Bersama para petani mitra lokal, kami menghidupkan kembali sorgum—tanaman super (*superfood*) kaya serat and bebas gluten yang telah menutrisi generasi sebelum kita.',
  storyDesc1En: 'At Bestari, we believe that true health starts from what nature grows purely. Together with local partner farmers, we revive sorghum—a fiber-rich and gluten-free superfood that has nourished generations before us.',
  storyDesc2Id: 'Setiap butir Bestari adalah wujud komitmen kami untuk menghadirkan kualitas terbaik dari tanah Indonesia langsung ke meja makan keluarga Anda, sambil melestarikan keseimbangan ekosistem bumi.',
  storyDesc2En: 'Every grain of Bestari is a testament to our commitment to bringing the finest quality from Indonesian soil straight to your family dining table, while preserving the balance of the Earth\'s ecosystem.',
  storyImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBedFkef0uf3wThSykVry5S0pnKGNteDPCI4H_u9wXo2Iw6MB2JV9-GWbXBPiXoIINPGG_JNRn_oUg7XoFYH7bLYib2-pxC1R6SOqYMFKB6AYHi1lZWglunj0vDmRrLXAXarWaqQd_yPAqs39gyfrHheQ1wByPzSpB_9OZQV86FLWiUFhpsZ4tuUTDD6NKfMzT3xfwdnRJrmP6dxJnap7TErQ6DfJ3IoO2_VWWB3XP8JuMSECFMNiBl',
  benefitsTitleId: 'Mengapa Memilih Sorgum?',
  benefitsTitleEn: 'Why Choose Sorghum?',
  benefitsDescId: 'Kami berkomitmen menghadirkan produk pangan berkelanjutan yang sehat untuk tubuh dan ramah bagi bumi.',
  benefitsDescEn: 'We are committed to delivering sustainable food products that are healthy for the body and friendly to the planet.',
  benefit1TitleId: 'Bebas Gluten',
  benefit1TitleEn: 'Gluten Free',
  benefit1DescId: 'Alternatif gandum yang aman bagi penderita celiac dan mereka yang menjalani diet bebas gluten.',
  benefit1DescEn: 'A safe alternative to wheat for celiac disease and those on a gluten-free diet.',
  benefit1Icon: 'eco',
  benefit2TitleId: '100% Organik Lokal',
  benefit2TitleEn: '100% Organic & Local',
  benefit2DescId: 'Ditanam secara alami tanpa pestisida kimia oleh petani mitra kami di tanah Nusantara.',
  benefit2DescEn: 'Grown naturally without chemical pesticides by our partner farmers across the archipelago.',
  benefit2Icon: 'verified',
  benefit3TitleId: 'Berdampak Sosial',
  benefit3TitleEn: 'Social Impact',
  benefit3DescId: 'Setiap pembelian Anda mendukung kesejahteraan komunitas petani sorgum di pelosok daerah.',
  benefit3DescEn: 'Your purchase supports the welfare of sorghum farming communities in remote regions.',
  benefit3Icon: 'groups',
  featuredTitleId: 'Koleksi Produk Pilihan',
  featuredTitleEn: 'Featured Product Collection',
  featuredDescId: 'Temukan berbagai olahan sorgum organik berkualitas tinggi, mulai dari beras sehat, tepung serbaguna, hingga camilan bergizi',
  featuredDescEn: 'Discover a variety of high-quality organic sorghum products, ranging from healthy rice, all-purpose flour, to nutritious snacks.',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lang & Theme
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved === 'en' || saved === 'id') ? saved : 'id';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  });

  // Data States
  const [products, setProducts] = useState<Product[]>(() => {
    const raw = localStorage.getItem('bestari_products_v1');
    return raw ? JSON.parse(raw) : INITIAL_PRODUCTS;
  });

  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    const raw = localStorage.getItem('bestari_faqs_v1');
    return raw ? JSON.parse(raw) : INITIAL_FAQS;
  });

  const [articles, setArticles] = useState<Article[]>(() => {
    const raw = localStorage.getItem('bestari_articles_v1');
    return raw ? JSON.parse(raw) : INITIAL_ARTICLES;
  });

  const [banners, setBanners] = useState<BannerSlide[]>(() => {
    const raw = localStorage.getItem('bestari_banners_v1');
    return raw ? JSON.parse(raw) : INITIAL_BANNERS;
  });

  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => {
    const raw = localStorage.getItem('bestari_shop_settings_v1');
    return raw ? JSON.parse(raw) : DEFAULT_SHOP_SETTINGS;
  });

  const [landingContent, setLandingContent] = useState<LandingContent>(() => {
    const raw = localStorage.getItem('bestari_landing_content_v1');
    return raw ? JSON.parse(raw) : DEFAULT_LANDING_CONTENT;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const raw = localStorage.getItem('bestari_orders');
    return raw ? JSON.parse(raw) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('bestari_current_user');
    return raw ? JSON.parse(raw) : null;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const raw = localStorage.getItem('bestari_cart_items');
    return raw ? JSON.parse(raw) : [];
  });

  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  // Sync localStorage with State updates
  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Favicon updater effect
  useEffect(() => {
    if (shopSettings.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = shopSettings.faviconUrl;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = shopSettings.faviconUrl;
        document.head.appendChild(newLink);
      }
    }
  }, [shopSettings.faviconUrl]);

  // Save state helpers to sync automatically
  const updateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('bestari_products_v1', JSON.stringify(newProducts));
  };

  const updateFaqs = (newFaqs: FaqItem[]) => {
    setFaqs(newFaqs);
    localStorage.setItem('bestari_faqs_v1', JSON.stringify(newFaqs));
  };

  const updateArticles = (newArticles: Article[]) => {
    setArticles(newArticles);
    localStorage.setItem('bestari_articles_v1', JSON.stringify(newArticles));
  };

  const updateBanners = (newBanners: BannerSlide[]) => {
    setBanners(newBanners);
    localStorage.setItem('bestari_banners_v1', JSON.stringify(newBanners));
  };

  const saveShopSettings = (settings: Partial<ShopSettings>) => {
    const updated = { ...shopSettings, ...settings };
    setShopSettings(updated);
    localStorage.setItem('bestari_shop_settings_v1', JSON.stringify(updated));
  };

  const saveLandingContent = (content: LandingContent) => {
    setLandingContent(content);
    localStorage.setItem('bestari_landing_content_v1', JSON.stringify(content));
  };

  const updateOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem('bestari_orders', JSON.stringify(newOrders));
  };

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('bestari_cart_items', JSON.stringify(newCart));
  };

  // Auth Helpers
  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    if (!payload.email || !payload.password) {
      return { success: false, message: 'Mohon masukkan email dan kata sandi Anda.' };
    }
    const cleanInput = payload.email.trim().toLowerCase();
    
    // Administrator logic
    if (
      cleanInput.includes('admin') ||
      payload.password.toLowerCase() === 'admin123' ||
      payload.password.toLowerCase() === 'admin'
    ) {
      const adminUser: User = {
        id: 'user-admin-01',
        name: 'Administrator Bestari',
        email: cleanInput.includes('@') ? cleanInput : 'admin@bestari.com',
        role: 'admin',
      };
      setCurrentUser(adminUser);
      localStorage.setItem('bestari_current_user', JSON.stringify(adminUser));
      return { success: true, message: 'Berhasil masuk sebagai Administrator!', user: adminUser };
    }

    // Default Customer logic
    const customerUser: User = {
      id: `user-${Date.now()}`,
      name: payload.email.split('@')[0] || 'Pelanggan Bestari',
      email: payload.email,
      role: 'user',
    };
    setCurrentUser(customerUser);
    localStorage.setItem('bestari_current_user', JSON.stringify(customerUser));
    return { success: true, message: 'Berhasil masuk! Selamat datang kembali.', user: customerUser };
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    if (!payload.email || !payload.password || !payload.name) {
      return { success: false, message: 'Mohon lengkapi seluruh data pendaftaran.' };
    }
    if (payload.password.length < 6) {
      return { success: false, message: 'Kata sandi minimal harus 6 karakter.' };
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role: 'user',
    };
    setCurrentUser(newUser);
    localStorage.setItem('bestari_current_user', JSON.stringify(newUser));
    return { success: true, message: 'Pendaftaran berhasil! Selamat bergabung dengan BESTARI.', user: newUser };
  };

  const logout = async () => {
    setCurrentUser(null);
    localStorage.removeItem('bestari_current_user');
  };

  // Product CRUD
  const saveProduct = (productData: any) => {
    const catLabelMap: Record<string, string> = {
      beras: 'Beras Sorgum',
      tepung: 'Tepung Sorgum',
      camilan: 'Camilan Sehat',
      pemanis: 'Pemanis Alami',
      benih: 'Benih Sorgum',
    };
    
    if (productData.id) {
      // Edit
      const exists = products.some((p) => p.id === productData.id);
      if (exists) {
        const updated = products.map((p) => {
          if (p.id === productData.id) {
            return {
              ...p,
              name: productData.name,
              category: productData.category,
              categoryLabel: catLabelMap[productData.category] || 'Produk Sorgum',
              price: Number(productData.price),
              formattedPrice: `IDR ${Number(productData.price).toLocaleString('id-ID')}`,
              unitInfo: productData.unitInfo,
              weight: productData.weight,
              badge: productData.badge || undefined,
              image: productData.image,
              description: productData.description,
              glutenFree: !!productData.glutenFree,
              organic: !!productData.organic,
              specification: productData.specification,
              shippingInfo: productData.shippingInfo,
            };
          }
          return p;
        });
        updateProducts(updated);
      } else {
        const newProd: Product = {
          id: productData.id,
          name: productData.name,
          category: productData.category,
          categoryLabel: catLabelMap[productData.category] || 'Produk Sorgum',
          price: Number(productData.price),
          formattedPrice: `IDR ${Number(productData.price).toLocaleString('id-ID')}`,
          unitInfo: productData.unitInfo,
          weight: productData.weight,
          badge: productData.badge || undefined,
          image: productData.image,
          description: productData.description || 'Produk olahan sorgum berkualitas tinggi.',
          glutenFree: !!productData.glutenFree,
          organic: !!productData.organic,
          specification: productData.specification,
          shippingInfo: productData.shippingInfo,
        };
        updateProducts([newProd, ...products]);
      }
    } else {
      const newId = `prod-${Date.now()}`;
      const newProd: Product = {
        id: newId,
        name: productData.name,
        category: productData.category,
        categoryLabel: catLabelMap[productData.category] || 'Produk Sorgum',
        price: Number(productData.price),
        formattedPrice: `IDR ${Number(productData.price).toLocaleString('id-ID')}`,
        unitInfo: productData.unitInfo,
        weight: productData.weight,
        badge: productData.badge || undefined,
        image: productData.image,
        description: productData.description || 'Produk olahan sorgum berkualitas tinggi.',
        glutenFree: !!productData.glutenFree,
        organic: !!productData.organic,
        specification: productData.specification,
        shippingInfo: productData.shippingInfo,
      };
      updateProducts([newProd, ...products]);
    }
  };

  const deleteProduct = (id: string) => {
    const filtered = products.filter((p) => p.id !== id);
    updateProducts(filtered);
  };

  // FAQ CRUD
  const saveFaq = async (faqData: any) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    if (faqData.id) {
      const updated = faqs.map((f) => {
        if (f.id === faqData.id) {
          return {
            ...f,
            question: faqData.question,
            answer: faqData.answer,
            category: faqData.category,
            status: faqData.status,
            order: faqData.order !== undefined ? Number(faqData.order) : f.order,
            tags: faqData.tags || f.tags || [],
            updatedAt: nowStr,
          };
        }
        return f;
      });
      updateFaqs(updated);
    } else {
      const nextNum = faqs.length + 1;
      const newId = `FAQ-${String(nextNum).padStart(3, '0')}`;
      const newFaq: FaqItem = {
        id: newId,
        question: faqData.question,
        answer: faqData.answer,
        category: faqData.category || 'Tentang Produk',
        status: faqData.status || 'AKTIF',
        order: faqData.order !== undefined ? Number(faqData.order) : faqs.length + 1,
        tags: faqData.tags || [],
        updatedAt: nowStr,
        viewsCount: 0,
      };
      updateFaqs([newFaq, ...faqs]);
    }
  };

  const deleteFaq = async (id: string) => {
    const filtered = faqs.filter((f) => f.id !== id);
    updateFaqs(filtered);
  };

  const toggleFaqStatus = async (id: string) => {
    const updated = faqs.map((f) => {
      if (f.id === id) {
        return {
          ...f,
          status: f.status === 'AKTIF' ? 'DRAFT' as const : 'AKTIF' as const,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
      }
      return f;
    });
    updateFaqs(updated);
  };

  const reorderFaq = async (id: string, direction: 'UP' | 'DOWN') => {
    const index = faqs.findIndex((f) => f.id === id);
    if (index === -1) return;
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= faqs.length) return;

    const copy = [...faqs];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    const reordered = copy.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    updateFaqs(reordered);
  };

  // Article CRUD
  const saveArticle = (articleData: any) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    if (articleData.id) {
      const updated = articles.map((a) => {
        if (a.id === articleData.id) {
          return {
            ...a,
            title: articleData.title,
            category: articleData.category,
            author: articleData.author,
            content: articleData.content,
            snippet: articleData.content ? articleData.content.substring(0, 150) + '...' : a.snippet,
            image: articleData.image || a.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
          };
        }
        return a;
      });
      updateArticles(updated);
    } else {
      const newArt: Article = {
        id: `art-${Date.now()}`,
        title: articleData.title,
        category: articleData.category || 'Nutrisi',
        readTime: '5 Menit Baca',
        snippet: articleData.content ? articleData.content.substring(0, 150) + '...' : '',
        content: articleData.content,
        image: articleData.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
        date: dateStr,
        author: articleData.author || 'Tim Bestari',
      };
      updateArticles([newArt, ...articles]);
    }
  };

  const deleteArticle = (id: string) => {
    const filtered = articles.filter((a) => a.id !== id);
    updateArticles(filtered);
  };

  // Banner CRUD
  const saveBanner = (bannerData: { id?: string; title: string; targetLink: string; image: string }) => {
    if (bannerData.id) {
      const updated = banners.map((b) => {
        if (b.id === bannerData.id) {
          return {
            ...b,
            title: bannerData.title,
            targetLink: bannerData.targetLink,
            image: bannerData.image,
          };
        }
        return b;
      });
      updateBanners(updated);
    } else {
      const newBanner: BannerSlide = {
        id: `b-${Date.now()}`,
        title: bannerData.title,
        uploadDate: 'Hari Ini',
        targetLink: bannerData.targetLink,
        image: bannerData.image,
        active: true,
      };
      updateBanners([newBanner, ...banners]);
    }
  };

  const deleteBanner = (id: string) => {
    const filtered = banners.filter((b) => b.id !== id);
    updateBanners(filtered);
  };

  const toggleBanner = (id: string) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, active: !b.active } : b));
    updateBanners(updated);
  };

  // Orders CRUD
  const addOrder = (order: Order) => {
    const updated = [order, ...orders];
    updateOrders(updated);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    updateOrders(updated);
  };

  const deleteOrder = (id: string) => {
    const filtered = orders.filter((o) => o.id !== id);
    updateOrders(filtered);
  };

  // Cart Helpers
  const addToCart = (product: Product, quantity: number = 1) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...cart];
      updated[existingIndex].quantity += quantity;
    } else {
      updated = [...cart, { product, quantity }];
    }
    updateCart(updated);
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    const updated = cart
      .map((item) => (item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item))
      .filter((item) => item.quantity > 0);
    updateCart(updated);
  };

  const removeCartItem = (productId: string) => {
    const updated = cart.filter((item) => item.product.id !== productId);
    updateCart(updated);
  };

  const clearCart = () => {
    updateCart([]);
  };

  // Translation helper function
  const t = (idText: string, enText: string): string => {
    return language === 'en' ? enText : idText;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'id' ? 'en' : 'id'));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <AppContext.Provider
      value={{
        language,
        theme,
        toggleLanguage,
        toggleTheme,
        t,
        products,
        saveProduct,
        deleteProduct,
        faqs,
        saveFaq,
        deleteFaq,
        toggleFaqStatus,
        reorderFaq,
        articles,
        saveArticle,
        deleteArticle,
        banners,
        saveBanner,
        deleteBanner,
        toggleBanner,
        shopSettings,
        saveShopSettings,
        landingContent,
        saveLandingContent,
        orders,
        addOrder,
        updateOrderStatus,
        deleteOrder,
        currentUser,
        login,
        register,
        logout,
        cart,
        addToCart,
        updateCartQuantity,
        removeCartItem,
        clearCart,
        appliedDiscount,
        setAppliedDiscount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
