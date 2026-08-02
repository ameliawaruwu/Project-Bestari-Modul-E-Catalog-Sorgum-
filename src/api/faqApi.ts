import { FaqItem } from '../types';

const LOCAL_STORAGE_KEY = 'bestari_faqs_v1';

const INITIAL_MOCK_FAQS: FaqItem[] = [
  {
    id: 'FAQ-001',
    category: 'Tentang Produk',
    question: 'Apakah semua produk Bestari 100% Bebas Gluten (Gluten-Free)?',
    answer:
      'Ya, seluruh produk Bestari diolah di fasilitas terpisah yang khusus menangani biji-bijian bebas gluten untuk menjamin tidak ada kontaminasi silang gandum.',
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
    answer:
      'Simpan produk dalam wadah kedap udara di tempat yang sejuk, kering, dan terhindar dari sinar matahari langsung. Untuk daya simpan maksimal hingga 12 bulan, Anda dapat menyimpannya di dalam kulkas.',
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
    answer:
      'Sorgum putih memiliki rasa yang cenderung lembut dan netral, sangat cocok untuk konsumsi harian pengganti beras putih. Sorgum hitam memiliki rasa lebih umami/rich, serat lebih tinggi, serta kaya antioksidan antosianin alami.',
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
    answer:
      'Kami menerima berbagai metode pembayaran instan dan aman, meliputi Transfer Bank (BCA, Mandiri, BRI, BNI), QRIS, E-Wallet (GoPay, OVO, ShopeePay), serta sistem COD (Bayar di Tempat).',
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
    answer:
      'Ya, minimal pembelian sebesar Rp 150.000 berhak mendapatkan voucher subsidi ongkos kirim hingga Rp 20.000 ke seluruh kota di Indonesia.',
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
    answer:
      'Estimasi pengiriman untuk wilayah Jabodetabek dan Jawa Barat adalah 1-2 hari kerja. Untuk wilayah Pulau Jawa lainnya 2-3 hari kerja, dan luar Pulau Jawa berkisar 3-7 hari kerja tergantung opsi kurir ekpedisi.',
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
    answer:
      'Seluruh produk dikemas menggunakan corrugated box tebal dan bubble wrap. Namun jika terdapat kendala kerusakan, silakan foto/video unboxing dan hubungi Tim CS via WhatsApp dalam 2x24 jam untuk pengiriman ulang gratis.',
    status: 'AKTIF',
    order: 7,
    tags: ['garansi', 'retur', 'unboxing'],
    updatedAt: '2023-10-10 13:10',
    viewsCount: 620,
  },
];

const loadFromStorage = (): FaqItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading FAQs from localStorage:', err);
  }
  // Fallback to initial mock data
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_FAQS));
  } catch (e) {
    // Ignore storage write errors
  }
  return INITIAL_MOCK_FAQS;
};

const saveToStorage = (faqs: FaqItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(faqs));
  } catch (err) {
    console.error('Error saving FAQs to localStorage:', err);
  }
};

export const faqApi = {
  // Get public active FAQs sorted by order
  getFaqs: async (): Promise<FaqItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const all = loadFromStorage();
    return all
      .filter((f) => f.status === 'AKTIF' || f.status === undefined)
      .sort((a, b) => (a.order || 99) - (b.order || 99));
  },

  // Get all FAQs for Admin management (includes DRAFTs)
  getAdminFaqs: async (): Promise<FaqItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const all = loadFromStorage();
    return all.sort((a, b) => (a.order || 99) - (b.order || 99));
  },

  // Save (Create or Update) FAQ item
  saveFaq: async (faqData: Partial<FaqItem>): Promise<FaqItem> => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const current = loadFromStorage();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let savedItem: FaqItem;

    if (faqData.id) {
      // Edit mode
      let found = false;
      const updated = current.map((item) => {
        if (item.id === faqData.id) {
          found = true;
          savedItem = {
            ...item,
            question: faqData.question || item.question,
            answer: faqData.answer || item.answer,
            category: faqData.category || item.category,
            status: faqData.status || item.status || 'AKTIF',
            order: faqData.order !== undefined ? faqData.order : item.order || current.length,
            tags: faqData.tags || item.tags || [],
            updatedAt: nowStr,
          };
          return savedItem;
        }
        return item;
      });

      if (!found) {
        // ID provided but not found -> treat as new
        savedItem = {
          id: faqData.id,
          question: faqData.question || '',
          answer: faqData.answer || '',
          category: faqData.category || 'Lainnya',
          status: faqData.status || 'AKTIF',
          order: faqData.order !== undefined ? faqData.order : current.length + 1,
          tags: faqData.tags || [],
          updatedAt: nowStr,
          viewsCount: 0,
        };
        updated.push(savedItem);
      }
      saveToStorage(updated);
    } else {
      // Create mode
      const nextNum = current.length + 1;
      const newId = `FAQ-${String(nextNum).padStart(3, '0')}`;
      savedItem = {
        id: newId,
        question: faqData.question || '',
        answer: faqData.answer || '',
        category: faqData.category || 'Produk & Nutrisi',
        status: faqData.status || 'AKTIF',
        order: faqData.order !== undefined ? faqData.order : current.length + 1,
        tags: faqData.tags || [],
        updatedAt: nowStr,
        viewsCount: 0,
      };
      const updated = [savedItem, ...current];
      saveToStorage(updated);
    }

    return savedItem;
  },

  // Toggle Status (AKTIF <-> DRAFT)
  toggleStatus: async (id: string): Promise<FaqItem | null> => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const current = loadFromStorage();
    let updatedItem: FaqItem | null = null;

    const updated = current.map((f) => {
      if (f.id === id) {
        const newStatus: 'AKTIF' | 'DRAFT' = f.status === 'AKTIF' ? 'DRAFT' : 'AKTIF';
        updatedItem = {
          ...f,
          status: newStatus,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };
        return updatedItem;
      }
      return f;
    });

    saveToStorage(updated);
    return updatedItem;
  },

  // Delete FAQ item
  deleteFaq: async (id: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const current = loadFromStorage();
    const filtered = current.filter((f) => f.id !== id);
    saveToStorage(filtered);
    return true;
  },

  // Move FAQ Order Up/Down
  reorderFaq: async (id: string, direction: 'UP' | 'DOWN'): Promise<FaqItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const current = loadFromStorage();
    const index = current.findIndex((f) => f.id === id);

    if (index === -1) return current;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return current;

    // Swap positions
    const temp = current[index];
    current[index] = current[targetIndex];
    current[targetIndex] = temp;

    // Reassign order indices
    const updated = current.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    saveToStorage(updated);
    return updated;
  },
};
