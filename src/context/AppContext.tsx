import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product, Article, FaqItem, User, LoginPayload, RegisterPayload, AuthResponse } from '../types';
import { BannerSlide } from '../types/admin';
import { productApi } from '../api/productApi';
import { articleApi } from '../api/articleApi';
import { faqApi } from '../api/faqApi';
import { shopSettingsApi, ShopSettings as ApiShopSettings } from '../api/shopSettingsApi';
import { formatDate } from '../utils/formatDate';
import { authApi } from '../api/authApi';
import { wishlistApi } from '../api/wishlistApi';
import { landingContentApi } from '../api/landingContentApi';
import { request, getToken } from '../api/http';
import { realtimeApi } from '../api/realtimeApi';
import i18n from '../i18n';
import { LandingContent, DEFAULT_LANDING_CONTENT } from './defaults';
import { mapBannerRow } from './mappers';

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
  shippingCost?: number;
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
  saveFaq: (faqData: any) => Promise<FaqItem>;
  deleteFaq: (id: string) => Promise<void>;
  toggleFaqStatus: (id: string) => Promise<void>;
  reorderFaq: (id: string, direction: 'UP' | 'DOWN') => Promise<void>;

  // Articles / Information
  articles: Article[];
  saveArticle: (articleData: any) => void;
  deleteArticle: (id: string) => void;

  // Banners
  banners: BannerSlide[];
  saveBanner: (bannerData: { id?: string; title: string; titleEn?: string; targetLink: string; image: string }) => void;
  deleteBanner: (id: string) => void;
  toggleBanner: (id: string) => void;

  // Shop Settings
  shopSettings: ShopSettings;
  saveShopSettings: (settings: Partial<ShopSettings>) => Promise<boolean>;

  // Landing Page Content
  landingContent: LandingContent;
  saveLandingContent: (content: LandingContent) => Promise<boolean>;

  // Auth
  currentUser: User | null;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;

  refreshProducts: () => Promise<Product[]>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Lang & Theme
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved === 'en' || saved === 'id') ? saved : 'id';
  });

  // Sinkronkan state `language` dengan i18n + paksa re-render semua pemakai t().
  // toggleLanguage hanya memanggil i18n.changeLanguage (sumber kebenaran tunggal).
  // Komponen yang baca `language` (mis. konten DB landing) tetap dapat nilai akurat.
  const [, forceLang] = useState(0);
  useEffect(() => {
    const h = (lng: string) => {
      const lang: Language = lng === 'en' ? 'en' : 'id';
      setLanguage(lang);
      document.documentElement.setAttribute('lang', lang);
      forceLang((n) => n + 1); // re-render semua yang pakai t()
    };
    i18n.on('languageChanged', h);
    return () => { i18n.off('languageChanged', h); };
  }, []);

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    // Default LIGHT selalu — jangan ikut prefers-color-scheme OS (user minta light default)
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
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

  const [landingContent, setLandingContent] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // ─── Auth generation guard (anti race login) ──────────────────────────────
  // Bug "login gk langsung masuk, harus refresh dulu" = race condition:
  // getCurrentUser() async (dipanggil saat mount) selesai BELAKANGAN setelah
  // login() sukses setCurrentUser(user) → response lama (null/guest) MENIMPA
  // user baru → UI balik jadi guest → harus refresh supaya jalan ulang.
  // Fix: generation counter. Setiap login/logout/register naikkan; hasil async
  // (getCurrentUser, refreshCart, dll) hanya di-apply kalau generation masih
  // sama — kalau sudah login ulang, response basi diabaikan.
  const authGenerationRef = useRef(0);
  const bumpAuthGeneration = () => { authGenerationRef.current += 1; };

  // Load products dari server (dipakai admin toggle status / setelah edit)
  const refreshProducts = async () => {
    const list = await productApi.getProducts().catch(() => []);
    setProducts(list);
    return list;
  };

  // ─── Promo/voucher (state checkout) — dihapus bersama fitur checkout (2026-08-27)

  // ============================================================
  // HYDRATE FROM BACKEND — ganti data mock/localStorage dengan data BE
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    // Validasi sesi ke backend: kalau token ada tapi invalid/expired,
    // getCurrentUser bersihin cache + return null — sesi admin/user lama
    // yang nyangkut di localStorage gak bakal ke-render lagi.
    const mountGen = authGenerationRef.current;
    authApi.getCurrentUser().then((fresh) => {
      // Guard anti race: kalau user SUDAH login/register (generation naik)
      // saat request ini berjalan, JANGAN timpa user baru dengan hasil basi.
      if (!cancelled && authGenerationRef.current === mountGen) {
        setCurrentUser(fresh);
        // Gak ada sesi valid → hapus cache lama (admin/user basi) biar gak ke-render lagi
        if (!fresh) {
          try { localStorage.removeItem('bestari_cart_items_'); } catch { /* ignore */ }
        }
      }
    });

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
        setBanners((res.data as any[]).map(mapBannerRow));
      }
    }).catch(() => {});

    // Landing content (konten beranda) — dari BE, bukan localStorage
    landingContentApi.getLandingContent().then((content) => {
      if (!cancelled) {
        // Merge: konten dari server menang, key yang belum ada diisi default
        setLandingContent((prev) => ({ ...prev, ...content }));
      }
    }).catch(() => {});

    // Wishlist (auth required) — load favorit user
    if (getToken()) {
      wishlistApi.getWishlist().then((items) => {
        if (cancelled) return;
        const idMap: Record<string, number> = {};
        items.forEach((w) => {
          if (w.id) idMap[String(w.id)] = Number((w as any).wishlist_id || 0);
        });
        setWishlistIds(idMap);
      }).catch(() => {});
    }

    // ─── Multi-tab sync (anti "kecolongan" sesi) ─────────────────────────────
    // Browser: 1 localStorage per origin → 2 tab (admin & user) berbagi token.
    // Kalau tab A logout/login user lain, tab B tidak tahu → state React tab B
    // tetap user lama → tampil data lama / pakai token basi ("kecolongan").
    // Solusi: dengarkan `storage` event (dipicu saat localStorage berubah di
    // TAB LAIN) → validasi ulang sesi + refresh data → tab B ikut sync.
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === null || e.key === 'bestari_session_id' || e.key === 'bestari_current_user' || e.key === 'bestari_guest_session') {
        // Token/user/session berubah di tab lain — validasi ulang sesi di tab ini.
        const genAtEvent = authGenerationRef.current;
        authApi.getCurrentUser().then((fresh) => {
          // Guard anti race: kalau user login/logout di tab INI (generation naik)
          // saat validasi berjalan, jangan timpa state dengan hasil basi.
          if (!cancelled && authGenerationRef.current === genAtEvent) {
            setCurrentUser(fresh);
            if (!fresh) {
              // Sesuai sesi baru: reset state pribadi (wishlist)
              setWishlistIds({});
            } else {
              // User login (bisa beda user) — refresh wishlist miliknya
              wishlistApi.getWishlist().then((items) => {
                if (cancelled || authGenerationRef.current !== genAtEvent) return;
                const idMap: Record<string, number> = {};
                items.forEach((w) => {
                  if (w.id) idMap[String(w.id)] = Number((w as any).wishlist_id || 0);
                });
                setWishlistIds(idMap);
              }).catch(() => {});
            }
          }
        });
      }
    };
    window.addEventListener('storage', onStorageChange);

    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorageChange);
    };
  }, []);

  // ─── REAL-TIME SYNC (SSE) ───────────────────────────────────────────────
  // Admin mutasi data → BE publish event → semua client (admin & user) refetch
  // data yang berubah → tampilan user langsung update tanpa refresh manual.
  // Data admin == data user, realtime. Subscribe sekali, auto-reconnect di client.
  useEffect(() => {
    const refreshProducts = () => {
      productApi.getProducts().then((list) => setProducts(list)).catch(() => {});
    };
    const refreshArticles = () => {
      articleApi.getArticles().then((list) => setArticles(list)).catch(() => {});
    };
    const refreshFaqs = () => {
      faqApi.getFaqs().then((list) => setFaqs(list)).catch(() => {});
    };
    const refreshBanners = () => {
      request('/banners').then((res: any) => {
        if (res?.data) {
          setBanners((res.data as any[]).map(mapBannerRow));
        }
      }).catch(() => {});
    };
    const refreshLanding = () => {
      landingContentApi.getLandingContent().then((content) => {
        setLandingContent((prev) => ({ ...prev, ...content }));
      }).catch(() => {});
    };
    const refreshSettings = () => {
      shopSettingsApi.getSettingsAsync().then((s) => {
        setShopSettings(s as unknown as ShopSettings);
      }).catch(() => {});
    };
    const refreshVouchers = () => {
      // Voucher public list — cart/checkout fetch sendiri, tapi biarkan
      // sinkron kalau ada komponen yang pakai state voucher.
      // (Tidak ada state voucher di context — voucher di-fetch per halaman.)
    };

    const unsubs = [
      realtimeApi.on('products', refreshProducts),
      realtimeApi.on('articles', refreshArticles),
      realtimeApi.on('faqs', refreshFaqs),
      realtimeApi.on('banners', refreshBanners),
      realtimeApi.on('landing', refreshLanding),
      realtimeApi.on('settings', refreshSettings),
      realtimeApi.on('vouchers', refreshVouchers),
    ];

    return () => {
      unsubs.forEach((u) => u());
      realtimeApi.disconnect();
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

  const saveShopSettings = async (settings: Partial<ShopSettings>): Promise<boolean> => {
    // Sync ke backend (PUT /admin/settings). return true kalau berhasil.
    const ok = await shopSettingsApi.saveSettings(settings);
    if (ok) {
      // Update state lokal hanya kalau PUT sukses — kalau gagal (413/network),
      // jangan timpa state dengan nilai yang sebenarnya tidak tersimpan.
      setShopSettings((prev) => ({ ...prev, ...settings }));
    }
    return ok;
  };

  // Simpan konten landing (admin only) — TUNGGU hasil PUT dari BE, baru update
  // state lokal. Sebelumnya fire-and-forget: kalau PUT gagal (403/sesi admin tidak
  // valid/network), state lokal tetap berubah → UI tampak "berhasil" padahal tidak
  // tersimpan → setelah reload hilang (bug "produk pilihan tidak berubah").
  // PENTING: update state pakai data HASIL BE (res.data), BUKAN objek kiriman —
  // BE return field *En hasil auto-translate; objek kiriman (contentForm admin)
  // tidak punya *En baru → halaman bahasa EN menampilkan terjemahan lama yang
  // tidak cocok dengan teks ID yang baru diedit ("form dan isi tidak sesuai").
  const saveLandingContent = async (content: LandingContent): Promise<boolean> => {
    const fresh = await landingContentApi.saveLandingContent(content as unknown as Record<string, string>);
    if (fresh) {
      setLandingContent((prev) => ({ ...prev, ...fresh }));
      return true;
    }
    return false;
  };

  // Auth Helpers
  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    if (!payload.email || !payload.password) {
      return { success: false, message: 'Mohon masukkan email dan kata sandi Anda.' };
    }

    try {
      const res = await authApi.login(payload);
      if (res.success && res.user) {
        // Naikkan generation DULU — hasil async lain yang masih berjalan
        // (getCurrentUser mount, refreshCart lama) dianggap basi, tidak
        // akan menimpa user baru ini.
        bumpAuthGeneration();
        setCurrentUser(res.user);
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
        bumpAuthGeneration();
        setCurrentUser(res.user);
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
    // Naikkan generation — hasil async selebihnya cukup dianggap basi;
    // JANGAN set currentUser dari response lama.
    bumpAuthGeneration();
    setCurrentUser(null);
    setWishlistIds({});
  };

  // Wishlist / Favorit helpers
  const isFavorite = (productId: string) => String(productId) in wishlistIds;

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    const pid = String(productId);
    const existingId = wishlistIds[pid];
    if (existingId !== undefined && existingId !== 0) {
      // Hapus dari favorit (pakai wishlist_id yang tersimpan)
      const ok = await wishlistApi.removeFromWishlist(existingId);
      if (ok) {
        const next = { ...wishlistIds };
        delete next[pid];
        setWishlistIds(next);
        return true;
      }
      return false;
    }
    // State tidak yakin (wishlist_id 0/absent tapi produk mungkin sudah di wishlist) —
    // cek server dulu: kalau ada, HAPUS (bukan add) supaya unlike tidak berubah jadi
    // "sudah ada" yang tetap nyangkut di DB.
    const list = await wishlistApi.getWishlist().catch(() => null);
    const existing = list?.find((w) => String(w.id) === pid);
    if (existing) {
      const ok = await wishlistApi.removeFromWishlist(existing.wishlist_id || 0);
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
      const freshList = await wishlistApi.getWishlist().catch(() => null);
      const row = freshList?.find((w) => String(w.id) === pid);
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
    const dateStr = formatDate(new Date(), 'long');

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
            // Tanpa fallback gambar — kalau admin hapus gambar (articleData.image=''),
            // state harus kosong juga (sebelumnya fallback a.image/unsplash membuat
            // gambar yang dihapus tetap muncul).
            image: articleData.image || '',
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
        image: articleData.image || '',
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
  const saveBanner = (bannerData: { id?: string; title: string; titleEn?: string; targetLink: string; image: string }) => {
    if (bannerData.id) {
      const updated = banners.map((b) => {
        if (b.id === bannerData.id) {
          return {
            ...b,
            title: bannerData.title,
            titleEn: bannerData.titleEn || undefined,
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

  // Translation helper — delegate ke i18next (sumber kebenaran TUNGGAL: i18n.language).
  // i18next dibentuk oleh src/i18n.ts dari src/locales/{id,en}.ts (generate
  // otomatis oleh tools/extract-i18n.mjs dari pasangan t('id','en')).
  // Fallback: kalau string tidak ada di kamus (mis. string baru yang belum
  // diextract), pakai ternary — jadi tidak ada string yang pernah kosong.
  // Race fix (2026-08-07): dulu baca state `language` (React) + i18n.language
  // dua sumber berbeda → saat toggle, React re-render lebih dulu dari
  // i18n.changeLanguage selesai → teks telat berganti (judul dulu, teks nanti).
  // Sekarang t() baca i18n.language langsung; re-render dipicu event
  // 'languageChanged' (di atas) — sinkron, tanpa telat.
  const t = (idText: string, enText: string): string => {
    const key = idText.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
    const tr = i18n.t(key);
    return tr && tr !== key ? tr : (i18n.language === 'en' ? enText : idText);
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'id' ? 'en' : 'id';
    i18n.changeLanguage(next); // event 'languageChanged' → forceLang → re-render semua t()
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
        currentUser,
        login,
        register,
        logout,
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
