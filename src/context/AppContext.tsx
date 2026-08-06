import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Article, FaqItem, CartItem, User, Order, LoginPayload, RegisterPayload, AuthResponse } from '../types';
import { BannerSlide } from '../types/admin';
import { productApi } from '../api/productApi';
import { articleApi } from '../api/articleApi';
import { faqApi } from '../api/faqApi';
import { shopSettingsApi, ShopSettings as ApiShopSettings } from '../api/shopSettingsApi';
import { orderApi } from '../api/orderApi';
import { authApi } from '../api/authApi';
import { wishlistApi } from '../api/wishlistApi';
import { landingContentApi } from '../api/landingContentApi';
import { request, getToken } from '../api/http';

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
  // JSON array of product ids untuk section "Koleksi Produk Pilihan" (diatur admin)
  featuredProductIds: string;
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

  // Wishlist / Favorit
  wishlistIds: Record<string, number>; // productId -> wishlist_id
  toggleWishlist: (productId: string) => Promise<boolean>;
  isFavorite: (productId: string) => boolean;

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
  appliedVoucherCode: string | null;
  setAppliedVoucherCode: (val: string | null) => void;
  refreshProducts: () => Promise<Product[]>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Initial default data definitions
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_FAQS: FaqItem[] = [];
const INITIAL_ARTICLES: Article[] = [];
const INITIAL_BANNERS: BannerSlide[] = [];

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
  storyDesc1Id: 'Di Sorgum, kami percaya bahwa kesehatan sejati dimulai dari apa yang ditanam oleh alam secara murni. Bersama para petani mitra lokal, kami menghidupkan kembali sorgum—tanaman super (*superfood*) kaya serat and bebas gluten yang telah menutrisi generasi sebelum kita.',
  storyDesc1En: 'At Sorgum, we believe that true health starts from what nature grows purely. Together with local partner farmers, we revive sorghum—a fiber-rich and gluten-free superfood that has nourished generations before us.',
  storyDesc2Id: 'Setiap butir Sorgum adalah wujud komitmen kami untuk menghadirkan kualitas terbaik dari tanah Indonesia langsung ke meja makan keluarga Anda, sambil melestarikan keseimbangan ekosistem bumi.',
  storyDesc2En: 'Every grain of Sorgum is a testament to our commitment to bringing the finest quality from Indonesian soil straight to your family dining table, while preserving the balance of the Earth\'s ecosystem.',
  storyImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1920',
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
  featuredProductIds: '',
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
  const [products, setProducts] = useState<Product[]>([]);

  // Wishlist / Favorit — productId -> wishlist_id (row id di tabel wishlists).
  // Di-load dari BE saat mount kalau login; dipakai ProductCard & Detail.
  const [wishlistIds, setWishlistIds] = useState<Record<string, number>>({});

  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  const [articles, setArticles] = useState<Article[]>([]);

  const [banners, setBanners] = useState<BannerSlide[]>([]);

  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    storeName: 'SORGUM', logoUrl: '', qrisImageUrl: '', qrisNmid: '', whatsappNumber: '', qrisStatus: 'AKTIF',
  });

  // Default konten landing page — data UI saja (disimpan di localStorage,
  // TIDAK pernah dikirim ke backend). Dipakai agar beranda tidak kosong saat
  // localStorage belum terisi (hero, "Kisah Kami", benefits, featured).
  const DEFAULT_LANDING_CONTENT: LandingContent = {
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

  const [landingContent, setLandingContent] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);

  const [orders, setOrders] = useState<Order[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // ─── Cart = SERVER-AUTHORITATIVE (DB) ──────────────────────────────────
  // Cart TIDAK disimpan di localStorage lagi — sumber kebenaran = DB (cart_items),
  // per-user_id (login) / session_id (guest). localStorage cuma nyimpen
  // session id (bestari_cart_items_) sebagai identifier guest, bukan data cart.
  // Guest cart juga server-side (session_id) — login/register merge via
  // endpoint BE POST /cart/merge (session -> user). Key 'bestari_cart_items_'
  // di localStorage cuma sisa versi lama, dihapus pas merge (cleanup).
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart dari server (dipakai mount/hydrate, login, register, refresh)
  const refreshCart = async () => {
    const serverCart = await orderApi.getCart().catch(() => []);
    setCart(serverCart);
    return serverCart;
  };

  // Load products dari server (dipakai admin toggle status / setelah edit)
  const refreshProducts = async () => {
    const list = await productApi.getProducts().catch(() => []);
    setProducts(list);
    return list;
  };

  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | null>(null);

  // ============================================================
  // HYDRATE FROM BACKEND — ganti data mock/localStorage dengan data BE
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    // Validasi sesi ke backend: kalau token ada tapi invalid/expired,
    // getCurrentUser bersihin cache + return null — sesi admin/user lama
    // yang nyangkut di localStorage gak bakal ke-render lagi.
    authApi.getCurrentUser().then((fresh) => {
      if (!cancelled) setCurrentUser(fresh);
      // Gak ada sesi valid → hapus cache lama (admin/user basi) biar gak ke-render lagi
      if (!fresh) {
        try { localStorage.removeItem('bestari_cart_items_'); } catch { /* ignore */ }
      }
    });

    // Cart dari SERVER (sumber kebenaran DB) — user login via token,
    // guest via x-session-id (request() kirim otomatis). Refresh biar
    // cart muncul walau halaman di-refresh / buka tab baru.
    refreshCart().catch(() => {});

    // Products
    productApi.getProducts().then((list) => {
      if (!cancelled) {
        setProducts(list);
      }
    }).catch(() => {});

    // Articles
    articleApi.getArticles().then((list) => {
      if (!cancelled) {
        setArticles(list);
      }
    }).catch(() => {});

    // FAQs
    faqApi.getFaqs().then((list) => {
      if (!cancelled) {
        setFaqs(list);
      }
    }).catch(() => {});

    // Shop settings
    shopSettingsApi.getSettingsAsync().then((s) => {
      if (!cancelled) {
        setShopSettings(s as unknown as ShopSettings);
      }
    }).catch(() => {});

    // Banners (via /api/banners public — map ke BannerSlide).
    // JANGAN cache ke localStorage — banner yang di-nonaktifkan di admin
    // harus langsung hilang dari beranda (bukan snapshot basi).
    request('/banners').then((res: any) => {
      if (!cancelled && res?.data) {
        const mapped: BannerSlide[] = (res.data as any[]).map((b: any) => ({
          id: String(b.id),
          title: b.title,
          uploadDate: b.created_at ? new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
          targetLink: b.target_link || '',
          image: b.image_url || '',
          active: !!b.is_active,
        }));
        setBanners(mapped);
      }
    }).catch(() => {});

    // Landing content (konten beranda) — dari BE, bukan localStorage
    landingContentApi.getLandingContent().then((content) => {
      if (!cancelled) {
        // Merge: konten dari server menang, key yang belum ada diisi default
        setLandingContent((prev) => ({ ...prev, ...content }));
      }
    }).catch(() => {});

    // Orders (auth required — hanya kalau ada token)
    if (getToken()) {
      orderApi.getOrders().then((list) => {
        if (!cancelled) {
          setOrders(list);
        }
      }).catch(() => {});

      // Wishlist (auth required) — load favorit user
      wishlistApi.getWishlist().then((items) => {
        if (cancelled) return;
        const idMap: Record<string, number> = {};
        items.forEach((w) => {
          if (w.id) idMap[String(w.id)] = Number((w as any).wishlist_id || 0);
        });
        setWishlistIds(idMap);
      }).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, []);

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
  };

  const updateFaqs = (newFaqs: FaqItem[]) => {
    setFaqs(newFaqs);
  };

  const updateArticles = (newArticles: Article[]) => {
    setArticles(newArticles);
  };

  const updateBanners = (newBanners: BannerSlide[]) => {
    setBanners(newBanners);
    // Tidak di-cache ke localStorage — sumber kebenaran = server.
    // Banner yang dinonaktifkan/dihapus di admin harus langsung hilang
    // dari beranda setelah reload (fetch ulang dari /api/banners).
  };

  const saveShopSettings = (settings: Partial<ShopSettings>) => {
    // Sync ke backend (PUT /admin/settings) + cache lokal — jangan cuma localStorage
    const updated = shopSettingsApi.saveSettings(settings);
    setShopSettings(updated);
  };

  const saveLandingContent = (content: LandingContent) => {
    setLandingContent(content);
    // Simpan ke BE (admin only) — localStorage TIDAK dipakai lagi.
    landingContentApi.saveLandingContent(content as unknown as Record<string, string>);
  };

  const updateOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
  };

  const updateCart = (newCart: CartItem[]) => {
    // Cart server-authoritative: state cuma mirror dari DB, tidak ditulis ke localStorage.
    setCart(newCart);
  };

  // Auth Helpers
  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    if (!payload.email || !payload.password) {
      return { success: false, message: 'Mohon masukkan email dan kata sandi Anda.' };
    }

    try {
      const res = await authApi.login(payload);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('bestari_cart_items_', JSON.stringify(res.user));

        // ─── Cart di login (server-authoritative) ─────────────────────────
        // 1) Merge cart guest (localStorage key '') ke server cart user —
        //    item guest di-add kalau belum ada, item server TETAP.
        // 2) Refresh cart dari SERVER — sumber kebenaran DB per-user.
        await orderApi.mergeCart().catch(() => {});
        await refreshCart();

        // Load orders for logged-in user
        orderApi.getOrders().then((list) => {
          setOrders(list);
        }).catch(() => {});
      }
      return res;
    } catch (e: any) {
      return { success: false, message: e?.message || 'Login gagal. Silakan coba lagi.' };
    }
  };

  const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    if (!payload.email || !payload.password || !payload.name) {
      return { success: false, message: 'Mohon lengkapi seluruh data pendaftaran.' };
    }
    if (payload.password.length < 6) {
      return { success: false, message: 'Kata sandi minimal harus 6 karakter.' };
    }

    try {
      const res = await authApi.register(payload);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('bestari_cart_items_', JSON.stringify(res.user));

        // ─── Cart di register (server-authoritative) ──────────────────────
        // User baru: server cart kosong. Merge cart guest (localStorage key '')
        // ke akun baru biar gak hilang setelah daftar, lalu refresh dari server.
        await orderApi.mergeCart().catch(() => {});
        await refreshCart();
      }
      return res;
    } catch (e: any) {
      return { success: false, message: e?.message || 'Pendaftaran gagal. Silakan coba lagi.' };
    }
  };

  const logout = async () => {
    // Hapus token + user dari localStorage DULU (authApi.logout = setToken(null) + remove bestari_current_user).
    // Sebelumnya cuma set state React — localStorage `bestari_session_id` & `bestari_current_user`
    // masih ada → setelah reload readUser() baca user lama → session nyangkut, gabisa logout/login.
    await authApi.logout();
    // Cart server-authoritative: gak usah simpan ke localStorage — sumber di DB.
    // Kosongin state — jangan sampai cart user A kebawa ke user B/guest.
    setCurrentUser(null);
    setCart([]);
    setWishlistIds({});
    setAppliedDiscount(0);
    try { localStorage.removeItem('bestari_cart_items_'); } catch { /* ignore */ }
  };

  // Wishlist / Favorit helpers
  const isFavorite = (productId: string) => String(productId) in wishlistIds;

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    const pid = String(productId);
    const existingId = wishlistIds[pid];
    if (existingId) {
      // Hapus dari favorit
      const ok = await wishlistApi.removeFromWishlist(existingId);
      if (ok) {
        const next = { ...wishlistIds };
        delete next[pid];
        setWishlistIds(next);
        return true;
      }
      return false;
    }
    // Tambah ke favorit
    const ok = await wishlistApi.addToWishlist(pid);
    if (ok) {
      // Dapatkan wishlist_id dari server (untuk bisa hapus nanti)
      const list = await wishlistApi.getWishlist().catch(() => null);
      const row = list?.find((w) => String(w.id) === pid);
      setWishlistIds((prev) => ({
        ...prev,
        [pid]: Number(row?.wishlist_id || 0),
      }));
      return true;
    }
    return false;
  };

  // Product CRUD
  const saveProduct = (productData: any) => {
    // Harga jual final = harga asli × (1 - diskon%)
    const baseP = Number(productData.price) || 0;
    const pctP = Math.max(0, Math.min(90, Number(productData.discountPercent) || 0));
    const finalPrice = pctP > 0 ? Math.round((baseP * (100 - pctP)) / 100 / 50) * 50 : baseP;
    const payload = { ...productData, price: finalPrice, originalPrice: baseP };
    // Pakai payload (price final) untuk semua referensi di bawah
    productData = payload;
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
              originalPrice: productData.originalPrice,
              discountPercent: productData.discountPercent,
              composition: productData.composition,
              shelfLife: productData.shelfLife,
              attributes: productData.attributes,
              unitInfo: productData.unitInfo,
              weight: productData.weight,
              badge: productData.badge || undefined,
              image: productData.image,
              description: productData.description,
              glutenFree: !!productData.glutenFree,
              organic: !!productData.organic,
              shippingInfo: productData.shippingInfo,
              stock: Number(productData.stock) || undefined,
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
          originalPrice: productData.originalPrice,
          discountPercent: productData.discountPercent,
          composition: productData.composition,
          shelfLife: productData.shelfLife,
          attributes: productData.attributes,
          glutenFree: !!productData.glutenFree,
          organic: !!productData.organic,
          shippingInfo: productData.shippingInfo,
          stock: Number(productData.stock) || undefined,
        };
        updateProducts([newProd, ...products]);
      }
    } else {
      // Produk baru: id ASLI dari BE sudah di-set oleh caller (AdminPage) —
      // jangan generate id palsu `prod-<timestamp>` (bikin edit/delete 404).
      const newId = productData.id || `prod-${Date.now()}`;
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
        originalPrice: productData.originalPrice,
        discountPercent: productData.discountPercent,
        composition: productData.composition,
        shelfLife: productData.shelfLife,
        attributes: productData.attributes,
        glutenFree: !!productData.glutenFree,
        organic: !!productData.organic,
        shippingInfo: productData.shippingInfo,
      };
      updateProducts([newProd, ...products]);
    }
  };

  const deleteProduct = (id: string) => {
    const filtered = products.filter((p) => p.id !== id);
    updateProducts(filtered);
  };

  // FAQ CRUD — SYNC KE BACKEND (sebelumnya localStorage only, hilang pas refresh)
  const saveFaq = async (faqData: any) => {
    const saved = await faqApi.saveFaq({
      id: faqData.id,
      question: faqData.question,
      answer: faqData.answer,
      category: faqData.category || 'Tentang Produk',
      status: faqData.status || 'AKTIF',
      order: faqData.order,
      tags: faqData.tags || [],
    });
    // Refresh dari BE biar dapet id asli dari DB
    const fresh = await faqApi.getAdminFaqs().catch(() => []);
    if (fresh.length > 0) updateFaqs(fresh);
    return saved;
  };

  const deleteFaq = async (id: string) => {
    await faqApi.deleteFaq(id);
    const filtered = faqs.filter((f) => f.id !== id);
    updateFaqs(filtered);
  };

  const toggleFaqStatus = async (id: string) => {
    const flipped = await faqApi.toggleStatus(id);
    if (flipped) {
      const updated = faqs.map((f) => (f.id === id ? { ...f, status: flipped.status } : f));
      updateFaqs(updated);
    }
  };

  const reorderFaq = async (id: string, direction: 'UP' | 'DOWN') => {
    const reordered = await faqApi.reorderFaq(id, direction);
    if (reordered.length > 0) updateFaqs(reordered);
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
            contentBlocks: articleData.contentBlocks || a.contentBlocks,
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
        contentBlocks: articleData.contentBlocks,
        image: articleData.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
        date: dateStr,
        author: articleData.author || 'Tim Sorgum',
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
    // Optimistic UI: tambah ke state dulu, sync ke DB (fire-and-forget).
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...cart];
      updated[existingIndex].quantity += quantity;
    } else {
      updated = [...cart, { product, quantity }];
    }
    updateCart(updated);
    // Server-authoritative: add via API (snapshot owner di dalam request).
    // Refresh di sukses DAN gagal: item hasil optimistic update tidak punya
    // __cartRowId, dan mutasi qty/hapus berikutnya butuh row id dari server.
    // Tanpa ini tombol qty +/- di keranjang tidak mengubah apa-apa (bug).
    orderApi.addToCartServer(product, quantity).finally(() => {
      refreshCart();
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    const target = cart.find((item) => item.product.id === productId);
    if (!target) return;
    const newQty = target.quantity + delta;
    const updated = cart
      .map((item) => (item.product.id === productId ? { ...item, quantity: newQty } : item))
      .filter((item) => item.quantity > 0);
    updateCart(updated);
    // API: kalau qty <= 0 hapus item, kalau > 0 update qty.
    const rowId = target.__cartRowId;
    if (newQty <= 0) {
      if (rowId) orderApi.removeCartItemServer(rowId).catch(() => refreshCart());
    } else if (rowId) {
      orderApi.updateCartQtyServer(rowId, newQty).catch(() => refreshCart());
    } else {
      // Row id belum ada (mis. item baru dari guest merge?) — fallback refresh
      refreshCart();
    }
  };

  const removeCartItem = (productId: string) => {
    const target = cart.find((item) => item.product.id === productId);
    if (!target) return;
    const updated = cart.filter((item) => item.product.id !== productId);
    updateCart(updated);
    // Server-authoritative: hapus dari DB kalau rowId ada.
    // Kalau rowId undefined (item baru, belum sync dari server), hapus dari
    // state saja — jangan refreshCart() karena item masih ada di server
    // dan akan balik lagi (ghosting).
    const rowId = target.__cartRowId;
    if (rowId) {
      orderApi.removeCartItemServer(rowId).catch(() => refreshCart());
    }
    // no rowId: item belum di server, tidak perlu aksi
  };

  const clearCart = () => {
    const rowIds = cart.map((item) => item.__cartRowId).filter(Boolean) as number[];
    updateCart([]);
    if (rowIds.length) orderApi.clearCartServer(rowIds).catch(() => refreshCart());
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
        wishlistIds,
        toggleWishlist,
        isFavorite,
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
        appliedVoucherCode,
        setAppliedVoucherCode,
        refreshProducts,
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
