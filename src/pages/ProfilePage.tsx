import React, { useState, useEffect } from 'react';
import { User, Order, Product } from '../types';
import { useApp } from '../context/AppContext';
import { wishlistApi } from '../api/wishlistApi';

interface ProfilePageProps {
  user: User | null;
  initialTab?: 'profil' | 'pesanan' | 'favorit' | 'pengaturan';
  onLogout: () => void;
  onNavigateProducts: () => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  showToast: (msg: string) => void;
  onNavigateAdmin?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  initialTab = 'profil',
  onLogout,
  onNavigateProducts,
  onAddToCart,
  onSelectProduct,
  showToast,
  onNavigateAdmin,
}) => {
  const { t, orders: allOrders, products: allProducts, currentUser, updateOrderStatus } = useApp();
  const [activeTab, setActiveTab] = useState<'profil' | 'pesanan' | 'favorit' | 'pengaturan'>(
    initialTab
  );

  // Cancel order sendiri (user) — panggil BE PATCH /orders/:id/cancel
  const handleCancelOrder = async (orderId: string) => {
    try {
      const { request } = await import('../api/http');
      await request(`/orders/${orderId}/cancel`, { method: 'PATCH', auth: true });
      showToast('Pesanan berhasil dibatalkan.');
      updateOrderStatus(orderId, 'Dibatalkan');
    } catch (e: any) {
      showToast(e?.message || 'Gagal membatalkan pesanan.');
    }
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Orders — filtered for the current user
  const orders: Order[] = allOrders.filter(
    (o) =>
      !currentUser ||
      o.customerEmail === currentUser.email ||
      o.userId === currentUser.id
  );

  const [orderFilter, setOrderFilter] = useState<string>('Semua');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);

  // Live tracking data (dari BE /api/tracking/:orderId) — untuk order detail view
  const [trackingData, setTrackingData] = useState<{
    tracking: {
      courier: string;
      tracking_number: string;
      resi_status: string;
      pengirim: string;
      tujuan: string;
      checked_at: string;
    } | null;
    history: { event_date: string; description: string }[];
  } | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Fetch tracking real setiap ganti selectedOrderDetail yang punya resi
  useEffect(() => {
    let cancelled = false;
    setTrackingData(null);
    const order = selectedOrderDetail;
    if (!order || !order.courier || !order.trackingNumber) {
      setTrackingLoading(false);
      return;
    }
    setTrackingLoading(true);
    const load = async () => {
      try {
        const { request } = await import('../api/http');
        const res = await request<{ data: typeof trackingData }>(`/tracking/${order.id}`, { auth: true });
        if (!cancelled) setTrackingData(res.data);
      } catch {
        // tracking unavailable
      } finally {
        if (!cancelled) setTrackingLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedOrderDetail?.id]);

  // Favorite Products — real dari BE wishlist (bukan mock allProducts.slice)
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Record<string, number>>({}); // productId -> wishlist_id

  useEffect(() => {
    if (!currentUser) {
      setFavoriteProducts([]);
      setWishlistIds({});
      return;
    }
    let cancelled = false;
    wishlistApi.getWishlist().then((items) => {
      if (cancelled) return;
      const enriched = items
        .map((w) => {
          const full = allProducts.find((p) => String(p.id) === String(w.id));
          return full || w;
        })
        .filter((p) => p.id);
      setFavoriteProducts(enriched);
      const idMap: Record<string, number> = {};
      items.forEach((w) => { if (w.id) idMap[String(w.id)] = Number((w as any).wishlist_id || 0); });
      setWishlistIds(idMap);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [currentUser, allProducts]);

  // Profile Form state — dari user login (bukan mock)
  const [profileData, setProfileData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    gender: '',
    birthDate: '',
  });

  // Shipping Address state — dari BE /api/user/ (bukan mock)
  const [addresses, setAddresses] = useState<Array<{
    id: string; label: string; recipientName: string; phone: string;
    addressLine: string; city: string; province: string; postalCode: string; isPrimary: boolean;
  }>>([]);
  const [addressData, setAddressData] = useState({
    label: '',
    recipient: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Load addresses dari BE saat mount (kalau login)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { addressApi } = await import('../api/addressApi');
        const list = await addressApi.getAddresses();
        if (cancelled) return;
        setAddresses(list);
        const primary = list.find((a) => a.isPrimary) || list[0];
        if (primary) {
          setAddressData({
            label: primary.label,
            recipient: primary.recipientName,
            phone: primary.phone,
            address: primary.addressLine,
            city: primary.city,
            province: primary.province,
            postalCode: primary.postalCode,
          });
        }
      } catch { /* BE unavailable -> tetap kosong */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { authApi } = await import('../api/authApi');
    const res = await authApi.updateProfile({
      name: profileData.fullName,
      email: profileData.email,
      phone: profileData.phone,
    });
    showToast(res.message);
    if (res.success && res.user) {
      setProfileData((p) => ({ ...p, fullName: res.user!.name || p.fullName, email: res.user!.email || p.email }));
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      showToast('Masukkan kata sandi saat ini.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter.');
      return;
    }
    const { authApi } = await import('../api/authApi');
    const res = await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
    showToast(res.message);
    if (res.success) {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSaving(true);
    try {
      const { addressApi } = await import('../api/addressApi');
      const input = {
        label: addressData.label,
        recipient_name: addressData.recipient,
        phone: addressData.phone,
        address_line: addressData.address,
        city: addressData.city,
        province: addressData.province,
        postal_code: addressData.postalCode,
        is_primary: addresses.length === 0,
      };
      if (addresses.length === 0) {
        await addressApi.createAddress(input);
      } else {
        await addressApi.updateAddress(addresses[0].id, input);
      }
      const list = await addressApi.getAddresses();
      setAddresses(list);
      setIsEditingAddress(false);
      showToast('Alamat pengiriman berhasil disimpan!');
    } catch {
      showToast('Gagal menyimpan alamat.');
    } finally {
      setAddressSaving(false);
    }
  };

  // Filter orders by tab
  const filteredOrders = orders.filter((ord) => {
    if (orderFilter === 'Semua') return true;
    if (orderFilter === 'Belum Bayar') return ord.status === 'Pending';
    if (orderFilter === 'Sedang Dikemas' || orderFilter === 'Diproses')
      return ord.status === 'Diproses';
    if (orderFilter === 'Dikirim') return ord.status === 'Dikirim';
    if (orderFilter === 'Selesai') return ord.status === 'Selesai';
    if (orderFilter === 'Dibatalkan') return ord.status === 'Dibatalkan';
    return true;
  });

  return (
    <div className="pt-24 pb-20 px-4 md:px-10 max-w-7xl mx-auto font-['Plus_Jakarta_Sans'] text-[#1d1b17] dark:text-[#f5f3f0] animate-fadeIn min-h-screen bg-[#faf8f5] dark:bg-[#14120e]">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-72 bg-white dark:bg-[#1a1815] rounded-2xl p-6 border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm h-fit shrink-0">
          {/* User Profile Header */}
          <div className="flex items-center gap-4 pb-6 mb-6 border-b border-[#c4c8bc]/30 dark:border-white/10">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[#2b3e1d] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0 border-2 border-[#fade88]/30">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwdVH1D5ecKN62Wytyzaw1zN_anZ6YtNQZI2I9valVfVT8BbPHgEDivkiq7r8VIE0aHXv86yS8zeF5QfJj_0L_IIsCASNCylrKt5ow0HmPn512vfiNzr61kbCEhlGx3eUmV2EdSD3ydd7ugNg7-TlFnzJ1-lqbuN_P1y4bfpY1RYTVehJ7wIy14Vyd4Y28PUfj2wA_C8c6qiehT3XeyMFQSoV21lv59c1n896hUIDtC3ajIL00VFE"
                alt={profileData.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-['Playfair_Display'] font-bold text-lg text-[#162809] dark:text-[#fde08b] truncate">
                {profileData.fullName}
              </h2>
              <p className="text-xs text-[#75786e] dark:text-[#8a8e86] truncate">{profileData.email}</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1.5">
            {currentUser?.role === 'admin' && onNavigateAdmin && (
              <button
                onClick={onNavigateAdmin}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[#44483f] dark:text-[#b8bcb4] hover:bg-[#faf8f5] dark:hover:bg-[#252320] hover:text-[#162809] dark:hover:text-white transition-all text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl text-[#162809] dark:text-[#fde08b]">admin_panel_settings</span>
                <span>{t('Halaman Admin', 'Admin Panel')}</span>
              </button>
            )}

            <button
              onClick={() => {
                setSelectedOrderDetail(null);
                setActiveTab('profil');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left cursor-pointer ${
                activeTab === 'profil'
                  ? 'bg-[#2b3e1d] text-white shadow-sm font-bold'
                  : 'text-[#44483f] dark:text-[#b8bcb4] hover:bg-[#faf8f5] dark:hover:bg-[#252320] hover:text-[#162809] dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-xl">person</span>
              <span>Profil Saya</span>
            </button>

            <button
              onClick={() => {
                setSelectedOrderDetail(null);
                setActiveTab('pesanan');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left cursor-pointer ${
                activeTab === 'pesanan'
                  ? 'bg-[#2b3e1d] text-white shadow-sm font-bold'
                  : 'text-[#44483f] dark:text-[#b8bcb4] hover:bg-[#faf8f5] dark:hover:bg-[#252320] hover:text-[#162809] dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-xl">history</span>
              <span>Pesanan Saya</span>
            </button>

            <button
              onClick={() => {
                setSelectedOrderDetail(null);
                setActiveTab('favorit');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left cursor-pointer ${
                activeTab === 'favorit'
                  ? 'bg-[#2b3e1d] text-white shadow-sm font-bold'
                  : 'text-[#44483f] dark:text-[#b8bcb4] hover:bg-[#faf8f5] dark:hover:bg-[#252320] hover:text-[#162809] dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-xl">favorite</span>
              <span>Produk Favorit</span>
            </button>

            <button
              onClick={() => {
                setSelectedOrderDetail(null);
                setActiveTab('pengaturan');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left cursor-pointer ${
                activeTab === 'pengaturan'
                  ? 'bg-[#2b3e1d] text-white shadow-sm font-bold'
                  : 'text-[#44483f] dark:text-[#b8bcb4] hover:bg-[#faf8f5] dark:hover:bg-[#252320] hover:text-[#162809] dark:hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-xl">settings</span>
              <span>Pengaturan Akun</span>
            </button>

            <div className="pt-4 mt-4 border-t border-[#c4c8bc]/30 dark:border-white/10">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">logout</span>
                <span>Keluar</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Right Main Panel Content */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: PROFIL SAYA */}
          {activeTab === 'profil' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Informasi Pribadi */}
              <div className="bg-white dark:bg-[#1a1815] rounded-2xl p-6 sm:p-8 border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#c4c8bc]/30 dark:border-white/10">
                  <span className="material-symbols-outlined text-2xl text-[#162809] dark:text-[#fde08b]">
                    badge
                  </span>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#162809] dark:text-[#fde08b]">
                    Informasi Pribadi
                  </h3>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#44483f] dark:text-[#b8bcb4] mb-1.5">
                        NAMA LENGKAP
                      </label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) =>
                          setProfileData({ ...profileData, fullName: e.target.value })
                        }
                        className="w-full bg-[#faf8f5] dark:bg-[#242220] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#1d1b17] dark:text-[#f5f3f0] placeholder-[#75786e]/60 focus:outline-none focus:bg-white dark:focus:bg-[#1c1a16] focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#44483f] dark:text-[#b8bcb4] mb-1.5">
                        EMAIL
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({ ...profileData, email: e.target.value })
                        }
                        className="w-full bg-[#faf8f5] dark:bg-[#242220] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#1d1b17] dark:text-[#f5f3f0] placeholder-[#75786e]/60 focus:outline-none focus:bg-white dark:focus:bg-[#1c1a16] focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#44483f] dark:text-[#b8bcb4] mb-1.5">
                        NOMOR TELEPON
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        className="w-full bg-[#faf8f5] dark:bg-[#242220] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#1d1b17] dark:text-[#f5f3f0] placeholder-[#75786e]/60 focus:outline-none focus:bg-white dark:focus:bg-[#1c1a16] focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#44483f] dark:text-[#b8bcb4] mb-1.5">
                        JENIS KELAMIN
                      </label>
                      <select
                        value={profileData.gender}
                        onChange={(e) =>
                          setProfileData({ ...profileData, gender: e.target.value })
                        }
                        className="w-full bg-[#faf8f5] dark:bg-[#242220] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#1d1b17] dark:text-[#f5f3f0] focus:outline-none focus:bg-white dark:focus:bg-[#1c1a16] focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
                      >
                        <option value="Perempuan">Perempuan</option>
                        <option value="Laki-laki">Laki-laki</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#44483f] dark:text-[#b8bcb4] mb-1.5">
                        TANGGAL LAHIR
                      </label>
                      <input
                        type="text"
                        value={profileData.birthDate}
                        onChange={(e) =>
                          setProfileData({ ...profileData, birthDate: e.target.value })
                        }
                        className="w-full bg-[#faf8f5] dark:bg-[#242220] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#1d1b17] dark:text-[#f5f3f0] placeholder-[#75786e]/60 focus:outline-none focus:bg-white dark:focus:bg-[#1c1a16] focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-[#2b3e1d] hover:bg-[#162809] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>

              {/* Alamat Pengiriman */}
              <div className="bg-white dark:bg-[#1a1815] rounded-2xl p-6 sm:p-8 border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#c4c8bc]/30 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-[#162809] dark:text-[#fde08b]">
                      location_on
                    </span>
                    <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#162809] dark:text-[#fde08b]">
                      Alamat Pengiriman
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="text-xs font-bold text-[#2b3e1d] dark:text-[#fde08b] hover:underline cursor-pointer border border-[#2b3e1d]/30 dark:border-[#fde08b]/30 px-4 py-2 rounded-xl transition-all"
                  >
                    {isEditingAddress ? 'Batal Edit' : 'Tambah Alamat Baru'}
                  </button>
                </div>

                {isEditingAddress ? (
                  <form onSubmit={handleSaveAddress} className="space-y-4 bg-[#faf8f5] dark:bg-[#201e1a] p-6 rounded-2xl border border-[#c4c8bc]/40 dark:border-white/10">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#44483f] dark:text-[#b8bcb4] mb-1">
                        Label Alamat
                      </label>
                      <input
                        type="text"
                        value={addressData.label}
                        onChange={(e) => setAddressData({ ...addressData, label: e.target.value })}
                        className="w-full bg-white dark:bg-[#1a1815] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#44483f] dark:text-[#b8bcb4] mb-1">
                          Nama Penerima
                        </label>
                        <input
                          type="text"
                          value={addressData.recipient}
                          onChange={(e) => setAddressData({ ...addressData, recipient: e.target.value })}
                          className="w-full bg-white dark:bg-[#1a1815] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#44483f] dark:text-[#b8bcb4] mb-1">
                          Nomor HP
                        </label>
                        <input
                          type="text"
                          value={addressData.phone}
                          onChange={(e) => setAddressData({ ...addressData, phone: e.target.value })}
                          className="w-full bg-white dark:bg-[#1a1815] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#44483f] dark:text-[#b8bcb4] mb-1">
                        Alamat Lengkap
                      </label>
                      <textarea
                        rows={3}
                        value={addressData.address}
                        onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                        className="w-full bg-white dark:bg-[#1a1815] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#44483f] dark:text-[#b8bcb4] mb-1">
                          Provinsi
                        </label>
                        <input
                          type="text"
                          value={addressData.province}
                          onChange={(e) => setAddressData({ ...addressData, province: e.target.value })}
                          className="w-full bg-white dark:bg-[#1a1815] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#44483f] dark:text-[#b8bcb4] mb-1">
                          Kota/Kabupaten
                        </label>
                        <input
                          type="text"
                          value={addressData.city}
                          onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                          className="w-full bg-white dark:bg-[#1a1815] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#44483f] dark:text-[#b8bcb4] mb-1">
                          Kode Pos
                        </label>
                        <input
                          type="text"
                          value={addressData.postalCode}
                          onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })}
                          className="w-full bg-white dark:bg-[#1a1815] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={addressSaving}
                      className="bg-[#2b3e1d] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#162809] disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {addressSaving ? 'Menyimpan...' : 'Simpan Alamat'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {addresses.length === 0 ? (
                      <div className="bg-[#faf8f5] dark:bg-[#201e1a] rounded-2xl p-6 border border-[#c4c8bc]/30 dark:border-white/10 text-center">
                        <p className="text-sm text-[#44483f] dark:text-[#b8bcb4]">
                          Belum ada alamat pengiriman. Tambahkan alamat pertamamu!
                        </p>
                      </div>
                    ) : (
                      addresses.map((addr) => (
                        <div key={addr.id} className="bg-[#faf8f5] dark:bg-[#201e1a] rounded-2xl p-6 border border-[#c4c8bc]/40 dark:border-white/10 relative">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm text-[#162809] dark:text-[#fde08b]">{addr.label}</h4>
                            {addr.isPrimary && (
                              <span className="bg-[#2b3e1d] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md tracking-wider">
                                UTAMA
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-sm text-[#162809] dark:text-[#f5f3f0] mb-1">
                            {addr.recipientName} ({addr.phone})
                          </p>
                          <p className="text-xs text-[#44483f] dark:text-[#b8bcb4] leading-relaxed mb-4">
                            {addr.addressLine}, {addr.city}, {addr.province} {addr.postalCode}
                          </p>
                          <button
                            onClick={() => {
                              setAddressData({
                                label: addr.label,
                                recipient: addr.recipientName,
                                phone: addr.phone,
                                address: addr.addressLine,
                                city: addr.city,
                                province: addr.province,
                                postalCode: addr.postalCode,
                              });
                              setIsEditingAddress(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#162809] dark:text-[#fde08b] hover:underline cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Ubah Alamat</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PESANAN SAYA (OR ORDER DETAIL VIEW) */}
          {activeTab === 'pesanan' && (
            <div className="animate-fadeIn">
              {selectedOrderDetail ? (
                /* ORDER DETAIL VIEW */
                <div className="space-y-6">
                  {/* Breadcrumb */}
                  <nav className="flex items-center gap-2 text-xs text-[#44483f] dark:text-[#b8bcb4] mb-2">
                    <button
                      onClick={() => setSelectedOrderDetail(null)}
                      className="hover:text-[#162809] dark:hover:text-[#fde08b] font-medium cursor-pointer"
                    >
                      Riwayat Pesanan
                    </button>
                    <span>/</span>
                    <span className="font-bold text-[#162809] dark:text-[#fde08b]">
                      Detail Pesanan {selectedOrderDetail.id}
                    </span>
                  </nav>

                  {/* Header Title */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white dark:bg-[#1a1815] p-6 rounded-2xl border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm gap-4">
                    <div>
                      <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#162809] dark:text-[#fde08b]">
                        Order {selectedOrderDetail.id}
                      </h2>
                      <p className="text-xs text-[#75786e] dark:text-[#8a8e86] mt-1">
                        Pesanan dibuat: {selectedOrderDetail.createdAt}
                      </p>
                    </div>
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto flex items-center gap-1.5 border ${
                        selectedOrderDetail.status === 'Selesai'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/50'
                          : selectedOrderDetail.status === 'Dikirim'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800/50'
                          : selectedOrderDetail.status === 'Diproses'
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800/50'
                          : selectedOrderDetail.status === 'Dibatalkan'
                          ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800/50'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {selectedOrderDetail.status === 'Selesai'
                          ? 'check_circle'
                          : selectedOrderDetail.status === 'Dikirim'
                          ? 'local_shipping'
                          : selectedOrderDetail.status === 'Diproses'
                          ? 'inventory_2'
                          : selectedOrderDetail.status === 'Dibatalkan'
                          ? 'cancel'
                          : 'schedule'}
                      </span>
                      <span>{selectedOrderDetail.status}</span>
                    </span>
                  </div>

                  {/* Two Column Layout for Order Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Tracking & Stepper */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Stepper Card */}
                      <div className="bg-white dark:bg-[#1a1815] p-6 rounded-2xl border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm">
                        <h3 className="font-['Playfair_Display'] font-bold text-base text-[#162809] dark:text-[#fde08b] mb-6">
                          Status Pengiriman
                        </h3>

                        {selectedOrderDetail.status === 'Dibatalkan' ? (
                          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 rounded-xl text-center">
                            <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400 mb-1">cancel</span>
                            <p className="font-bold text-sm text-red-700 dark:text-red-300">Pesanan Dibatalkan</p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">Pesanan ini telah dibatalkan. Silakan hubungi admin jika terdapat kendala.</p>
                          </div>
                        ) : (
                          <div className="relative py-2">
                            {/* Connecting Progress Line */}
                            <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-[#c4c8bc]/30 dark:bg-white/10 z-0">
                              <div
                                className="h-full bg-[#162809] dark:bg-[#fde08b] transition-all duration-500"
                                style={{
                                  width: `${
                                    (() => {
                                      const currentStep =
                                        selectedOrderDetail.status === 'Pending'
                                          ? 1
                                          : selectedOrderDetail.status === 'Diproses'
                                          ? 3
                                          : selectedOrderDetail.status === 'Dikirim'
                                          ? 4
                                          : selectedOrderDetail.status === 'Selesai'
                                          ? 5
                                          : 1;
                                      return ((currentStep - 1) / 4) * 100;
                                    })()
                                  }%`,
                                }}
                              />
                            </div>

                            {/* Stepper Equal 5 Columns Grid */}
                            <div className="grid grid-cols-5 text-center relative z-10">
                              {[
                                { num: 1, label: 'Pesanan Dibuat', icon: 'description' },
                                { num: 2, label: 'Pembayaran Berhasil', icon: 'payments' },
                                { num: 3, label: 'Diproses', icon: 'inventory_2' },
                                { num: 4, label: 'Dikirim', icon: 'local_shipping' },
                                { num: 5, label: 'Selesai', icon: 'check_circle' },
                              ].map((s) => {
                                const currentStep =
                                  selectedOrderDetail.status === 'Pending'
                                    ? 1
                                    : selectedOrderDetail.status === 'Diproses'
                                    ? 3
                                    : selectedOrderDetail.status === 'Dikirim'
                                    ? 4
                                    : selectedOrderDetail.status === 'Selesai'
                                    ? 5
                                    : 1;

                                const isDone = s.num < currentStep;
                                const isActive = s.num === currentStep;

                                return (
                                  <div key={s.num} className="flex flex-col items-center px-1">
                                    <div
                                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow transition-all ${
                                        isDone
                                          ? 'bg-[#162809] text-white'
                                          : isActive
                                          ? 'bg-[#2b3e1d] text-white ring-4 ring-[#fade88]/40'
                                          : 'bg-[#faf8f5] dark:bg-[#252320] text-[#75786e] border border-[#c4c8bc]/40 dark:border-white/10'
                                      }`}
                                    >
                                      {isDone ? (
                                        '✓'
                                      ) : isActive ? (
                                        <span className="material-symbols-outlined text-sm">{s.icon}</span>
                                      ) : (
                                        s.num
                                      )}
                                    </div>
                                    <span
                                      className={`text-[11px] leading-tight mt-2.5 max-w-[90px] mx-auto block ${
                                        isDone || isActive ? 'font-bold text-[#162809] dark:text-[#fde08b]' : 'text-[#75786e] dark:text-[#8a8e86]'
                                      }`}
                                    >
                                      {s.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Lacak Pengiriman */}
                      <div className="bg-white dark:bg-[#1a1815] p-6 rounded-2xl border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-['Playfair_Display'] font-bold text-base text-[#162809] dark:text-[#fde08b]">
                            Lacak Pengiriman
                          </h3>
                          {trackingData?.tracking?.resi_status && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#162809] text-white">
                              {trackingData.tracking.resi_status}
                            </span>
                          )}
                        </div>

                        {selectedOrderDetail.courier || selectedOrderDetail.trackingNumber ? (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#faf8f5] dark:bg-[#201e1a] rounded-xl px-4 py-2.5 border border-[#c4c8bc]/30 dark:border-white/10 text-xs">
                            <span className="flex items-center gap-1.5 font-bold text-[#162809] dark:text-[#fde08b]">
                              <span className="material-symbols-outlined text-sm">local_shipping</span>
                              {selectedOrderDetail.courier || 'Kurir'}
                            </span>
                            {selectedOrderDetail.trackingNumber && (
                              <span className="font-mono font-bold text-[#162809] dark:text-[#f5f3f0]">
                                Resi: {selectedOrderDetail.trackingNumber}
                              </span>
                            )}
                            <a
                              href={`https://cekresi.com/cek-resi/?courier=${selectedOrderDetail.courier}&awb=${selectedOrderDetail.trackingNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#2b3e1d] dark:text-[#fde08b] font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                              Lacak
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-[#75786e]">
                            Resi belum diinput oleh admin. Pesanan ini belum dikirim.
                          </p>
                        )}

                        {trackingData?.tracking && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#faf8f5] dark:bg-[#201e1a] rounded-xl px-4 py-3 border border-[#c4c8bc]/20 dark:border-white/10">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#75786e] font-bold">Pengirim</p>
                              <p className="font-semibold text-[#1d1b17] dark:text-[#f5f3f0] mt-0.5">{trackingData.tracking.pengirim || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#75786e] font-bold">Tujuan</p>
                              <p className="font-semibold text-[#1d1b17] dark:text-[#f5f3f0] mt-0.5">{trackingData.tracking.tujuan || '-'}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <p className="text-[10px] uppercase tracking-wide text-[#75786e] font-bold">Update Terakhir</p>
                              <p className="font-semibold text-[#1d1b17] dark:text-[#f5f3f0] mt-0.5">
                                {trackingData.tracking.checked_at
                                  ? new Date(trackingData.tracking.checked_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                  : '-'}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-[#c4c8bc]/20 dark:border-white/10 space-y-4">
                          <h4 className="font-bold text-xs text-[#44483f] dark:text-[#b8bcb4] uppercase tracking-wider">
                            Riwayat Terbaru
                          </h4>
                          {trackingLoading ? (
                            <p className="text-xs text-[#75786e]">Memuat riwayat pengiriman...</p>
                          ) : trackingData?.history?.length ? (
                            <div className="space-y-3 pl-2 border-l-2 border-[#2b3e1d]">
                              {trackingData.history.map((ev, idx) => (
                                <div key={idx} className="pl-3 relative">
                                  <p className="text-xs font-bold text-[#162809] dark:text-[#fde08b]">
                                    {ev.event_date && ev.event_date !== '-' ? ev.event_date : '—'}
                                  </p>
                                  <p className="text-xs text-[#44483f] dark:text-[#b8bcb4]">{ev.description}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-[#75786e]">
                              Belum ada riwayat perjalanan dari ekspedisi.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Order Summary & Shipping Info */}
                    <div className="space-y-6">
                      {/* Ringkasan Pesanan */}
                      <div className="bg-white dark:bg-[#1a1815] p-6 rounded-2xl border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm space-y-4">
                        <h3 className="font-['Playfair_Display'] font-bold text-base text-[#162809] dark:text-[#fde08b] border-b border-[#c4c8bc]/30 dark:border-white/10 pb-3">
                          Ringkasan Pesanan
                        </h3>

                        <div className="space-y-3">
                          {selectedOrderDetail.items.map((it, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                              <img
                                src={it.product.image}
                                alt={it.product.name}
                                className="w-14 h-14 object-cover rounded-xl bg-[#faf8f5] dark:bg-[#201e1a] border border-[#c4c8bc]/30 dark:border-white/10"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-[#162809] dark:text-[#f5f3f0] truncate">
                                  {it.product.name}
                                </h4>
                                <p className="text-[11px] text-[#75786e] dark:text-[#8a8e86]">
                                  {it.product.unitInfo || it.product.weight} x {it.quantity}
                                </p>
                                <p className="font-bold text-xs text-[#162809] dark:text-[#fde08b]">
                                  Rp {(it.product.price * it.quantity).toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-[#c4c8bc]/30 dark:border-white/10 pt-3 space-y-1.5 text-xs text-[#44483f] dark:text-[#b8bcb4]">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>
                              Rp{' '}
                              {selectedOrderDetail.items
                                .reduce((s, i) => s + i.product.price * i.quantity, 0)
                                .toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pengiriman</span>
                            <span>Rp {((selectedOrderDetail as any).shippingCost ?? 15000).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between font-bold text-sm text-[#162809] dark:text-[#fde08b] pt-2 border-t border-[#c4c8bc]/20 dark:border-white/10">
                            <span>Total Tagihan</span>
                            <span>Rp {selectedOrderDetail.totalAmount.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Informasi Pengiriman */}
                      <div className="bg-white dark:bg-[#1a1815] p-6 rounded-2xl border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm space-y-2">
                        <div className="flex items-center gap-1.5 text-[#162809] dark:text-[#fde08b] font-bold text-sm">
                          <span className="material-symbols-outlined text-lg">location_on</span>
                          <span>Informasi Pengiriman</span>
                        </div>
                        <p className="text-xs font-bold text-[#162809] dark:text-[#f5f3f0]">
                          {selectedOrderDetail.customerName || 'Aruna Bestari'}
                        </p>
                        <p className="text-xs text-[#44483f] dark:text-[#b8bcb4]">
                          {selectedOrderDetail.customerPhone || '+62 812-3456-7890'}
                        </p>
                        <p className="text-xs text-[#44483f] dark:text-[#b8bcb4] leading-relaxed pt-1">
                          {selectedOrderDetail.shippingAddress ||
                            'Jl. Kebon Jeruk No. 12, Jakarta Barat, DKI Jakarta, 11530'}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        {selectedOrderDetail.status !== 'Dikirim' &&
                          selectedOrderDetail.status !== 'Selesai' &&
                          selectedOrderDetail.status !== 'Dibatalkan' && (
                            <button
                              onClick={() => handleCancelOrder(selectedOrderDetail.id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xs cursor-pointer shadow-sm"
                            >
                              Batalkan Pesanan
                            </button>
                          )}
                        <button
                          onClick={() => setSelectedOrderDetail(null)}
                          className={`py-3 rounded-xl font-bold text-xs hover:bg-[#162809] cursor-pointer shadow-sm ${
                            selectedOrderDetail.status !== 'Dikirim' &&
                            selectedOrderDetail.status !== 'Selesai' &&
                            selectedOrderDetail.status !== 'Dibatalkan'
                              ? 'flex-1 bg-[#2b3e1d] text-white'
                              : 'w-full bg-[#2b3e1d] text-white'
                          }`}
                        >
                          Kembali ke Riwayat Pesanan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MAIN ORDERS LIST WITH FILTER TABS */
                <div className="space-y-6">
                  {/* Status Filter Tabs */}
                  <div className="bg-white dark:bg-[#1a1815] p-3 rounded-2xl border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm flex gap-2 overflow-x-auto no-scrollbar">
                    {[
                      'Semua',
                      'Belum Bayar',
                      'Sedang Dikemas',
                      'Dikirim',
                      'Selesai',
                      'Dibatalkan',
                      'Pengembalian Barang',
                    ].map((tabName) => (
                      <button
                        key={tabName}
                        onClick={() => setOrderFilter(tabName)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          orderFilter === tabName
                            ? 'bg-[#162809] text-white shadow-sm'
                            : 'text-[#44483f] dark:text-[#b8bcb4] hover:bg-[#faf8f5] dark:hover:bg-[#252320]'
                        }`}
                      >
                        {tabName}
                      </button>
                    ))}
                  </div>

                  {/* Order List Cards */}
                  {filteredOrders.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a1815] rounded-2xl p-12 text-center border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm">
                      <span className="material-symbols-outlined text-5xl text-[#75786e] mb-2">
                        receipt_long
                      </span>
                      <h3 className="font-['Playfair_Display'] font-bold text-lg text-[#162809] dark:text-[#fde08b]">
                        Belum ada pesanan pada kategori ini
                      </h3>
                      <p className="text-xs text-[#44483f] dark:text-[#b8bcb4] mt-1 mb-4">
                        Jelajahi berbagai produk sorgum terbaik BESTARI dan buat pesanan pertama Anda.
                      </p>
                      <button
                        onClick={onNavigateProducts}
                        className="bg-[#2b3e1d] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-[#162809] cursor-pointer shadow-sm"
                      >
                        Lihat Katalog Produk
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-white dark:bg-[#1a1815] rounded-2xl p-6 border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm space-y-4 hover:shadow-md transition-all"
                        >
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#c4c8bc]/30 dark:border-white/10 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-['Playfair_Display'] font-bold text-lg text-[#162809] dark:text-[#fde08b]">
                                {ord.id}
                              </span>
                              {ord.items[0]?.product.badge && (
                                <span className="bg-[#fade88] text-[#162809] text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wider uppercase border border-[#162809]/10">
                                  {ord.items[0].product.badge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-['Playfair_Display'] font-bold text-base text-[#162809] dark:text-[#fde08b]">
                                Rp {ord.totalAmount.toLocaleString('id-ID')}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                                  ord.status === 'Selesai'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/50'
                                    : ord.status === 'Dikirim'
                                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800/50'
                                    : ord.status === 'Diproses'
                                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800/50'
                                    : ord.status === 'Dibatalkan'
                                    ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800/50'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800/50'
                                }`}
                              >
                                <span className="material-symbols-outlined text-sm">
                                  {ord.status === 'Selesai'
                                    ? 'check_circle'
                                    : ord.status === 'Dikirim'
                                    ? 'local_shipping'
                                    : ord.status === 'Diproses'
                                    ? 'inventory_2'
                                    : ord.status === 'Dibatalkan'
                                    ? 'cancel'
                                    : 'schedule'}
                                </span>
                                <span>{ord.status.toUpperCase()}</span>
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-[#75786e] dark:text-[#8a8e86]">Pesanan pada {ord.createdAt}</p>

                          {/* List of checked out items */}
                          <div className="space-y-3 py-2 border-y border-[#c4c8bc]/20 dark:border-white/10">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <img
                                    src={it.product.image}
                                    alt={it.product.name}
                                    className="w-14 h-14 object-cover rounded-xl bg-[#faf8f5] dark:bg-[#201e1a] border border-[#c4c8bc]/30 dark:border-white/10 shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm text-[#162809] dark:text-[#f5f3f0] truncate">
                                      {it.product.name}
                                    </p>
                                    <p className="text-xs text-[#44483f] dark:text-[#b8bcb4]">
                                      {it.product.unitInfo || it.product.weight} • <strong className="text-[#162809] dark:text-[#fde08b] font-bold">{it.quantity}x</strong>
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-bold text-xs text-[#162809] dark:text-[#fde08b]">
                                    Rp {(it.product.price * it.quantity).toLocaleString('id-ID')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => setSelectedOrderDetail(ord)}
                              className="bg-[#faf8f5] dark:bg-[#252320] border border-[#2b3e1d] text-[#162809] dark:text-[#fde08b] hover:bg-[#2b3e1d] hover:text-white dark:hover:bg-[#2b3e1d] dark:hover:text-white px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs"
                            >
                              Lihat Detail Pesanan
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRODUK FAVORIT */}
          {activeTab === 'favorit' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white dark:bg-[#1a1815] rounded-2xl p-6 sm:p-8 border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm">
                <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#162809] dark:text-[#fde08b] mb-1">
                  Produk Favorit Anda
                </h2>
                <p className="text-xs sm:text-sm text-[#44483f] dark:text-[#b8bcb4] mb-6">
                  Koleksi kurasi sorghum pilihan Anda, siap untuk menyempurnakan hidangan sehat keluarga.
                </p>

                {favoriteProducts.length === 0 ? (
                  <div className="text-center py-10 bg-[#faf8f5] dark:bg-[#201e1a] rounded-2xl border border-[#c4c8bc]/30 dark:border-white/10 p-6">
                    <span className="material-symbols-outlined text-4xl text-[#75786e] mb-2">favorite_border</span>
                    <p className="text-xs sm:text-sm font-bold text-[#162809] dark:text-[#fde08b]">Belum ada produk favorit</p>
                    <p className="text-xs text-[#75786e] mt-1">Klik ikon hati pada produk di katalog untuk menyimpannya di sini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                    {favoriteProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-white dark:bg-[#1a1815] rounded-2xl p-5 border border-[#c4c8bc]/40 dark:border-white/10 relative flex flex-col justify-between group hover:shadow-md transition-all"
                      >
                        {/* Heart Remove Button */}
                        <button
                          onClick={() => {
                            const wid = wishlistIds[String(prod.id)];
                            if (wid) {
                              wishlistApi.removeFromWishlist(wid).then((ok) => {
                                if (ok) {
                                  setFavoriteProducts(favoriteProducts.filter((p) => p.id !== prod.id));
                                  showToast(`${prod.name} dihapus dari favorit.`);
                                } else {
                                  showToast('Gagal menghapus favorit.');
                                }
                              });
                            } else {
                              setFavoriteProducts(favoriteProducts.filter((p) => p.id !== prod.id));
                              showToast(`${prod.name} dihapus dari favorit.`);
                            }
                          }}
                          className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-[#252320] text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer border border-[#c4c8bc]/30 dark:border-white/10"
                          title="Hapus dari Favorit"
                        >
                          ♥
                        </button>

                        <div>
                          {/* Image */}
                          <div className="relative rounded-xl overflow-hidden mb-3 bg-[#faf8f5] dark:bg-[#201e1a] h-48 flex items-center justify-center border border-[#c4c8bc]/30 dark:border-white/10">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {prod.badge && (
                              <span className="absolute top-2 left-2 bg-[#fade88] text-[#162809] text-[10px] font-bold px-2.5 py-0.5 rounded tracking-wider border border-[#162809]/10">
                                {prod.badge}
                              </span>
                            )}
                          </div>

                          {/* Title & info */}
                          <span className="text-[10px] font-bold uppercase text-[#75786e] dark:text-[#8a8e86] tracking-wider block">
                            {prod.categoryLabel}
                          </span>
                          <h3 className="font-['Playfair_Display'] font-bold text-base text-[#162809] dark:text-[#f5f3f0] mb-1">
                            {prod.name}
                          </h3>
                          <p className="text-xs text-[#44483f] dark:text-[#b8bcb4] line-clamp-2 mb-3">
                            {prod.description}
                          </p>
                        </div>

                        {/* Price & Action */}
                        <div className="pt-3 border-t border-[#c4c8bc]/30 dark:border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#75786e] dark:text-[#8a8e86] block">{prod.unitInfo}</span>
                            <span className="font-bold text-sm text-[#162809] dark:text-[#fde08b]">
                              {prod.formattedPrice}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => onSelectProduct(prod)}
                              className="p-2 border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl hover:bg-[#faf8f5] dark:hover:bg-[#252320] text-[#162809] dark:text-[#fde08b] transition-colors cursor-pointer"
                              title="Detail Produk"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>
                            <button
                              onClick={() => onAddToCart(prod)}
                              className="bg-[#2b3e1d] hover:bg-[#162809] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              + Tambah
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Banner CTA */}
                <div className="mt-8 bg-gradient-to-r from-[#2b3e1d]/5 via-[#fade88]/10 to-[#2b3e1d]/5 dark:from-[#fade88]/5 dark:to-[#2b3e1d]/5 rounded-2xl p-6 border border-dashed border-[#2b3e1d]/30 dark:border-white/20 text-center space-y-3">
                  <span className="material-symbols-outlined text-3xl text-[#162809] dark:text-[#fde08b]">add_circle</span>
                  <p className="font-bold text-sm text-[#162809] dark:text-[#fde08b]">Ingin menambah lebih banyak?</p>
                  <p className="text-xs text-[#44483f] dark:text-[#b8bcb4]">
                    Jelajahi katalog kami untuk menemukan produk sorghum terbaik lainnya.
                  </p>
                  <button
                    onClick={onNavigateProducts}
                    className="bg-[#2b3e1d] hover:bg-[#162809] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
                  >
                    Buka Katalog Produk
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PENGATURAN AKUN */}
          {activeTab === 'pengaturan' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Ubah Kata Sandi */}
              <div className="bg-white dark:bg-[#1a1815] rounded-2xl p-6 sm:p-8 border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm max-w-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#c4c8bc]/30 dark:border-white/10">
                  <span className="material-symbols-outlined text-2xl text-[#162809] dark:text-[#fde08b]">lock</span>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#162809] dark:text-[#fde08b]">
                    Ubah Kata Sandi
                  </h3>
                </div>

                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#44483f] dark:text-[#b8bcb4] mb-1.5">
                      Kata Sandi Saat Ini
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full bg-[#faf8f5] dark:bg-[#242220] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#1d1b17] dark:text-[#f5f3f0] placeholder-[#75786e]/60 focus:outline-none focus:bg-white dark:focus:bg-[#1c1a16] focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#44483f] dark:text-[#b8bcb4] mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      placeholder="Min. 8 karakter"
                      className="w-full bg-[#faf8f5] dark:bg-[#242220] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#1d1b17] dark:text-[#f5f3f0] placeholder-[#75786e]/60 focus:outline-none focus:bg-white dark:focus:bg-[#1c1a16] focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#44483f] dark:text-[#b8bcb4] mb-1.5">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      placeholder="Ulangi kata sandi baru"
                      className="w-full bg-[#faf8f5] dark:bg-[#242220] border border-[#c4c8bc]/60 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#1d1b17] dark:text-[#f5f3f0] placeholder-[#75786e]/60 focus:outline-none focus:bg-white dark:focus:bg-[#1c1a16] focus:border-[#2b3e1d] focus:ring-1 focus:ring-[#2b3e1d] transition-all font-medium"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-[#2b3e1d] hover:bg-[#162809] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      Perbarui Kata Sandi
                    </button>
                  </div>
                </form>
              </div>

              {/* Privasi & Data */}
              <div className="bg-white dark:bg-[#1a1815] rounded-2xl p-6 sm:p-8 border border-[#c4c8bc]/40 dark:border-white/10 shadow-sm max-w-xl space-y-4">
                <div className="flex items-center gap-3 mb-2 pb-4 border-b border-[#c4c8bc]/30 dark:border-white/10">
                  <span className="material-symbols-outlined text-2xl text-[#162809] dark:text-[#fde08b]">
                    visibility
                  </span>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#162809] dark:text-[#fde08b]">
                    Privasi & Data
                  </h3>
                </div>

                <div className="bg-[#fff5f5] dark:bg-[#3c1719]/40 rounded-2xl p-5 border border-red-200/80 dark:border-red-900/40 flex items-center justify-between shadow-2xs">
                  <span className="text-xs font-bold text-red-700 dark:text-red-400">Hapus Akun Permanen</span>
                  <button
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin menghapus akun secara permanen?')) {
                        onLogout();
                        showToast('Akun telah dihapus.');
                      }
                    }}
                    className="p-2 bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/80 rounded-xl transition-colors cursor-pointer"
                    title="Hapus Akun"
                  >
                    <span className="material-symbols-outlined text-lg">delete_forever</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
