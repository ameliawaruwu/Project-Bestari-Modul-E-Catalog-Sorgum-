import React, { useState, useEffect } from 'react';
import { User, Order, Product } from '../types';
import { AdminActiveNav, BannerSlide, ArticleItem, FAQItem } from '../types/admin';
import { orderApi, productApi, faqApi } from '../api';

import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { DashboardTab } from '../components/admin/DashboardTab';
import { LandingSettingsTab } from '../components/admin/LandingSettingsTab';
import { BannerFormView } from '../components/admin/BannerFormView';
import { ProductsTab } from '../components/admin/ProductsTab';
import { ProductFormView } from '../components/admin/ProductFormView';
import { ProductDeleteConfirmModal } from '../components/admin/ProductDeleteConfirmModal';
import { TransactionsTab } from '../components/admin/TransactionsTab';
import { OrderDetailView } from '../components/admin/OrderDetailView';
import { OrderDeleteConfirmModal } from '../components/admin/OrderDeleteConfirmModal';
import { InfoTab } from '../components/admin/InfoTab';
import { ArticleFormView } from '../components/admin/ArticleFormView';
import { ArticleDeleteConfirmModal } from '../components/admin/ArticleDeleteConfirmModal';
import { UsersTab } from '../components/admin/UsersTab';
import { FaqTab } from '../components/admin/FaqTab';
import { FaqFormView } from '../components/admin/FaqFormView';
import { OtherSettingsTab } from '../components/admin/OtherSettingsTab';

