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
  const { t, orders: allOrders, products: allProducts, currentUser, updateOrderStatus, wishlistIds: ctxWishlistIds, toggleWishlist } = useApp();
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
      // items dari BE cuma {id, name, price, image...} — lengkapi dengan allProducts by id
      const enriched = items
        .map((w) => {
          const full = allProducts.find((p) => String(p.id) === String(w.id));
          return full || w;
        })
        .filter((p) => p.id);
      setFavoriteProducts(enriched);
      const idMap: Record<string, number> = {};
      // wishlist_id di-map lewat korelasi id product
      items.forEach((w) => { if (w.id) idMap[String(w.id)] = Number((w as any).wishlist_id || 0); });
      setWishlistIds(idMap);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [currentUser, allProducts, ctxWishlistIds]);

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
        is_primary: addresses.length === 0, // alamat pertama jadi primary
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
    <div className="pt-24 pb-20 px-4 md:px-10 max-w-7xl mx-auto font-['Plus_Jakarta_Sans'] text-[#1d1b17] animate-fadeIn min-h-screen">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-72 bg-[#f9f3ec] rounded-2xl p-6 border border-[#c4c8bc]/30 shadow-sm h-fit shrink-0">
          {/* User Profile Header */}
          <div className="flex items-center gap-4 pb-6 mb-6 border-b border-[#c4c8bc]/30">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[#2b3e1d] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwdVH1D5ecKN62Wytyzaw1zN_anZ6YtNQZI2I9valVfVT8BbPHgEDivkiq7r8VIE0aHXv86yS8zeF5QfJj_0L_IIsCASNCylrKt5ow0HmPn512vfiNzr61kbCEhlGx3eUmV2EdSD3ydd7ugNg7-TlFnzJ1-lqbuN_P1y4bfpY1RYTVehJ7wIy14Vyd4Y28PUfj2wA_C8c6qiehT3XeyMFQSoV21lv59c1n896hUIDtC3ajIL00VFE"
                alt={profileData.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <h2 className="font-['Playfair_Display'] font-bold text-lg text-[#162809] truncate">
                {profileData.fullName}
              </h2>
              <p className="text-xs text-[#44483f] truncate">{profileData.email}</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1.5">
            {currentUser?.role === 'admin' && onNavigateAdmin && (
              <button
                onClick={onNavigateAdmin}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[#44483f] hover:bg-[#ede7e1] transition-all text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl text-[#162809]">admin_panel_settings</span>
                <span>{t('Halaman Admin', 'Admin Panel')}</span>
              </button>
            )}

            <button
              onClick={() => {
                setSelectedOrderDetail(null);
                setActiveTab('profil');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${
                activeTab === 'profil'
                  ? 'bg-[#2b3e1d] text-white shadow-md font-bold'
                  : 'text-[#44483f] hover:bg-[#ede7e1]'
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${
                activeTab === 'pesanan'
                  ? 'bg-[#2b3e1d] text-white shadow-md font-bold'
                  : 'text-[#44483f] hover:bg-[#ede7e1]'
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${
                activeTab === 'favorit'
                  ? 'bg-[#2b3e1d] text-white shadow-md font-bold'
                  : 'text-[#44483f] hover:bg-[#ede7e1]'
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left ${
                activeTab === 'pengaturan'
                  ? 'bg-[#2b3e1d] text-white shadow-md font-bold'
                  : 'text-[#44483f] hover:bg-[#ede7e1]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">settings</span>
              <span>Pengaturan Akun</span>
            </button>

            <div className="pt-4 mt-4 border-t border-[#c4c8bc]/30">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-red-700 hover:bg-red-50 transition-all text-left"
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
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#c4c8bc]/30 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#c4c8bc]/30">
                  <span className="material-symbols-outlined text-2xl text-[#162809]">
                    badge
                  </span>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#162809]">
                    Informasi Pribadi
                  </h3>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#44483f] mb-1.5">
                        NAMA LENGKAP
                      </label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) =>
                          setProfileData({ ...profileData, fullName: e.target.value })
                        }
                        className="w-full bg-[#f9f3ec] border border-[#c4c8bc]/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b3e1d]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#44483f] mb-1.5">
                        EMAIL
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({ ...profileData, email: e.target.value })
                        }
                        className="w-full bg-[#f9f3ec] border border-[#c4c8bc]/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b3e1d]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#44483f] mb-1.5">
                        NOMOR TELEPON
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9+ ]*"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value.replace(/[^\d+ ]/g, '') })
                        }
                        className="w-full bg-[#f9f3ec] border border-[#c4c8bc]/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b3e1d]"
                        placeholder="Contoh: 081234567890"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#44483f] mb-1.5">
                        JENIS KELAMIN
                      </label>
                      <select
                        value={profileData.gender}
                        onChange={(e) =>
                          setProfileData({ ...profileData, gender: e.target.value })
                        }
                        className="w-full bg-[#f9f3ec] border border-[#c4c8bc]/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b3e1d]"
                      >
                        <option value="Perempuan">Perempuan</option>
                        <option value="Laki-laki">Laki-laki</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#44483f] mb-1.5">
                        TANGGAL LAHIR
                      </label>
                      <input
                        type="date"
                        value={profileData.birthDate}
                        onChange={(e) =>
                          setProfileData({ ...profileData, birthDate: e.target.value })
                        }
                        className="w-full bg-[#f9f3ec] border border-[#c4c8bc]/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b3e1d]"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-[#2b3e1d] hover:bg-[#162809] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>

              {/* Alamat Pengiriman */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#c4c8bc]/30 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#c4c8bc]/30">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-[#162809]">
                      location_on
                    </span>
                    <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#162809]">
                      Alamat Pengiriman
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsEditingAddress(!isEditingAddress)}
                    className="text-xs font-bold text-[#2b3e1d] hover:underline cursor-pointer border border-[#2b3e1d]/30 px-4 py-2 rounded-xl"
                  >
                    {isEditingAddress ? 'Batal Edit' : 'Tambah Alamat Baru'}
                  </button>
                </div>

                {isEditingAddress ? (
                  <form onSubmit={handleSaveAddress} className="space-y-4 bg-[#f9f3ec] p-5 rounded-2xl border border-[#c4c8bc]/40">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#44483f] mb-1">
                        Label Alamat
                      </label>
                      <input
                        type="text"
                        value={addressData.label}
                        onChange={(e) => setAddressData({ ...addressData, label: e.target.value })}
                        className="w-full bg-white border border-[#c4c8bc]/50 rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#44483f] mb-1">
                          Nama Penerima
                        </label>
                        <input
                          type="text"
                          value={addressData.recipient}
                          onChange={(e) => setAddressData({ ...addressData, recipient: e.target.value })}
                          className="w-full bg-white border border-[#c4c8bc]/50 rounded-xl px-4 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#44483f] mb-1">
                          Nomor HP
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9+ ]*"
                          value={addressData.phone}
                          onChange={(e) => setAddressData({ ...addressData, phone: e.target.value.replace(/[^\d+ ]/g, '') })}
                          className="w-full bg-white border border-[#c4c8bc]/50 rounded-xl px-4 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#44483f] mb-1">
                        Alamat Lengkap
                      </label>
                      <textarea
                        rows={3}
                        value={addressData.address}
                        onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                        className="w-full bg-white border border-[#c4c8bc]/50 rounded-xl px-4 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#44483f] mb-1">
                          Provinsi
                        </label>
                        <input
                          type="text"
                          value={addressData.province}
                          onChange={(e) => setAddressData({ ...addressData, province: e.target.value })}
                          className="w-full bg-white border border-[#c4c8bc]/50 rounded-xl px-4 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#44483f] mb-1">
                          Kota/Kabupaten
                        </label>
                        <input
                          type="text"
                          value={addressData.city}
                          onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                          className="w-full bg-white border border-[#c4c8bc]/50 rounded-xl px-4 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#44483f] mb-1">
                          Kode Pos
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={addressData.postalCode}
                          onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value.replace(/[^\d]/g, '') })}
                          className="w-full bg-white border border-[#c4c8bc]/50 rounded-xl px-4 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={addressSaving}
                      className="bg-[#2b3e1d] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#162809] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addressSaving ? 'Menyimpan...' : 'Simpan Alamat'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {addresses.length === 0 ? (
                      <div className="bg-[#f9f3ec] rounded-2xl p-6 border border-[#c4c8bc]/30 text-center">
                        <p className="text-sm text-[#44483f]">
                          Belum ada alamat pengiriman. Tambahkan alamat pertamamu!
                        </p>
                      </div>
                    ) : (
                      addresses.map((addr) => (
                        <div key={addr.id} className="bg-[#f9f3ec] rounded-2xl p-6 border border-[#c4c8bc]/30 relative">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm text-[#162809]">{addr.label}</h4>
                            {addr.isPrimary && (
                              <span className="bg-[#2b3e1d] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md tracking-wider">
                                UTAMA
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-sm text-[#162809] mb-1">
                            {addr.recipientName} ({addr.phone})
                          </p>
                          <p className="text-xs text-[#44483f] leading-relaxed mb-4">
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
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#162809] hover:underline cursor-pointer"
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
                  <nav className="flex items-center gap-2 text-xs text-[#44483f] mb-2">
                    <button
                      onClick={() => setSelectedOrderDetail(null)}
                      className="hover:text-[#162809] font-medium cursor-pointer"
                    >
                      Riwayat Pesanan
                    </button>
                    <span>/</span>
                    <span className="font-bold text-[#162809]">
                      Detail Pesanan {selectedOrderDetail.id}
                    </span>
                  </nav>

                  {/* Header Title */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-6 rounded-2xl border border-[#c4c8bc]/30 shadow-sm gap-4">
                    <div>
                      <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#162809]">
                        Order {selectedOrderDetail.id}
                      </h2>
                      <p className="text-xs text-[#44483f] mt-1">
                        Pesanan dibuat: {selectedOrderDetail.createdAt}
                      </p>
                    </div>
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto flex items-center gap-1.5 border ${
                        selectedOrderDetail.status === 'Selesai'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : selectedOrderDetail.status === 'Dikirim'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : selectedOrderDetail.status === 'Diproses'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : selectedOrderDetail.status === 'Dibatalkan'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
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
                      <div className="bg-white p-6 rounded-2xl border border-[#c4c8bc]/30 shadow-sm">
                        <h3 className="font-['Playfair_Display'] font-bold text-base text-[#162809] mb-6">
                          Status Pengiriman
                        </h3>

                        {selectedOrderDetail.status === 'Dibatalkan' ? (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                            <span className="material-symbols-outlined text-3xl text-red-600 mb-1">cancel</span>
                            <p className="font-bold text-sm text-red-700">Pesanan Dibatalkan</p>
                            <p className="text-xs text-red-600 mt-0.5">Pesanan ini telah dibatalkan. Silakan hubungi admin jika terdapat kendala.</p>
                          </div>
                        ) : (
                          <div className="relative py-2">
                            {/* Connecting Progress Line */}
                            <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-[#e7e2db] z-0">
                              <div
                                className="h-full bg-[#162809] transition-all duration-500"
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
                                          ? 'bg-[#2b3e1d] text-white ring-4 ring-[#d2eabb]'
                                          : 'bg-[#e7e2db] text-[#75786e]'
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
                                        isDone || isActive ? 'font-bold text-[#162809]' : 'text-[#75786e]'
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

                      {/* Lacak Pengiriman — data REAL dari BE /api/tracking/:orderId */}
                      <div className="bg-white p-6 rounded-2xl border border-[#c4c8bc]/30 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-['Playfair_Display'] font-bold text-base text-[#162809]">
                            Lacak Pengiriman
                          </h3>
                          {trackingData?.tracking?.resi_status && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#162809] text-white">
                              {trackingData.tracking.resi_status}
                            </span>
                          )}
                        </div>

                        {/* Info kurir + resi (otomatis dari admin, tanpa input user) */}
                        {selectedOrderDetail.courier || selectedOrderDetail.trackingNumber ? (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#f9f3ec] rounded-xl px-4 py-2.5 border border-[#c4c8bc]/30 text-xs">
                            <span className="flex items-center gap-1.5 font-bold text-[#162809]">
                              <span className="material-symbols-outlined text-sm">local_shipping</span>
                              {selectedOrderDetail.courier || 'Kurir'}
                            </span>
                            {selectedOrderDetail.trackingNumber && (
                              <span className="font-mono font-bold text-[#162809]">
                                Resi: {selectedOrderDetail.trackingNumber}
                              </span>
                            )}
                            <a
                              href={`https://cekresi.com/cek-resi/?courier=${selectedOrderDetail.courier}&awb=${selectedOrderDetail.trackingNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#2b3e1d] font-bold hover:underline inline-flex items-center gap-1"
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

                        {/* Info pengirim/tujuan/update */}
                        {trackingData?.tracking && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#faf8f5] rounded-xl px-4 py-3 border border-[#c4c8bc]/20">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#75786e] font-bold">Pengirim</p>
                              <p className="font-semibold text-[#1d1b17] mt-0.5">{trackingData.tracking.pengirim || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#75786e] font-bold">Tujuan</p>
                              <p className="font-semibold text-[#1d1b17] mt-0.5">{trackingData.tracking.tujuan || '-'}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <p className="text-[10px] uppercase tracking-wide text-[#75786e] font-bold">Update Terakhir</p>
                              <p className="font-semibold text-[#1d1b17] mt-0.5">
                                {trackingData.tracking.checked_at
                                  ? new Date(trackingData.tracking.checked_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                  : '-'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Timeline riwayat perjalanan (real dari BE) */}
                        <div className="pt-4 border-t border-[#c4c8bc]/20 space-y-4">
                          <h4 className="font-bold text-xs text-[#44483f] uppercase tracking-wider">
                            Riwayat Terbaru
                          </h4>
                          {trackingLoading ? (
                            <p className="text-xs text-[#75786e]">Memuat riwayat pengiriman...</p>
                          ) : trackingData?.history?.length ? (
                            <div className="space-y-3 pl-2 border-l-2 border-[#2b3e1d]">
                              {trackingData.history.map((ev, idx) => (
                                <div key={idx} className="pl-3 relative">
                                  <p className="text-xs font-bold text-[#162809]">
                                    {ev.event_date && ev.event_date !== '-' ? ev.event_date : '—'}
                                  </p>
                                  <p className="text-xs text-[#44483f]">{ev.description}</p>
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
                      <div className="bg-[#f9f3ec] p-6 rounded-2xl border border-[#c4c8bc]/30 shadow-sm space-y-4">
                        <h3 className="font-['Playfair_Display'] font-bold text-base text-[#162809] border-b border-[#c4c8bc]/30 pb-3">
                          Ringkasan Pesanan
                        </h3>

                        <div className="space-y-3">
                          {selectedOrderDetail.items.map((it, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                              <img
                                src={it.product.image}
                                alt={it.product.name}
                                className="w-14 h-14 object-cover rounded-xl bg-white border border-[#c4c8bc]/30"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-[#162809] truncate">
                                  {it.product.name}
                                </h4>
                                <p className="text-[11px] text-[#44483f]">
                                  {it.product.unitInfo || it.product.weight} x {it.quantity}
                                </p>
                                <p className="font-bold text-xs text-[#162809]">
                                  Rp {(it.product.price * it.quantity).toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-[#c4c8bc]/30 pt-3 space-y-1.5 text-xs text-[#44483f]">
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
                          <div className="flex justify-between font-bold text-sm text-[#162809] pt-2 border-t border-[#c4c8bc]/20">
                            <span>Total Tagihan</span>
                            <span>Rp {selectedOrderDetail.totalAmount.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Informasi Pengiriman */}
                      <div className="bg-white p-6 rounded-2xl border border-[#c4c8bc]/30 shadow-sm space-y-2">
                        <div className="flex items-center gap-1.5 text-[#162809] font-bold text-sm">
                          <span className="material-symbols-outlined text-lg">location_on</span>
                          <span>Informasi Pengiriman</span>
                        </div>
                        <p className="text-xs font-bold text-[#162809]">
                          {selectedOrderDetail.customerName || 'Aruna Sorgum'}
                        </p>
                        <p className="text-xs text-[#44483f]">
                          {selectedOrderDetail.customerPhone || '+62 812-3456-7890'}
                        </p>
                        <p className="text-xs text-[#44483f] leading-relaxed pt-1">
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
                              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-red-700 cursor-pointer"
                            >
                              Batalkan Pesanan
                            </button>
                          )}
                        <button
                          onClick={() => setSelectedOrderDetail(null)}
                          className={`py-3 rounded-xl font-bold text-xs hover:bg-[#162809] cursor-pointer ${
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
                /* MAIN ORDERS LIST WITH FILTER TABS (MATCHING SCREENSHOT 2) */
                <div className="space-y-6">
                  {/* Status Filter Tabs */}
                  <div className="bg-white p-3 rounded-2xl border border-[#c4c8bc]/30 shadow-sm flex gap-2 overflow-x-auto no-scrollbar">
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
                            : 'text-[#44483f] hover:bg-[#f9f3ec]'
                        }`}
                      >
                        {tabName}
                      </button>
                    ))}
                  </div>

                  {/* Order List Cards */}
                  {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-[#c4c8bc]/30">
                      <span className="material-symbols-outlined text-5xl text-[#75786e] mb-2">
                        receipt_long
                      </span>
                      <h3 className="font-['Playfair_Display'] font-bold text-lg text-[#162809]">
                        Belum ada pesanan pada kategori ini
                      </h3>
                      <p className="text-xs text-[#44483f] mt-1 mb-4">
                        Jelajahi berbagai produk sorgum terbaik SORGUM dan buat pesanan pertama Anda.
                      </p>
                      <button
                        onClick={onNavigateProducts}
                        className="bg-[#2b3e1d] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-[#162809]"
                      >
                        Lihat Katalog Produk
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-[#f9f3ec] rounded-2xl p-6 border border-[#c4c8bc]/30 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#c4c8bc]/30 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-['Playfair_Display'] font-bold text-lg text-[#162809]">
                                {ord.id}
                              </span>
                              {ord.items[0]?.product.badge && (
                                <span className="bg-[#162809] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                                  {ord.items[0].product.badge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-['Playfair_Display'] font-bold text-base text-[#162809]">
                                Rp {ord.totalAmount.toLocaleString('id-ID')}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
                                  ord.status === 'Selesai'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : ord.status === 'Dikirim'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : ord.status === 'Diproses'
                                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                                    : ord.status === 'Dibatalkan'
                                    ? 'bg-red-100 text-red-800 border-red-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
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

                          <p className="text-xs text-[#44483f]">Pesanan pada {ord.createdAt}</p>

                          {/* List of checked out items */}
                          <div className="space-y-3 py-2 border-y border-[#c4c8bc]/20">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <img
                                    src={it.product.image}
                                    alt={it.product.name}
                                    className="w-14 h-14 object-cover rounded-xl bg-white border border-[#c4c8bc]/30 shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm text-[#162809] truncate">
                                      {it.product.name}
                                    </p>
                                    <p className="text-xs text-[#44483f]">
                                      {it.product.unitInfo || it.product.weight} • <strong className="text-[#162809] font-bold">{it.quantity}x</strong>
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-bold text-xs text-[#162809]">
                                    Rp {(it.product.price * it.quantity).toLocaleString('id-ID')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => setSelectedOrderDetail(ord)}
                              className="bg-white border-2 border-[#162809] text-[#162809] hover:bg-[#162809] hover:text-white px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer"
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

          {/* TAB 3: PRODUK FAVORIT (MATCHING SCREENSHOT 6) */}
          {activeTab === 'favorit' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#c4c8bc]/30 shadow-sm">
                <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#162809] mb-1">
                  Produk Favorit Anda
                </h2>
                <p className="text-xs sm:text-sm text-[#44483f] mb-6">
                  Koleksi kurasi sorghum pilihan Anda, siap untuk menyempurnakan hidangan sehat keluarga.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                  {favoriteProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-[#f9f3ec] rounded-2xl p-4 border border-[#c4c8bc]/30 relative flex flex-col justify-between group hover:shadow-md transition-shadow"
                    >
                      {/* Heart Button — sync dengan context (ProductCard/Detail) */}
                      <button
                        onClick={async () => {
                          const ok = await toggleWishlist(prod.id);
                          if (ok) {
                            setFavoriteProducts(favoriteProducts.filter((p) => p.id !== prod.id));
                            showToast(`${prod.name} dihapus dari favorit.`);
                          } else {
                            showToast('Gagal menghapus favorit.');
                          }
                        }}
                        className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white/90 text-red-600 flex items-center justify-center shadow-sm hover:scale-110 transition-transform cursor-pointer"
                      >
                        ♥
                      </button>

                      <div>
                        {/* Image */}
                        <div className="relative rounded-xl overflow-hidden mb-3 bg-white h-48 flex items-center justify-center border border-[#c4c8bc]/20">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {prod.badge && (
                            <span className="absolute top-2 left-2 bg-[#2b3e1d] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider">
                              {prod.badge}
                            </span>
                          )}
                        </div>

                        {/* Title & info */}
                        <span className="text-[10px] font-bold uppercase text-[#75786e] tracking-wider block">
                          {prod.categoryLabel}
                        </span>
                        <h3 className="font-['Playfair_Display'] font-bold text-base text-[#162809] mb-1">
                          {prod.name}
                        </h3>
                        <p className="text-xs text-[#44483f] line-clamp-2 mb-3">
                          {prod.description}
                        </p>
                      </div>

                      {/* Price & Action */}
                      <div className="pt-3 border-t border-[#c4c8bc]/30 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#75786e] block">{prod.unitInfo}</span>
                          <span className="font-bold text-sm text-[#162809]">
                            {prod.formattedPrice}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => onAddToCart(prod)}
                            className="bg-[#2b3e1d] hover:bg-[#162809] text-white p-2 rounded-xl transition-all cursor-pointer"
                            title="Tambah ke keranjang"
                          >
                            <span className="material-symbols-outlined text-lg">shopping_cart</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PENGATURAN AKUN (MATCHING SCREENSHOT 5) */}
          {activeTab === 'pengaturan' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Ubah Kata Sandi */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#c4c8bc]/30 shadow-sm max-w-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#c4c8bc]/30">
                  <span className="material-symbols-outlined text-2xl text-[#162809]">lock</span>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#162809]">
                    Ubah Kata Sandi
                  </h3>
                </div>

                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[#44483f] mb-1.5">
                      Kata Sandi Saat Ini
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full bg-[#f9f3ec] border border-[#c4c8bc]/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b3e1d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#44483f] mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                      }
                      placeholder="Min. 8 karakter"
                      className="w-full bg-[#f9f3ec] border border-[#c4c8bc]/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b3e1d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[#44483f] mb-1.5">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      placeholder="Ulangi kata sandi baru"
                      className="w-full bg-[#f9f3ec] border border-[#c4c8bc]/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2b3e1d]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-[#2b3e1d] hover:bg-[#162809] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Perbarui Kata Sandi
                    </button>
                  </div>
                </form>
              </div>

              {/* Privasi & Data */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#c4c8bc]/30 shadow-sm max-w-xl space-y-4">
                <div className="flex items-center gap-3 mb-2 pb-4 border-b border-[#c4c8bc]/30">
                  <span className="material-symbols-outlined text-2xl text-[#162809]">
                    visibility
                  </span>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#162809]">
                    Privasi & Data
                  </h3>
                </div>

                <div className="bg-red-50 rounded-2xl p-5 border border-red-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-red-800">Hapus Akun Permanen</span>
                  <button
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin menghapus akun secara permanen?')) {
                        onLogout();
                        showToast('Akun telah dihapus.');
                      }
                    }}
                    className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl transition-colors cursor-pointer"
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
