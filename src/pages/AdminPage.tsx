import React, { useState, useEffect, useCallback } from 'react';
import { User, Order, Product } from '../types';
import { AdminActiveNav, BannerSlide, ArticleItem, FAQItem } from '../types/admin';
import { useApp } from '../context/AppContext';
import { realtimeApi } from '../api/realtimeApi';
import { productAdminApi } from '../api/adminApi';
import { mapProduct } from '../api/productApi';
import { formatDate } from '../utils/formatDate';

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
import { UsersTab } from '../components/admin/UsersTab';
import { FaqTab } from '../components/admin/FaqTab';
import { FaqFormView } from '../components/admin/FaqFormView';
import { OtherSettingsTab } from '../components/admin/OtherSettingsTab';
import { VouchersTab } from '../components/admin/VouchersTab';

interface AdminPageProps {
  user: User | null;
  onNavigateHome: () => void;
  onLogout?: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  user,
  onNavigateHome,
  onLogout,
  showToast,
}) => {
  const {
    products,
    saveProduct,
    deleteProduct,
    refreshProducts,
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
    updateOrderStatus,
    deleteOrder,
  } = useApp();

  // Orders admin: source of truth = BE /api/admin/orders (SEMUA order, bukan /mine)
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const refreshAdminOrders = useCallback(async () => {
    try {
      const { orderAdminApi } = await import('../api/adminApi');
      const { mapOrder } = await import('../api/orderApi');
      const list = await orderAdminApi.listOrders();
      setOrders(list.map((o: any) => mapOrder(o)));
    } catch {
      // admin orders unavailable -> keep empty
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { orderAdminApi } = await import('../api/adminApi');
        const { mapOrder } = await import('../api/orderApi');
        const list = await orderAdminApi.listOrders();
        if (!cancelled) setOrders(list.map((o: any) => mapOrder(o)));
      } catch {
        // admin orders unavailable -> keep empty
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Main Navigation State
  const [activeNav, setActiveNav] = useState<AdminActiveNav>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Badge options (dari Kelola Badge — sinkron ke dropdown produk).
  // (H4: Kelola Kategori dihapus — kategori bukan fitur mandiri lagi.)
  const [badgeOptions, setBadgeOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ id: number; name: string; slug: string }[]>([]);

  const loadBadgeOptions = async () => {
    try {
      const { badgeAdminApi } = await import('../api/adminApi');
      const badges = await badgeAdminApi.list();
      setBadgeOptions(badges.filter((b) => b.is_active).map((b) => b.name));
      // Kategori: pertahankan dari endpoint publik (produk masih pakai kategori)
      const res = await fetch('/api/categories');
      const cats = await res.json();
      setCategoryOptions((cats?.data || []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })));
    } catch {
      // fallback: biarkan kosong (ProductFormView pakai default hardcode)
    }
  };

  useEffect(() => {
    loadBadgeOptions();
  }, []);

  // Banner ADMIN: fetch dari /api/admin/banners (semua, termasuk nonaktif).
  // State global `banners` (dari AppContext) hanya berisi banner AKTIF (API public),
  // jadi panel admin butuh sumber sendiri supaya banner nonaktif tetap terlihat & bisa di-toggle.
  const [adminBanners, setAdminBanners] = useState<BannerSlide[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const { bannerAdminApi } = await import('../api/adminApi');
        const list = await bannerAdminApi.listBanners();
        const mapped: BannerSlide[] = (list || []).map((b: any) => ({
          id: String(b.id),
          title: b.title,
          uploadDate: formatDate(b.created_at, 'short'),
          targetLink: b.target_link || '',
          image: b.image_url || '',
          active: !!b.is_active,
        }));
        setAdminBanners(mapped);
      } catch {
        // Fallback: state global (bisa kosong kalau tak ada banner aktif)
        setAdminBanners(banners);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sub-view Form States for Create/Edit Pages
  const [editingBanner, setEditingBanner] = useState<{ isEditing: boolean; banner?: BannerSlide | null } | null>(null);
  const [editingProduct, setEditingProduct] = useState<{ isEditing: boolean; product?: Product | null } | null>(null);

  // Artikel ADMIN: fetch dari /api/admin/articles (SEMUA, termasuk draft & field lengkap).
  // State global `articles` (dari AppContext) hanya berisi PUBLISHED dari API public,
  // jadi panel admin butuh sumber sendiri supaya draft terlihat & isi konten sinkron.
  const [adminArticles, setAdminArticles] = useState<ArticleItem[]>([]);
  const refreshAdminArticles = useCallback(async () => {
    try {
      const { articleAdminApi } = await import('../api/adminApi');
      const list = await articleAdminApi.listArticles();
      const mapped: ArticleItem[] = (list || []).map((a: any) => ({
        id: String(a.id),
        title: a.title,
        category: a.category,
        date: formatDate(a.published_at || a.created_at, 'long'),
        createdAt: formatDate(a.created_at, 'long'),
        author: a.author || 'Tim Sorgum',
        views: 0,
        content: a.content || '',
        contentBlocks: a.content_blocks && typeof a.content_blocks === 'string'
          ? (() => { try { return JSON.parse(a.content_blocks); } catch { return undefined; } })()
          : a.content_blocks,
        image: a.image_url || '',
        subImage: a.sub_image || '',
        quote: a.quote || '',
        facts: a.facts ? (typeof a.facts === 'string' ? JSON.parse(a.facts) : a.facts) : undefined,
        isPublished: !!a.is_published,
      }));
      setAdminArticles(mapped);
    } catch {
      // fallback: state global (published only)
      setAdminArticles(articles.map((a) => ({
        id: a.id,
        title: a.title,
        category: a.category,
        date: a.date,
        author: a.author,
        views: 0,
        content: a.content,
        contentBlocks: a.contentBlocks,
        image: a.image,
        subImage: a.subImage,
        quote: a.quote,
        facts: a.facts,
        isPublished: true,
      })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    refreshAdminArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FAQ ADMIN: fetch dari /api/admin/articles/faq (SEMUA, termasuk DRAFT).
  // State global `faqs` (dari AppContext) hanya berisi AKTIF dari API public,
  // jadi FAQ yang di-DRAFT-kan akan hilang dari panel admin setelah refresh — bug.
  const [adminFaqs, setAdminFaqs] = useState<FAQItem[]>([]);
  const refreshAdminFaqs = useCallback(async () => {
    try {
      const { faqApi } = await import('../api/faqApi');
      const list = await faqApi.getAdminFaqs();
      setAdminFaqs(list);
    } catch {
      setAdminFaqs(faqs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    refreshAdminFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── SSE realtime di panel admin ─────────────────────────────────────────
  // User checkout → BE publish 'orders' event → admin lihat order baru
  // langsung tanpa refresh. Admin edit produk/artikel/FAQ dari tab lain
  // → panel admin ikut sinkron (data admin == user, realtime dua arah).
  useEffect(() => {
    const unsubs = [
      realtimeApi.on('orders', () => refreshAdminOrders()),
      realtimeApi.on('products', () => refreshProducts().catch(() => {})),
      realtimeApi.on('articles', () => refreshAdminArticles()),
      realtimeApi.on('faqs', () => refreshAdminFaqs()),
    ];
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [editingArticle, setEditingArticle] = useState<{ isEditing: boolean; article?: ArticleItem | null } | null>(null);
  const [editingFaq, setEditingFaq] = useState<{ isEditing: boolean; faq?: FAQItem | null } | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  // Order selection & Proof Modal State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);

  // Handlers for Orders
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { orderAdminApi } = await import('../api/adminApi');
      const { STATUS_LABEL_TO_ENUM } = await import('../api/orderApi');
      // BE opsi B (longgar): terima semua status — cukup map label FE → enum BE.
      // 'Diproses' selalu kirim 'processed' (confirmed & processed sama-sama tampil 'Diproses').
      const beStatus = STATUS_LABEL_TO_ENUM[newStatus] || newStatus.toLowerCase();
      const res = await orderAdminApi.updateOrderStatus(orderId, beStatus);
      // Order terminal (Selesai/Dibatalkan) → BE return unchanged (no-op): tampilkan info ramah,
      // JANGAN update state & JANGAN toast error — admin tidak boleh lihat error mentah.
      if (res?.unchanged) {
        showToast(res.message || 'Pesanan sudah berstatus akhir, tidak dapat diubah.', 'info');
        return;
      }
      // Update local state (BE dulu, context kedua — context cuma mirror)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengupdate status pesanan.', 'error');
      return;
    }
    updateOrderStatus(orderId, newStatus);
    showToast(`Status pesanan ${orderId} diperbarui ke ${newStatus}`);
  };

  // Verifikasi/ubah status pembayaran (admin) — biar revenue dashboard kebaca
  const handleUpdatePaymentStatus = async (orderId: string, newPayment: 'unpaid' | 'paid' | 'confirmed') => {
    try {
      const { orderAdminApi } = await import('../api/adminApi');
      await orderAdminApi.updatePaymentStatus(orderId, newPayment);
      setOrders((prevOrders) => prevOrders.map((o) => (o.id === orderId ? { ...o, paymentStatus: newPayment } : o)));
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengupdate status pembayaran.', 'error');
      return;
    }
    showToast(`Status pembayaran ${orderId} diperbarui ke ${newPayment}`);
  };

  const handleDeleteOrder = async (id: string) => {
    // SOFT-DELETE: panggil BE DELETE /admin/orders/:id → order di-set deleted_at
    // (hilang dari tampilan admin, data TETAP di DB sebagai arsip, bisa di-restore).
    // Sebelumnya cuma hapus state lokal → muncul lagi saat refresh (keluhan user).
    try {
      const { orderAdminApi } = await import('../api/adminApi');
      await orderAdminApi.deleteOrder(id);
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus pesanan.', 'error');
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== id));
    deleteOrder(id);
    if (selectedOrderId === id) {
      setSelectedOrderId(null);
    }
    showToast(`Pesanan ${id} dihapus dari tampilan (data tetap di database).`);
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
    link.setAttribute('download', `transaksi_sorgum_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data transaksi berhasil diekspor ke CSV!');
  };

  // Handlers for Banners
  const handleToggleBanner = async (id: string) => {
    try {
      const { bannerAdminApi } = await import('../api/adminApi');
      const target = adminBanners.find((b) => b.id === id);
      const newActive = !(target?.active ?? true);
      await bannerAdminApi.updateBanner(id, { is_active: newActive });
      // Update state admin lokal langsung (UI toggle sinkron tanpa reload)
      setAdminBanners((prev) => prev.map((b) => (b.id === id ? { ...b, active: newActive } : b)));
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengubah status banner.', 'error');
      return;
    }
    toggleBanner(id);
    showToast('Status keaktifan banner diperbarui.');
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      const { bannerAdminApi } = await import('../api/adminApi');
      await bannerAdminApi.deleteBanner(id);
      setAdminBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus banner.', 'error');
      return;
    }
    deleteBanner(id);
    showToast('Banner berhasil dihapus.');
  };

  const handleSaveBanner = async (data: { id?: string; title: string; titleEn?: string; targetLink: string; image: string }) => {
    try {
      const { bannerAdminApi } = await import('../api/adminApi');
      if (data.id) {
        await bannerAdminApi.updateBanner(data.id, {
          title: data.title,
          target_link: data.targetLink || null,
          image_url: data.image,
        });
      } else {
        await bannerAdminApi.createBanner({
          title: data.title,
          image_url: data.image,
          target_link: data.targetLink || null,
        });
      }
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan banner.', 'error');
      return;
    }
    saveBanner(data);
    showToast(data.id ? 'Perubahan banner berhasil disimpan!' : 'Banner baru berhasil ditambahkan!');
    // Re-fetch daftar banner admin (biar id asli & urutan fresh)
    try {
      const { bannerAdminApi } = await import('../api/adminApi');
      const list = await bannerAdminApi.listBanners();
      setAdminBanners((list || []).map((b: any) => ({
        id: String(b.id),
        title: b.title,
        titleEn: b.title_en || undefined,
        uploadDate: formatDate(b.created_at, 'short'),
        targetLink: b.target_link || '',
        image: b.image_url || '',
        active: !!b.is_active,
      })));
    } catch { /* ignore — list lama masih valid */ }
    setEditingBanner(null);
  };

  // Handlers for Products
  const handleToggleProductStatus = async (id: string) => {
    try {
      const { productAdminApi } = await import('../api/adminApi');
      await productAdminApi.toggleActive(id);
      // Re-fetch produk dari BE supaya is_active & stock sinkron (bukan map mock)
      await refreshProducts();
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengubah status produk.', 'error');
      return;
    }
    showToast('Status keaktifan produk berhasil diperbarui.');
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    try {
      const { productAdminApi } = await import('../api/adminApi');
      await productAdminApi.deleteProduct(id);
      deleteProduct(id);
      // Re-fetch produk dari BE — biar user (home/cart/katalog) yang sedang buka
      // langsung lihat produk terhapus/ternonaktifkan (bukan menunggu reload).
      await refreshProducts().catch(() => {});
      showToast(`Produk "${name}" berhasil dihapus dari katalog.`);
    } catch (e: any) {
      showToast(e?.message || `Gagal menghapus produk "${name}".`, 'error');
    }
  };

  const handleSaveProduct = async (data: {
    id?: string;
    categoryId?: number;
    name: string;
    category: 'beras' | 'tepung' | 'camilan' | 'pemanis' | 'benih';
    price: number;
    unitInfo: string;
    weight: string;
    badge?: string | '';
    image: string;
    stock: number;
    description: string;
    originalPrice?: number;
    discountPercent?: number;
    composition?: string;
    shelfLife?: string;
    attributes?: string;
    glutenFree?: boolean;
    organic?: boolean;
    specification?: string;
    shippingInfo?: string;
    origin?: string;
    galleryImages?: string[];
  }) => {
    // Sinkron: kalau kategoriOptions dari Kelola Kategori tersedia, pakai id asli BE.
    // Fallback: map key FE -> id (perilaku lama, aman kalau BE kategori default).
    const catIdFromOptions =
      data.categoryId ??
      categoryOptions.find((c) => c.name.toLowerCase() === data.category.replace(/-/g, ' '))?.id;
    const catIdMap: Record<string, number> = {
      beras: 1,
      tepung: 2,
      camilan: 3,
      pemanis: 4,
      benih: 5,
    };
    const categoryId = catIdFromOptions ?? catIdMap[data.category] ?? 1;

    // Hitung harga jual final: originalPrice × (1 - diskon%)
    const basePrice = data.originalPrice ?? data.price;
    const pct = Math.max(0, Math.min(90, data.discountPercent || 0));
    const finalPrice = pct > 0 ? Math.round((basePrice * (100 - pct)) / 100 / 50) * 50 : basePrice;

    // Persist to backend first (admin). On failure, show toast but keep UI running.
    try {
      const { productAdminApi } = await import('../api/adminApi');
      if (data.id) {
        await productAdminApi.updateProduct(data.id, {
          name: data.name,
          category_id: categoryId,
          price: finalPrice,
          original_price: basePrice,
          discount_percent: data.discountPercent || 0,
          stock: data.stock,
          weight_spec: data.unitInfo || data.weight,
          description: data.description,
          origin: data.origin || null,
          shipping_info: data.shippingInfo || null,
          composition: data.composition || null,
          shelf_life: data.shelfLife || null,
          attributes: data.attributes || null,
          gluten_free: data.glutenFree ?? false,
          organic: data.organic ?? false,
          badge: data.badge || null,
        });
        // Gambar baru (URL hasil upload) → daftarkan ke product_images.
        // Hanya kalau image BERUBAH dari produk existing (hindari duplikat tiap save).
        const existingImage = products.find((p) => p.id === data.id)?.image;
        if (data.image && !data.image.startsWith('data:') && data.image !== existingImage) {
          await productAdminApi.addImage(data.id, data.image, true);
        }
        // Galeri produk (4 gambar) — replace semua kalau admin mengubahnya.
        const gallery = data.galleryImages || [];
        if (gallery.length) {
          // Gambar utama wajib jadi slot pertama (primary) kalau belum ada di galeri.
          const urls = data.image && !data.image.startsWith('data:')
            ? [data.image, ...gallery.filter((u) => u !== data.image)]
            : gallery;
          await productAdminApi.replaceImages(data.id, urls);
        }
      } else {
        const created = await productAdminApi.createProduct({
          name: data.name,
          category_id: categoryId,
          price: finalPrice,
          original_price: basePrice,
          discount_percent: data.discountPercent || 0,
          stock: data.stock,
          weight_spec: data.unitInfo || data.weight,
          description: data.description,
          origin: data.origin || null,
          shipping_info: data.shippingInfo || null,
          composition: data.composition || null,
          shelf_life: data.shelfLife || null,
          attributes: data.attributes || null,
          gluten_free: data.glutenFree ?? false,
          organic: data.organic ?? false,
          badge: data.badge || null,
        });
        // Gambar baru → daftarkan sebagai primary image produk baru
        if (data.image && !data.image.startsWith('data:')) {
          await productAdminApi.addImage(String(created?.id || data.id), data.image, true);
        }
        // Galeri produk (4 gambar) — simpan sekaligus untuk produk baru
        const galleryNew = data.galleryImages || [];
        if (galleryNew.length && created?.id) {
          const urls = data.image && !data.image.startsWith('data:')
            ? [data.image, ...galleryNew.filter((u) => u !== data.image)]
            : galleryNew;
          await productAdminApi.replaceImages(String(created.id), urls);
        }
        // Penting: pakai id ASLI dari BE (bukan prod-<timestamp>) supaya edit/delete
        // produk baru jalan (id string palsu → parseInt NaN → 400/404)
        if (created?.id) {
          data.id = String(created.id);
        }
      }
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan produk ke server.', 'error');
      return;
    }

    saveProduct(data);
    // Re-fetch dari BE — produk baru/edit harus langsung tampil sinkron di admin
    // panel MAUPUN sisi user (home/cart/katalog) yang sedang terbuka.
    await refreshProducts().catch(() => {});
    showToast(data.id
      ? `Katalog produk "${data.name}" berhasil diperbarui!`
      : `Produk baru "${data.name}" berhasil ditambahkan!`);
    setEditingProduct(null);
  };

  // Handlers for Articles — sync to backend (admin)
  const handleDeleteArticle = async (id: string) => {
    try {
      const { articleAdminApi } = await import('../api/adminApi');
      await articleAdminApi.deleteArticle(id);
      deleteArticle(id);
      refreshAdminArticles();
      showToast('Artikel berhasil dihapus.');
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus artikel.', 'error');
    }
  };

  const handleSaveArticle = async (data: {
    id?: string;
    title: string;
    category: string;
    author: string;
    date: string;
    createdAt?: string;
    content: string;
    contentBlocks?: any[];
    image?: string;
    subImage?: string;
    quote?: string;
    excerpt?: string;
  }) => {
    try {
      const { articleAdminApi } = await import('../api/adminApi');
      if (data.id) {
        await articleAdminApi.updateArticle(data.id, {
          title: data.title,
          category: data.category,
          author: data.author,
          content: data.content,
          content_blocks: data.contentBlocks,
          image_url: data.image,
          sub_image: data.subImage,
          quote: data.quote,
          excerpt: data.excerpt,
        });
        saveArticle(data);
        showToast('Perubahan artikel berhasil disimpan!');
        refreshAdminArticles();
      } else {
        await articleAdminApi.createArticle({
          title: data.title,
          category: data.category,
          author: data.author,
          content: data.content,
          content_blocks: data.contentBlocks,
          image_url: data.image,
          sub_image: data.subImage,
          quote: data.quote,
          excerpt: data.excerpt,
        });
        saveArticle(data);
        showToast('Artikel baru berhasil diterbitkan!');
        refreshAdminArticles();
      }
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan artikel.', 'error');
    }
    setEditingArticle(null);
  };

  // Handlers for FAQs
  const handleDeleteFaq = async (id: string) => {
    try {
      await deleteFaq(id);
      refreshAdminFaqs();
      showToast('FAQ berhasil dihapus.');
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus FAQ.', 'error');
    }
  };

  const handleSaveFaq = async (data: any) => {
    try {
      await saveFaq(data);
      refreshAdminFaqs();
      showToast(data.id ? 'Perubahan FAQ berhasil disimpan!' : 'FAQ baru berhasil ditambahkan!');
      setEditingFaq(null);
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan FAQ.', 'error');
    }
  };

  const handleToggleFaqStatus = async (id: string) => {
    try {
      await toggleFaqStatus(id);
      refreshAdminFaqs();
      showToast('Status keaktifan FAQ berhasil diperbarui.');
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengubah status FAQ.', 'error');
    }
  };

  const handleReorderFaq = async (id: string, direction: 'UP' | 'DOWN') => {
    try {
      await reorderFaq(id, direction);
      refreshAdminFaqs();
      showToast('Urutan tampilan FAQ berhasil diperbarui!');
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengubah urutan FAQ.', 'error');
    }
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
    <div style={{ backgroundColor: '#F7F8F6' }} className="min-h-screen text-[#1B5E20] admin-theme relative flex">
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
                banners={adminBanners}
                products={products}
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
                initialStock={editingProduct.product?.stock ?? 0}
                onSave={handleSaveProduct}
                onCancel={() => setEditingProduct(null)}
                showToast={showToast}
                badgeOptions={badgeOptions}
                categoryOptions={categoryOptions}
              />
            ) : (
              <ProductsTab
                products={products}
                onToggleProductStatus={handleToggleProductStatus}
                onDeleteProduct={(product) => setDeletingProduct(product)}
                onOpenCreateProduct={() => setEditingProduct({ isEditing: true, product: null })}
                onOpenEditProduct={(product) => {
                  // Fetch detail produk by id (endpoint admin) supaya galeri images[]
                  // ikut terisi di form — list produk tidak membawa images.
                  setEditingProduct({ isEditing: true, product });
                  productAdminApi.getProductById(String(product.id)).then((detail) => {
                    if (detail) {
                      // Response admin = raw row (snake_case) → map ke Product FE (camelCase)
                      const mapped = mapProduct(detail);
                      setEditingProduct({ isEditing: true, product: mapped });
                    }
                  }).catch(() => {});
                }}
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
                onUpdatePaymentStatus={handleUpdatePaymentStatus}
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
                articles={adminArticles}
                onDeleteArticle={(article) => handleDeleteArticle(article.id)}
                onOpenCreateArticle={() => setEditingArticle({ isEditing: true, article: null })}
                onOpenEditArticle={(article) => setEditingArticle({ isEditing: true, article })}
              />
            ))}

          {/* TAB 6: KELOLA USER */}
          {activeNav === 'user' && <UsersTab showToast={showToast} />}

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

          {/* TAB 8: KELOLA VOUCHER */}
          {activeNav === 'voucher' && <VouchersTab showToast={showToast} />}

          {/* TAB 9: KELOLA LAIN */}
          {activeNav === 'lain' && (
            <OtherSettingsTab
              showToast={showToast}
              onBadgesChange={(badges) => setBadgeOptions(badges.filter((b) => b.is_active).map((b) => b.name))}
            />
          )}
        </main>

        {/* FOOTER / BRANDING BOTTOM */}
        <footer className="mt-auto px-8 py-6 border-t border-[#E0E0E0] bg-[#FFFFFF] flex flex-col sm:flex-row justify-between items-center text-[#555555] text-xs font-medium gap-2">
          <p>© 2023 SORGUM Sorghum. Hak Cipta Dilindungi.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#1B5E20] transition-colors">
              Syarat &amp; Ketentuan
            </a>
            <a href="#" className="hover:text-[#1B5E20] transition-colors">
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
          <div className="relative max-w-xl w-full bg-white rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col items-center border border-[#E0E0E0]/40">
            <button
              type="button"
              onClick={() => setProofModalUrl(null)}
              className="absolute top-3 right-3 bg-[#1d1b17]/85 hover:bg-[#1d1b17] text-white p-1.5 rounded-lg transition-all cursor-pointer z-10"
              title="Tutup Preview"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
            <h4 className="font-bold text-sm text-[#1B5E20] mb-3 self-start px-2">
              Bukti Transfer Pembayaran QRIS
            </h4>
            <div className="w-full bg-[#faf8f5] rounded-lg overflow-hidden flex items-center justify-center max-h-[70vh] border border-[#E0E0E0]/30">
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
                className="bg-[#2E7D32] text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#1B5E20] transition-colors cursor-pointer"
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
    </div>
  );
};