interface AdminPageProps {
  user: User | null;
  onNavigateHome: () => void;
  onLogout?: () => void;
  showToast: (msg: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  user,
  onNavigateHome,
  onLogout,
  showToast,
}) => {
  // Main Navigation State
  const [activeNav, setActiveNav] = useState<AdminActiveNav>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Sub-view Form States for Create/Edit Pages
  const [editingBanner, setEditingBanner] = useState<{ isEditing: boolean; banner?: BannerSlide | null } | null>(null);
  const [editingProduct, setEditingProduct] = useState<{ isEditing: boolean; product?: Product | null } | null>(null);
  const [editingArticle, setEditingArticle] = useState<{ isEditing: boolean; article?: ArticleItem | null } | null>(null);
  const [editingFaq, setEditingFaq] = useState<{ isEditing: boolean; faq?: FAQItem | null } | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<ArticleItem | null>(null);

  // Real & Mock Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [, setLoading] = useState(true);

  // Order selection & Proof Modal State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);

  // Banners state for Pengaturan Landing
  const [banners, setBanners] = useState<BannerSlide[]>([
    {
      id: 'b-1',
      title: 'Panen Raya Sorgum',
      uploadDate: '12 Okt 2023',
      targetLink: 'Informasi: Budidaya Lokal',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBedFkef0uf3wThSykVry5S0pnKGNteDPCI4H_u9wXo2Iw6MB2JV9-GWbXBPiXoIINPGG_JNRn_oUg7XoFYH7bLYib2-pxC1R6SOqYMFKB6AYHi1lZWglunj0vDmRrLXAXarWaqQd_yPAqs39gyfrHheQ1wByPzSpB_9OZQV86FLWiUFhpsZ4tuUTDD6NKfMzT3xfwdnRJrmP6dxJnap7TErQ6DfJ3IoO2_VWWB3XP8JuMSECFMNiBl',
      active: true,
    },
    {
      id: 'b-2',
      title: 'Premium Flour Promo',
      uploadDate: '05 Okt 2023',
      targetLink: 'Detail Produk: Tepung Sorgum Putih',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA8wY4rl62cbf__Lmm6OcK6rlnQkthCQP-y7zpoy-tBoB5HOLHpQwSJn0cXw3lZWP1Y8xHrsN1V-eWwjfECt57oXWKH3xB_2E0dg47SLfD7yxZcJfcm830KEZ5_aLP4-nh-4UQrLF4hYkurAbuRJyO065v-dquECxPRORXeR5oKsJONK4OD3xskagnGH9TCjYv5a8V9hq0Qxu0Mr4EQv9LftQeAey3sPDBrw5HPD5OCeqEsyZ7pAqdF',
      active: true,
    },
  ]);

  // Product Active Status & Stock Maps
  const [productActiveMap, setProductActiveMap] = useState<Record<string, boolean>>({
    'prod-1': true,
    'prod-2': true,
    'prod-3': true,
    'prod-4': true,
    'prod-5': true,
    'prod-6': true,
    'prod-7': true,
    'prod-8': true,
  });

  const [productStockMap, setProductStockMap] = useState<Record<string, number>>({
    'prod-1': 142,
    'prod-2': 88,
    'prod-3': 65,
    'prod-4': 30,
    'prod-5': 94,
    'prod-6': 120,
    'prod-7': 15,
    'prod-8': 50,
  });

  // Articles state for Kelola Info
  const [articles, setArticles] = useState<ArticleItem[]>([
    {
      id: 'art-1',
      title: 'Manfaat Bebas Gluten dari Sorghum Lokal',
      category: 'Kesehatan & Nutrisi',
      date: '10 Okt 2023',
      author: 'Tim Nutrisi Bestari',
      views: 342,
      content: 'Sorgum merupakan pangan lokal kaya serat yang 100% bebas gluten. Ideal untuk konsumsi harian sehat.',
    },
    {
      id: 'art-2',
      title: 'Cara Mengolah Tepung Sorgum untuk Kue Kering Premium',
      category: 'Resep & Kuliner',
      date: '08 Okt 2023',
      author: 'Chef Artisan Bestari',
      views: 512,
      content: 'Tepung sorgum memiliki tekstur halus dan wangi khas yang sangat cocok untuk kukis dan roti sehat.',
    },
  ]);

  // FAQ state for Kelola FAQ
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: 'faq-1',
      question: 'Apakah tepung sorgum Bestari 100% Bebas Gluten?',
      answer: 'Ya, seluruh produk olahan sorgum kami diproses secara khusus tanpa kontaminasi gandum gluten.',
      category: 'Produk & Nutrisi',
    },
    {
      id: 'faq-2',
      question: 'Berapa lama estimasi pengiriman pesanan?',
      answer: 'Estimasi pengiriman 1-3 hari kerja untuk area Jawa & Bali, dan 3-5 hari kerja untuk luar pulau.',
      category: 'Pengiriman & Layanan',
    },
  ]);

  // Load initial orders & products
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const prodData = await productApi.getProducts({});
        setProducts(prodData);

        const fetchedOrders = await orderApi.getOrders();
        const fetchedFaqs = await faqApi.getAdminFaqs();
        if (fetchedFaqs && fetchedFaqs.length > 0) {
          setFaqs(fetchedFaqs);
        }
        if (fetchedOrders.length === 0 && prodData.length > 0) {
          const defaultOrders: Order[] = [
            {
              id: '#BST-001',
              customerName: 'Budi Darmawan',
              customerPhone: '+62 812-3456-7890',
              customerEmail: 'budi.darmawan@gmail.com',
              paymentMethod: 'qris',
              totalAmount: 145000,
              status: 'Pending',
              createdAt: '24/10 14:20',
              shippingAddress:
                'Jl. Mawar Indah No. 42, RT 05/RW 03, Kec. Menteng, Kota Jakarta Pusat, DKI Jakarta, 10310',
              paymentProofUrl:
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCPQMsd7Kd_hNj8G033okD79GI3qA_F-i-IYr3c-_e_iUwjXcjhUbUbTVAuqvKmXNxO6wpgRFmXqNpdc97z2TgX4_iwb8mTjWK-LUaOkag6jVb6ZwyOWegGzS0H7euVOucs6DKTNHvWrFAqGbXmus4D8E5zDk_8t-9WTv3yektpmYb7j5kGU-nDR2PIV-UHaWsC6PyDQBJ456LsmzieiGCMQuHxEw5K4YjJLF3nWVlmxUl8QdAWpvA',
              items: [
                {
                  product: prodData[0] || {
                    id: 'p-1',
                    name: 'Tepung Sorgum Premium',
                    unitInfo: 'Kemasan 500g - Organik',
                    price: 45000,
                    category: 'tepung',
                    categoryLabel: 'Tepung Sorgum',
                    formattedPrice: 'Rp 45.000',
                    weight: '500g',
                    glutenFree: true,
                    organic: true,
                    image:
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuB47H8b2Fa-buEzuC_-FL8mqe031hSy0mrqbCVvz3hVuIMFOyIleW4O1rWj9Iwb_CVUasfklXIoNMmi8OtlOGTxhyNmV0SinybJgXsecw0Z-V7aj5LHLaijXUkvBQT5qsi05bxLpfC1NxGTD4HGeRhcu5GvhY46YiepmRP5m5ANcPvvuKI2QG6R3XnnQ149_-vk8QV7QSqKmj5ft033FwqRDcGYkmluzQNTgi1m13-YhUscZVIQnL0',
                    description: 'Tepung sorgum premium organik.',
                  },
                  quantity: 2,
                },
                {
                  product: prodData[1] || {
                    id: 'p-2',
                    name: 'Biji Sorgum Utuh',
                    unitInfo: 'Kemasan 1kg - Grade A',
                    price: 35000,
                    category: 'beras',
                    categoryLabel: 'Beras Sorgum',
                    formattedPrice: 'Rp 35.000',
                    weight: '1kg',
                    glutenFree: true,
                    organic: true,
                    image:
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuAPWNRDFs7qJkAYG-p-Cw4L4TAeekDjtpkTGzPjBCbbthIMsb36yIkCgdw7neRx2r8JJBaJNLt-corzUKx2tozRozMqGOogMGHAWgWDg9RuztAKeCATzvVShwEJdrrI8n0wGZx8NFuFHIerZjm6_1LHV4vMfukyhjBKwxAY3BlQA9eEcN5JmcaM3rBlMxQrp79jy0Qd343F-MBM_Xgi6ogILZZOA3MHNkz5ASJIXjKej-a5yClzixM',
                    description: 'Biji sorgum utuh berkualitas tinggi.',
                  },
                  quantity: 1,
                },
              ],
            },
          ];
          setOrders(defaultOrders);
        } else if (fetchedOrders.length > 0) {
          setOrders(fetchedOrders);
        }
      } catch (err) {
        console.error('Error loading admin data', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handlers for Orders
  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
    showToast(`Status pesanan ${orderId} diperbarui ke ${newStatus}`);
  };

  const handleDeleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (selectedOrderId === id) {
      setSelectedOrderId(null);
    }
    showToast(`Pesanan ${id} berhasil dihapus.`);
  };

  const handleExportCSV = () => {
    const headers = ['ID Pesanan', 'Nama Pembeli', 'Telepon', 'Metode Pembayaran', 'Total Bayar', 'Status', 'Tanggal'];
    const rows = orders.map((o) => [
      o.id,
      `"${o.customerName || ''}"`,
      `"${o.customerPhone || ''}"`,
      o.paymentMethod || 'qris',
      o.totalAmount,
      o.status,
      `"${o.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transaksi_bestari_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data transaksi berhasil diekspor ke CSV!');
  };

  // Handlers for Banners
  const handleToggleBanner = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
    showToast('Status keaktifan banner diperbarui.');
  };

  const handleDeleteBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    showToast('Banner berhasil dihapus.');
  };

  const handleSaveBanner = (data: { id?: string; title: string; targetLink: string; image: string }) => {
    if (data.id) {
      setBanners((prev) =>
        prev.map((b) => (b.id === data.id ? { ...b, title: data.title, targetLink: data.targetLink, image: data.image } : b))
      );
      showToast('Perubahan banner berhasil disimpan!');
    } else {
      const newBanner: BannerSlide = {
        id: `b-${Date.now()}`,
        title: data.title,
        uploadDate: 'Hari Ini',
        targetLink: data.targetLink,
        image: data.image,
        active: true,
      };
      setBanners((prev) => [newBanner, ...prev]);
      showToast('Banner baru berhasil ditambahkan!');
    }
    setEditingBanner(null);
  };

  // Handlers for Products
  const handleToggleProductStatus = async (id: string) => {
    try {
      const { productAdminApi } = await import('../api/adminApi');
      await productAdminApi.toggleActive(id);
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengubah status produk.');
      return;
    }
    setProductActiveMap((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id],
    }));
    showToast('Status keaktifan produk berhasil diperbarui.');
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    try {
      const { productAdminApi } = await import('../api/adminApi');
      await productAdminApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast(`Produk "${name}" berhasil dihapus dari katalog.`);
    } catch (e: any) {
      showToast(e?.message || `Gagal menghapus produk "${name}".`);
    }
  };

  const handleSaveProduct = async (data: {
    id?: string;
    name: string;
    category: 'beras' | 'tepung' | 'camilan' | 'pemanis' | 'benih';
    price: number;
    unitInfo: string;
    weight: string;
    badge?: 'BEST SELLER' | 'DISKON 15%' | 'BARU' | '';
    image: string;
    stock: number;
    description: string;
    glutenFree: boolean;
    organic: boolean;
    specification?: string;
    shippingInfo?: string;
  }) => {
    const catLabelMap: Record<string, string> = {
      beras: 'Beras Sorgum',
      tepung: 'Tepung Sorgum',
      camilan: 'Camilan Sehat',
      pemanis: 'Pemanis Alami',
      benih: 'Benih Sorgum',
    };
    const catIdMap: Record<string, number> = {
      beras: 1,
      tepung: 2,
      camilan: 3,
      pemanis: 4,
      benih: 5,
    };

    // Persist to backend first (admin). On failure, show toast but keep UI running.
    try {
      const { productAdminApi } = await import('../api/adminApi');
      if (data.id) {
        await productAdminApi.updateProduct(data.id, {
          name: data.name,
          category_id: catIdMap[data.category],
          price: data.price,
          stock: data.stock,
          weight_spec: data.unitInfo || data.weight,
          description: data.description,
          gluten_free: data.glutenFree,
          organic: data.organic,
          badge: data.badge || null,
        });
      } else {
        await productAdminApi.createProduct({
          name: data.name,
          category_id: catIdMap[data.category],
          price: data.price,
          stock: data.stock,
          weight_spec: data.unitInfo || data.weight,
          description: data.description,
          gluten_free: data.glutenFree,
          organic: data.organic,
          badge: data.badge || null,
        });
      }
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan produk ke server.');
      return;
    }

    if (data.id) {
      const exists = products.some((p) => p.id === data.id);
      if (exists) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === data.id) {
              return {
                ...p,
                name: data.name,
                category: data.category,
                categoryLabel: catLabelMap[data.category] || 'Produk Sorgum',
                price: data.price,
                formattedPrice: `IDR ${data.price.toLocaleString('id-ID')}`,
                unitInfo: data.unitInfo,
                weight: data.weight,
                badge: (data.badge as any) || undefined,
                image: data.image,
                description: data.description,
                glutenFree: data.glutenFree,
                organic: data.organic,
                specification: data.specification,
                shippingInfo: data.shippingInfo,
              };
            }
            return p;
          })
        );
        setProductStockMap((prev) => ({ ...prev, [data.id!]: data.stock }));
        showToast(`Katalog produk "${data.name}" berhasil diperbarui!`);
      } else {
        const newProd: Product = {
          id: data.id,
          name: data.name,
          category: data.category,
          categoryLabel: catLabelMap[data.category] || 'Produk Sorgum',
          price: data.price,
          formattedPrice: `IDR ${data.price.toLocaleString('id-ID')}`,
          unitInfo: data.unitInfo,
          weight: data.weight,
          badge: (data.badge as any) || undefined,
          image: data.image,
          description: data.description || 'Produk olahan sorgum berkualitas tinggi.',
          glutenFree: data.glutenFree,
          organic: data.organic,
          specification: data.specification,
          shippingInfo: data.shippingInfo,
        };
        setProducts((prev) => [newProd, ...prev]);
        setProductActiveMap((prev) => ({ ...prev, [data.id!]: true }));
        setProductStockMap((prev) => ({ ...prev, [data.id!]: data.stock || 100 }));
        showToast(`Produk baru "${data.name}" berhasil ditambahkan!`);
      }
    } else {
      const newId = `prod-${Date.now()}`;
      const newProd: Product = {
        id: newId,
        name: data.name,
        category: data.category,
        categoryLabel: catLabelMap[data.category] || 'Produk Sorgum',
        price: data.price,
        formattedPrice: `IDR ${data.price.toLocaleString('id-ID')}`,
        unitInfo: data.unitInfo,
        weight: data.weight,
        badge: (data.badge as any) || undefined,
        image: data.image,
        description: data.description || 'Produk olahan sorgum berkualitas tinggi.',
        glutenFree: data.glutenFree,
        organic: data.organic,
        specification: data.specification,
        shippingInfo: data.shippingInfo,
      };
      setProducts((prev) => [newProd, ...prev]);
      setProductActiveMap((prev) => ({ ...prev, [newId]: true }));
      setProductStockMap((prev) => ({ ...prev, [newId]: data.stock || 100 }));
      showToast(`Produk baru "${data.name}" berhasil ditambahkan!`);
    }

    setEditingProduct(null);
  };

  // Handlers for Articles — sync to backend (admin)
  const handleDeleteArticle = async (id: string) => {
    try {
      const { articleAdminApi } = await import('../api/adminApi');
      await articleAdminApi.deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      showToast('Artikel berhasil dihapus.');
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus artikel.');
    }
  };

  const handleSaveArticle = async (data: {
    id?: string;
    title: string;
    category: string;
    author: string;
    date: string;
    content: string;
  }) => {
    try {
      const { articleAdminApi } = await import('../api/adminApi');
      if (data.id) {
        await articleAdminApi.updateArticle(data.id, {
          title: data.title,
          category: data.category,
          author: data.author,
          content: data.content,
        });
        setArticles((prev) =>
          prev.map((a) => (a.id === data.id ? { ...a, title: data.title, category: data.category, author: data.author, content: data.content } : a))
        );
        showToast('Perubahan artikel berhasil disimpan!');
      } else {
        await articleAdminApi.createArticle({
          title: data.title,
          category: data.category,
          author: data.author,
          content: data.content,
        });
        const newArt: ArticleItem = {
          id: `art-${Date.now()}`,
          title: data.title,
          category: data.category,
          date: 'Hari ini',
          author: data.author,
          views: 1,
          content: data.content,
        };
        setArticles((prev) => [newArt, ...prev]);
        showToast('Artikel baru berhasil diterbitkan!');
      }
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan artikel.');
    }
    setEditingArticle(null);
  };

  // Handlers for FAQs
  const handleDeleteFaq = async (id: string) => {
    await faqApi.deleteFaq(id);
    const updated = await faqApi.getAdminFaqs();
    setFaqs(updated);
    showToast('FAQ berhasil dihapus.');
  };

  const handleSaveFaq = async (data: {
    id?: string;
    question: string;
    answer: string;
    category: string;
    status: 'AKTIF' | 'DRAFT';
    order?: number;
    tags?: string[];
  }) => {
    await faqApi.saveFaq(data);
    const updated = await faqApi.getAdminFaqs();
    setFaqs(updated);
    if (data.id) {
      showToast('Perubahan FAQ berhasil disimpan!');
    } else {
      showToast('FAQ baru berhasil ditambahkan!');
    }
    setEditingFaq(null);
  };

  const handleToggleFaqStatus = async (id: string) => {
    const updatedItem = await faqApi.toggleStatus(id);
    const updated = await faqApi.getAdminFaqs();
    setFaqs(updated);
    if (updatedItem) {
      const statusText = updatedItem.status === 'AKTIF' ? 'Dipublikasikan (Aktif)' : 'Disembunyikan (Draft)';
      showToast(`Status FAQ ${updatedItem.id} diubah ke ${statusText}`);
    }
  };

  const handleReorderFaq = async (id: string, direction: 'UP' | 'DOWN') => {
    const updated = await faqApi.reorderFaq(id, direction);
    setFaqs(updated);
    showToast('Urutan tampilan FAQ berhasil diperbarui!');
  };

  // Switch tab resets editing states
  const handleNavChange = (nav: AdminActiveNav) => {
    setActiveNav(nav);
    setEditingBanner(null);
    setEditingProduct(null);
    setEditingArticle(null);
    setEditingFaq(null);
  };

  const selectedOrderObj = orders.find((o) => o.id === selectedOrderId) || null;

  return (
    <div className="min-h-screen bg-[#f8f7f5] text-[#1d1b17] admin-theme relative flex">
      {/* Drawer Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[90] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <AdminSidebar
        activeNav={activeNav}
        setActiveNav={handleNavChange}
        onLogout={onLogout}
        onNavigateHome={onNavigateHome}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col min-h-screen w-full overflow-x-hidden transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        {/* TOP NAVBAR HEADER */}
        <AdminHeader
          user={user}
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setIsSidebarOpen(true);
            } else {
              setIsSidebarCollapsed(!isSidebarCollapsed);
            }
          }}
          onNavigateHome={onNavigateHome}
        />

        {/* DYNAMIC TAB & FORM CONTENT */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 animate-fadeIn">
          {/* TAB 1: DASHBOARD UTAMA */}
          {activeNav === 'dashboard' && (
            <DashboardTab
              orders={orders}
              products={products}
              productStockMap={productStockMap}
              setActiveNav={handleNavChange}
              handleUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {/* TAB 2: PENGATURAN LANDING PAGE */}
          {activeNav === 'landing' &&
            (editingBanner ? (
              <BannerFormView
                initialBanner={editingBanner.banner}
                onSave={handleSaveBanner}
                onCancel={() => setEditingBanner(null)}
                showToast={showToast}
              />
            ) : (
              <LandingSettingsTab
                banners={banners}
                onToggleBanner={handleToggleBanner}
                onDeleteBanner={handleDeleteBanner}
                onOpenCreateBanner={() => setEditingBanner({ isEditing: true, banner: null })}
                onOpenEditBanner={(banner) => setEditingBanner({ isEditing: true, banner })}
                showToast={showToast}
              />
            ))}

          {/* TAB 3: KELOLA PRODUK */}
          {activeNav === 'produk' &&
            (editingProduct ? (
              <ProductFormView
                initialProduct={editingProduct.product}
                initialStock={editingProduct.product ? (productStockMap[editingProduct.product.id] ?? 50) : 100}
                onSave={handleSaveProduct}
                onCancel={() => setEditingProduct(null)}
                showToast={showToast}
              />
            ) : (
              <ProductsTab
                products={products}
                productActiveMap={productActiveMap}
                productStockMap={productStockMap}
                onToggleProductStatus={handleToggleProductStatus}
                onDeleteProduct={(product) => setDeletingProduct(product)}
                onOpenCreateProduct={() => setEditingProduct({ isEditing: true, product: null })}
                onOpenEditProduct={(product) => setEditingProduct({ isEditing: true, product })}
              />
            ))}

          {/* TAB 4: KELOLA TRANSAKSI */}
          {activeNav === 'transaksi' && (
            selectedOrderId ? (
              <OrderDetailView
                order={selectedOrderObj}
                onClose={() => setSelectedOrderId(null)}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onOpenProofModal={(url) => setProofModalUrl(url)}
              />
            ) : (
              <TransactionsTab
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onDeleteOrder={(order) => setDeletingOrder(order)}
                onSelectOrder={(id) => setSelectedOrderId(id)}
                onOpenProofModal={(url) => setProofModalUrl(url)}
                onExportCSV={handleExportCSV}
              />
            )
          )}

          {/* TAB 5: KELOLA INFO */}
          {activeNav === 'info' &&
            (editingArticle ? (
              <ArticleFormView
                initialArticle={editingArticle.article}
                onSave={handleSaveArticle}
                onCancel={() => setEditingArticle(null)}
                showToast={showToast}
              />
            ) : (
              <InfoTab
                articles={articles}
                onDeleteArticle={(article) => setDeletingArticle(article)}
                onOpenCreateArticle={() => setEditingArticle({ isEditing: true, article: null })}
                onOpenEditArticle={(article) => setEditingArticle({ isEditing: true, article })}
              />
            ))}

          {/* TAB 6: KELOLA USER */}
          {activeNav === 'user' && <UsersTab showToast={showToast} />}

          {/* TAB 7: KELOLA FAQ */}
          {activeNav === 'faq' &&
            (editingFaq ? (
              <FaqFormView
                initialFaq={editingFaq.faq}
                onSave={handleSaveFaq}
                onCancel={() => setEditingFaq(null)}
                showToast={showToast}
              />
            ) : (
              <FaqTab
                faqs={faqs}
                onDeleteFaq={handleDeleteFaq}
                onOpenCreateFaq={() => setEditingFaq({ isEditing: true, faq: null })}
                onOpenEditFaq={(faq) => setEditingFaq({ isEditing: true, faq })}
                onToggleStatus={handleToggleFaqStatus}
                onReorderFaq={handleReorderFaq}
                showToast={showToast}
              />
            ))}

          {/* TAB 8: KELOLA LAIN */}
          {activeNav === 'lain' && <OtherSettingsTab showToast={showToast} />}
        </main>

        {/* FOOTER / BRANDING BOTTOM */}
        <footer className="mt-auto px-8 py-6 border-t border-[#c4c8bc] bg-white flex flex-col sm:flex-row justify-between items-center text-[#44483f]/60 text-xs font-medium gap-2">
          <p>© 2023 BESTARI Sorghum. Hak Cipta Dilindungi.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#162809] transition-colors">
              Syarat &amp; Ketentuan
            </a>
            <a href="#" className="hover:text-[#162809] transition-colors">
              Kebijakan Privasi
            </a>
          </div>
        </footer>
      </div>

      {/* ORDER DELETE CONFIRMATION MODAL */}
      <OrderDeleteConfirmModal
        isOpen={deletingOrder !== null}
        order={deletingOrder}
        onClose={() => setDeletingOrder(null)}
        onConfirmDelete={(id) => {
          handleDeleteOrder(id);
        }}
      />

      {/* Full-screen Payment Proof Image Lightbox Modal */}
      {proofModalUrl && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative max-w-xl w-full bg-white rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col items-center border border-[#c4c8bc]/40">
            <button
              type="button"
              onClick={() => setProofModalUrl(null)}
              className="absolute top-3 right-3 bg-[#1d1b17]/85 hover:bg-[#1d1b17] text-white p-1.5 rounded-lg transition-all cursor-pointer z-10"
              title="Tutup Preview"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
            <h4 className="font-bold text-sm text-[#1d1b17] mb-3 self-start px-2">
              Bukti Transfer Pembayaran QRIS
            </h4>
            <div className="w-full bg-[#faf8f5] rounded-lg overflow-hidden flex items-center justify-center max-h-[70vh] border border-[#c4c8bc]/30">
              <img
                src={proofModalUrl}
                alt="Bukti Transfer QRIS Full"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>
            <div className="mt-4 flex justify-end w-full">
              <button
                type="button"
                onClick={() => setProofModalUrl(null)}
                className="bg-[#2b3e1d] text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#162809] transition-colors cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PRODUCT DELETE CONFIRMATION MODAL */}
      <ProductDeleteConfirmModal
        isOpen={deletingProduct !== null}
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirmDelete={(id) => {
          const prodToDelete = products.find(p => p.id === id);
          if (prodToDelete) {
            handleDeleteProduct(id, prodToDelete.name);
          }
        }}
      />

      {/* ARTICLE DELETE CONFIRMATION MODAL */}
      <ArticleDeleteConfirmModal
        isOpen={deletingArticle !== null}
        article={deletingArticle}
        onClose={() => setDeletingArticle(null)}
        onConfirmDelete={(id) => {
          handleDeleteArticle(id);
        }}
      />
    </div>
  );
};
