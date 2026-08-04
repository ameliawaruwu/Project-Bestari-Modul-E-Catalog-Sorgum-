import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Article, FaqItem, CartItem, User, Order, LoginPayload, RegisterPayload, AuthResponse } from '../types';
import { BannerSlide } from '../types/admin';
import { productApi } from '../api/productApi';
import { articleApi } from '../api/articleApi';
import { faqApi } from '../api/faqApi';
import { shopSettingsApi, ShopSettings as ApiShopSettings } from '../api/shopSettingsApi';
import { orderApi } from '../api/orderApi';
import { authApi } from '../api/authApi';
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
    return raw ? JSON.parse(raw) : [];
  });

  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    const raw = localStorage.getItem('bestari_faqs_v1');
    return raw ? JSON.parse(raw) : [];
  });

  const [articles, setArticles] = useState<Article[]>(() => {
    const raw = localStorage.getItem('bestari_articles_v1');
    return raw ? JSON.parse(raw) : [];
  });

  const [banners, setBanners] = useState<BannerSlide[]>(() => {
    const raw = localStorage.getItem('bestari_banners_v1');
    return raw ? JSON.parse(raw) : [];
  });

  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => {
    const raw = localStorage.getItem('bestari_shop_settings_v1');
    return raw ? JSON.parse(raw) : { storeName: 'BESTARI', logoUrl: '', qrisImageUrl: '', qrisNmid: '', whatsappNumber: '', qrisStatus: 'AKTIF' };
  });

  const [landingContent, setLandingContent] = useState<LandingContent>(() => {
    const raw = localStorage.getItem('bestari_landing_content_v1');
    const empty: LandingContent = { heroTitleId: '', heroTitleEn: '', heroDescId: '', heroDescEn: '', heroBtnId: '', heroBtnEn: '', storyTaglineId: '', storyTaglineEn: '', storyTitleId: '', storyTitleEn: '', storyDesc1Id: '', storyDesc1En: '', storyDesc2Id: '', storyDesc2En: '', storyImageUrl: '', benefitsTitleId: '', benefitsTitleEn: '', benefitsDescId: '', benefitsDescEn: '', benefit1TitleId: '', benefit1TitleEn: '', benefit1DescId: '', benefit1DescEn: '', benefit1Icon: '', benefit2TitleId: '', benefit2TitleEn: '', benefit2DescId: '', benefit2DescEn: '', benefit2Icon: '', benefit3TitleId: '', benefit3TitleEn: '', benefit3DescId: '', benefit3DescEn: '', benefit3Icon: '', featuredTitleId: '', featuredTitleEn: '', featuredDescId: '', featuredDescEn: '' };
    return raw ? JSON.parse(raw) : empty;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const raw = localStorage.getItem('bestari_orders');
    return raw ? JSON.parse(raw) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const raw = localStorage.getItem('bestari_cart_items');
    return raw ? JSON.parse(raw) : [];
  });

  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

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
        try { localStorage.removeItem('bestari_current_user'); } catch { /* ignore */ }
      }
    });

    // Products
    productApi.getProducts().then((list) => {
      if (!cancelled) {
        setProducts(list);
        localStorage.setItem('bestari_products_v1', JSON.stringify(list));
      }
    }).catch(() => {});

    // Articles
    articleApi.getArticles().then((list) => {
      if (!cancelled) {
        setArticles(list);
        localStorage.setItem('bestari_articles_v1', JSON.stringify(list));
      }
    }).catch(() => {});

    // FAQs
    faqApi.getFaqs().then((list) => {
      if (!cancelled) {
        setFaqs(list);
        localStorage.setItem('bestari_faqs_v1', JSON.stringify(list));
      }
    }).catch(() => {});

    // Shop settings
    shopSettingsApi.getSettingsAsync().then((s) => {
      if (!cancelled) {
        setShopSettings(s as unknown as ShopSettings);
        localStorage.setItem('bestari_shop_settings_v1', JSON.stringify(s));
      }
    }).catch(() => {});

    // Banners (via /api/banners public — map ke BannerSlide)
    // TODO: bannerApi belum ada di src/api; fetch langsung
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
        localStorage.setItem('bestari_banners_v1', JSON.stringify(mapped));
      }
    }).catch(() => {});

    // Orders (auth required — hanya kalau ada token)
    if (getToken()) {
      orderApi.getOrders().then((list) => {
        if (!cancelled) {
          setOrders(list);
          localStorage.setItem('bestari_orders', JSON.stringify(list));
        }
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
    // Sync ke backend (PUT /admin/settings) + cache lokal — jangan cuma localStorage
    const updated = shopSettingsApi.saveSettings(settings);
    setShopSettings(updated);
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

    try {
      const res = await authApi.login(payload);
      if (res.success && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('bestari_current_user', JSON.stringify(res.user));
        // Load orders for logged-in user
        orderApi.getOrders().then((list) => {
          setOrders(list);
          localStorage.setItem('bestari_orders', JSON.stringify(list));
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
        localStorage.setItem('bestari_current_user', JSON.stringify(res.user));
      }
      return res;
    } catch (e: any) {
      return { success: false, message: e?.message || 'Pendaftaran gagal. Silakan coba lagi.' };
    }
  };

  const logout = async () => {
    setCurrentUser(null);
    localStorage.removeItem('bestari_current_user');
    localStorage.removeItem('bestari_token');
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
    // Sync ke backend (fire-and-forget; gagal gak ngeblokir UI)
    orderApi.saveCart(updated).catch(() => {});
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    const updated = cart
      .map((item) => (item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item))
      .filter((item) => item.quantity > 0);
    updateCart(updated);
    orderApi.saveCart(updated).catch(() => {});
  };

  const removeCartItem = (productId: string) => {
    const updated = cart.filter((item) => item.product.id !== productId);
    updateCart(updated);
    orderApi.saveCart(updated).catch(() => {});
  };

  const clearCart = () => {
    updateCart([]);
    orderApi.saveCart([]).catch(() => {});
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
