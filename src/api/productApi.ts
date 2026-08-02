import { Product } from '../types';

// Initial Mock Product Data matching BESTARI Google Stitch design
const MOCK_PRODUCTS: Product[] = [
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
    shippingInfo: 'Dikirim dari Yogyakarta. Dikemas khusus menggunakan bubble wrap tebal (bergaransi pecah).',
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

/**
 * Product API Service Placeholder
 * Future backend integration point. All React UI components must invoke these helpers.
 */
export const productApi = {
  // Get all products with optional filtering and sorting
  getProducts: async (params?: {
    category?: string;
    searchQuery?: string;
    sortBy?: 'populer' | 'harga-terendah' | 'harga-tertinggi' | 'terbaru';
  }): Promise<Product[]> => {
    // Simulate lightweight network latency for seamless async readiness
    await new Promise((resolve) => setTimeout(resolve, 80));

    let result = [...MOCK_PRODUCTS];

    if (params?.category && params.category !== 'semua' && params.category !== 'all') {
      const cat = params.category.toLowerCase();
      result = result.filter((p) => {
        if (cat === 'beras sorgum' || cat === 'beras') return p.category === 'beras';
        if (cat === 'tepung sorgum' || cat === 'tepung') return p.category === 'tepung';
        if (cat === 'camilan' || cat === 'camilan sehat') return p.category === 'camilan';
        if (cat === 'pemanis' || cat === 'pemanis alami') return p.category === 'pemanis';
        if (cat === 'benih') return p.category === 'benih';
        return p.category === cat;
      });
    }

    if (params?.searchQuery && params.searchQuery.trim() !== '') {
      const q = params.searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryLabel.toLowerCase().includes(q)
      );
    }

    if (params?.sortBy) {
      if (params.sortBy === 'harga-terendah') {
        result.sort((a, b) => a.price - b.price);
      } else if (params.sortBy === 'harga-tertinggi') {
        result.sort((a, b) => b.price - a.price);
      }
    }

    return result;
  },

  // Get a single product by ID
  getProductById: async (id: string): Promise<Product | null> => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const item = MOCK_PRODUCTS.find((p) => p.id === id);
    return item || null;
  },

  // Get featured products
  getFeaturedProducts: async (): Promise<Product[]> => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return MOCK_PRODUCTS.slice(0, 4);
  },
};
