import React, { useState, useEffect } from 'react';
import { User, Order, Product } from '../types';
import { useApp } from '../context/AppContext';
import { wishlistApi } from '../api/wishlistApi';
import { PhoneInput } from '../components/PhoneInput';
import { discountBadgeLabel } from '../utils/discountBadge';
import { formatDate } from '../utils/formatDate';

interface ProfilePageProps {
  user: User | null;
  initialTab?: 'profil' | 'pesanan' | 'favorit' | 'pengaturan';
  onLogout: () => void;
  onNavigateProducts: () => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
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
      showToast(e?.message || 'Gagal membatalkan pesanan.', 'error');
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
    phone: user?.phone || '',
    gender: '',
    birthDate: '',
  });

  // Shipping Address state — dari BE /api/user/ (bukan mock)
  const [addresses, setAddresses] = useState<Array<{
    id: string; label: string; recipientName: string; phone: string;
    addressLine: string; city: string; district?: string; province: string; postalCode: string; isPrimary: boolean;
  }>>([]);
  const [addressData, setAddressData] = useState({
    label: '',
    recipient: '',
    phone: '',
    address: '',
    district: '',
    city: '',
    province: '',
    postalCode: '',
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);

  // Load addresses dari BE saat mount (kalau login)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { addressApi } = await import('../api/addressApi');
        const list = await addressApi.getAddresses();
        if (cancelled) return;
        setAddresses(list);
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
      setProfileData((p) => ({
        ...p,
        fullName: res.user!.name || p.fullName,
        email: res.user!.email || p.email,
        phone: res.user!.phone || p.phone,
      }));
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSaving(true);
    try {
      const { addressApi } = await import('../api/addressApi');
      const { createAddress, updateAddress } = addressApi;
      const input = {
        label: addressData.label,
        recipient_name: addressData.recipient,
        phone: addressData.phone,
        address_line: addressData.address,
        city: addressData.city,
        district: addressData.district,
        province: addressData.province,
        postal_code: addressData.postalCode,
        is_primary: true, // alamat yang disimpan selalu jadi alamat utama
      };
      // Mode edit (salah satu alamat sedang dipilih/diubah) → UPDATE, bukan create baru.
      const editingId = editingAddressId;
      if (editingId) {
        await updateAddress(editingId, input);
      } else {
        await createAddress(input);
      }
      // Reload list alamat dari BE — biar count/is_primary akurat, dan error limit
      // dari BE (maks 3) tampil via showToast merah.
      const list = await addressApi.getAddresses();
      setAddresses(list);
      const primary = list.find((a) => a.isPrimary) || list[0];
      setAddressData({
        label: primary?.label || '',
        recipient: primary?.recipientName || '',
        phone: primary?.phone || '',
        address: primary?.addressLine || '',
        district: primary?.district || '',
        city: primary?.city || '',
        province: primary?.province || '',
        postalCode: primary?.postalCode || '',
      });
      setEditingAddressId(null);
      setIsEditingAddress(false);
      showToast('Alamat pengiriman berhasil disimpan!');
    } catch (e: any) {
      showToast(e?.message || 'Gagal menyimpan alamat.', 'error');
    } finally {
      setAddressSaving(false);
    }
  };

  // Hapus alamat — konfirmasi dulu, panggil BE DELETE, lalu reload list.
  const handleDeleteAddress = async (id: string, label: string) => {
    if (!window.confirm(`Hapus alamat "${label}"?`)) return;
    try {
      const { addressApi } = await import('../api/addressApi');
      await addressApi.deleteAddress(id);
      const list = await addressApi.getAddresses();
      setAddresses(list);
      // Kalau alamat yang dihapus sedang diedit, tutup form & kosongkan
      if (editingAddressId === id) {
        setEditingAddressId(null);
        setIsEditingAddress(false);
      }
      showToast('Alamat berhasil dihapus.');
    } catch (e: any) {
      showToast(e?.message || 'Gagal menghapus alamat.', 'error');
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
    <div className="pt-24 pb-20 px-4 md:px-10 max-w-7xl mx-auto font-['Plus_Jakarta_Sans'] text-[#1B5E20] animate-fadeIn min-h-screen">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-72 bg-[#FFFFFF] rounded-2xl p-6 border border-[#E0E0E0] shadow-2xs h-fit shrink-0">
          {/* User Profile Header */}
          <div className="flex items-center gap-4 pb-6 mb-6 border-b border-[#E0E0E0]">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[#2E7D32] text-white flex items-center justify-center font-bold text-xl shadow-2xs shrink-0">
              {profileData.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-['Playfair_Display'] font-bold text-lg text-[#1B5E20] truncate">
                {profileData.fullName}
              </h2>
              <p className="text-xs text-[#555555] truncate">{profileData.email}</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1.5">
            {currentUser?.role === 'admin' && onNavigateAdmin && (
              <button
                onClick={onNavigateAdmin}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[#1B5E20] hover:bg-[#E8F5E9] transition-all text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl text-[#1B5E20]">admin_panel_settings</span>
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
                  ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-2xs font-bold'
                  : 'text-[#1B5E20] hover:bg-[#E8F5E9]'
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
                  ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-2xs font-bold'
                  : 'text-[#1B5E20] hover:bg-[#E8F5E9]'
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
                  ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-2xs font-bold'
                  : 'text-[#1B5E20] hover:bg-[#E8F5E9]'
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
                  ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-2xs font-bold'
                  : 'text-[#1B5E20] hover:bg-[#E8F5E9]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">settings</span>
              <span>Pengaturan Akun</span>
            </button>

            <div className="pt-4 mt-4 border-t border-[#E0E0E0]">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-[#D32F2F] hover:bg-[#FFEBEE] transition-all text-left cursor-pointer"
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
              <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#E0E0E0] shadow-2xs">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E0E0E0]">
                  <span className="material-symbols-outlined text-2xl text-[#1B5E20]">
                    badge
                  </span>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1B5E20]">
                    Informasi Pribadi
                  </h3>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                        NAMA LENGKAP
                      </label>
                      <input
                        type="text"
                        value={profileData.fullName}
                        onChange={(e) =>
                          setProfileData({ ...profileData, fullName: e.target.value })
                        }
                        className="w-full bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm text-[#1B5E20] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                        EMAIL
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({ ...profileData, email: e.target.value })
                        }
                        className="w-full bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm text-[#1B5E20] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                        NOMOR TELEPON
                      </label>
                      <PhoneInput
                        value={profileData.phone.replace(/^\+?62/, '').replace(/^0/, '')}
                        onChange={(digits) => setProfileData({ ...profileData, phone: digits })}
                        className="px-4 py-3"
                        placeholder="812-3456-7890"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                        JENIS KELAMIN
                      </label>
                      <select
                        value={profileData.gender}
                        onChange={(e) =>
                          setProfileData({ ...profileData, gender: e.target.value })
                        }
                        className="w-full bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm text-[#1B5E20] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-bold"
                      >
                        <option value="Perempuan">Perempuan</option>
                        <option value="Laki-laki">Laki-laki</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#555555] mb-1.5">
                        TANGGAL LAHIR
                      </label>
                      <input
                        type="date"
                        value={profileData.birthDate}
                        onChange={(e) =>
                          setProfileData({ ...profileData, birthDate: e.target.value })
                        }
                        className="w-full bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm text-[#1B5E20] focus:outline-none focus:ring-2 focus:ring-[#2E7D32] font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-2xs active:scale-95 cursor-pointer"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>

              {/* Alamat Pengiriman */}
              <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#E0E0E0] shadow-2xs">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E0E0E0]">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-[#1B5E20]">
                      location_on
                    </span>
                    <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1B5E20]">
                      Alamat Pengiriman
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      // Klik "Tambah Alamat Baru" → buka form KOSONG (bukan data alamat lama)
                      if (!isEditingAddress) {
                        setEditingAddressId(null);
                        setAddressData({
                          label: '',
                          recipient: '',
                          phone: '',
                          address: '',
                          district: '',
                          city: '',
                          province: '',
                          postalCode: '',
                        });
                      }
                      setIsEditingAddress(!isEditingAddress);
                    }}
                    disabled={!isEditingAddress && addresses.length >= 3}
                    className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      !isEditingAddress && addresses.length >= 3
                        ? 'text-[#999999] bg-[#F0F0F0] border-[#E0E0E0]'
                        : 'text-[#2E7D32] border-[#A5D6A7] bg-[#E8F5E9] hover:underline'
                    }`}
                  >
                    {isEditingAddress ? 'Batal Edit' : 'Tambah Alamat Baru'}
                  </button>
                </div>

                {isEditingAddress ? (
                  <form onSubmit={handleSaveAddress} className="space-y-4 bg-[#F7F8F6] p-5 rounded-2xl border border-[#E0E0E0]">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#555555] mb-1">
                        Label Alamat
                      </label>
                      <input
                        type="text"
                        value={addressData.label}
                        onChange={(e) => setAddressData({ ...addressData, label: e.target.value })}
                        className="w-full bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl px-4 py-2 text-sm text-[#1B5E20]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#555555] mb-1">
                          Nama Penerima
                        </label>
                        <input
                          type="text"
                          value={addressData.recipient}
                          onChange={(e) => setAddressData({ ...addressData, recipient: e.target.value })}
                          className="w-full bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl px-4 py-2 text-sm text-[#1B5E20]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#555555] mb-1">
                          Nomor HP
                        </label>
                        <PhoneInput
                          value={addressData.phone.replace(/^\+?62/, '').replace(/^0/, '')}
                          onChange={(digits) => setAddressData({ ...addressData, phone: digits })}
                          className="px-4 py-2"
                          placeholder="812-3456-7890"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#555555] mb-1">
                        Alamat Lengkap
                      </label>
                      <textarea
                        rows={3}
                        value={addressData.address}
                        onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                        className="w-full bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl px-4 py-2 text-sm text-[#1B5E20]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#555555] mb-1">
                          Provinsi
                        </label>
                        <input
                          type="text"
                          value={addressData.province}
                          onChange={(e) => setAddressData({ ...addressData, province: e.target.value })}
                          className="w-full bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl px-4 py-2 text-sm text-[#1B5E20]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#555555] mb-1">
                          Kota/Kabupaten
                        </label>
                        <input
                          type="text"
                          value={addressData.city}
                          onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                          className="w-full bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl px-4 py-2 text-sm text-[#1B5E20]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#555555] mb-1">
                          Kecamatan
                        </label>
                        <input
                          type="text"
                          value={addressData.district}
                          onChange={(e) => setAddressData({ ...addressData, district: e.target.value })}
                          className="w-full bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl px-4 py-2 text-sm text-[#1B5E20]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-[#555555] mb-1">
                          Kode Pos
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={addressData.postalCode}
                          onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value.replace(/[^\d]/g, '') })}
                          className="w-full bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl px-4 py-2 text-sm text-[#1B5E20]"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={addressSaving}
                      className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#1B5E20] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {addressSaving ? 'Menyimpan...' : 'Simpan Alamat'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {addresses.length === 0 ? (
                      <div className="bg-[#F7F8F6] rounded-2xl p-6 border border-[#E0E0E0] text-center">
                        <p className="text-sm text-[#555555]">
                          Belum ada alamat pengiriman. Tambahkan alamat pertamamu!
                        </p>
                      </div>
                    ) : (
                      <>
                        {addresses.map((addr) => (
                        <div key={addr.id} className="bg-[#F7F8F6] rounded-2xl p-6 border border-[#E0E0E0] relative">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm text-[#1B5E20]">{addr.label}</h4>
                            {addr.isPrimary && (
                              <span className="bg-[#2E7D32] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md tracking-wider">
                                UTAMA
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-sm text-[#1B5E20] mb-1">
                            {addr.recipientName} ({addr.phone})
                          </p>
                          <p className="text-xs text-[#555555] leading-relaxed mb-4">
                            {addr.addressLine}, {addr.district ? `${addr.district}, ` : ''}{addr.city}, {addr.province} {addr.postalCode}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => {
                                setEditingAddressId(addr.id);
                                setAddressData({
                                  label: addr.label,
                                  recipient: addr.recipientName,
                                  phone: addr.phone,
                                  address: addr.addressLine,
                                  district: addr.district || '',
                                  city: addr.city,
                                  province: addr.province,
                                  postalCode: addr.postalCode,
                                });
                                setIsEditingAddress(true);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#1B5E20] hover:underline cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                              <span>Ubah Alamat</span>
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id, addr.label)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#C62828] hover:underline cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                        ))}
                        {addresses.length >= 3 && (
                          <p className="text-xs text-[#999999] text-center pt-2">
                            Kamu sudah punya maksimal 3 alamat. Hapus salah satu untuk menambah alamat baru.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PESANAN SAYA */}
          {activeTab === 'pesanan' && (
            <div className="animate-fadeIn">
              {selectedOrderDetail ? (
                /* ORDER DETAIL VIEW */
                <div className="space-y-6">
                  {/* Breadcrumb */}
                  <nav className="flex items-center gap-2 text-xs text-[#555555] mb-2">
                    <button
                      onClick={() => setSelectedOrderDetail(null)}
                      className="hover:text-[#1B5E20] font-medium cursor-pointer"
                    >
                      Riwayat Pesanan
                    </button>
                    <span>/</span>
                    <span className="font-bold text-[#1B5E20]">
                      Detail Pesanan {selectedOrderDetail.orderNumber ? `#${selectedOrderDetail.orderNumber}` : ''}
                    </span>
                  </nav>

                  {/* Header Title */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs gap-4">
                    <div>
                      <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1B5E20]">
                        {selectedOrderDetail.orderNumber ? `Pesanan #${selectedOrderDetail.orderNumber}` : 'Detail Pesanan'}
                      </h2>
                      <p className="text-xs text-[#555555] mt-1">
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
                      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs">
                        <h3 className="font-['Playfair_Display'] font-bold text-base text-[#1B5E20] mb-6">
                          Status Pengiriman
                        </h3>

                        {selectedOrderDetail.status === 'Dibatalkan' ? (
                          <div className="p-4 bg-[#FFEBEE] border border-red-200 rounded-xl text-center">
                            <span className="material-symbols-outlined text-3xl text-[#D32F2F] mb-1">cancel</span>
                            <p className="font-bold text-sm text-[#D32F2F]">Pesanan Dibatalkan</p>
                            <p className="text-xs text-[#D32F2F] mt-0.5">Pesanan ini telah dibatalkan. Silakan hubungi admin jika terdapat kendala.</p>
                          </div>
                        ) : (
                          <div className="relative py-2">
                            {/* Connecting Progress Line */}
                            <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-[#E0E0E0] z-0">
                              <div
                                className="h-full bg-[#1B5E20] transition-all duration-500"
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
                                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-2xs transition-all ${
                                        isDone
                                          ? 'bg-[#1B5E20] text-white'
                                          : isActive
                                          ? 'bg-[#2E7D32] text-white ring-4 ring-[#E8F5E9]'
                                          : 'bg-[#E0E0E0] text-[#555555]'
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
                                        isDone || isActive ? 'font-bold text-[#1B5E20]' : 'text-[#555555]'
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
                      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-['Playfair_Display'] font-bold text-base text-[#1B5E20]">
                            Lacak Pengiriman
                          </h3>
                          {trackingData?.tracking?.resi_status && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#1B5E20] text-white">
                              {trackingData.tracking.resi_status}
                            </span>
                          )}
                        </div>

                        {/* Info kurir + resi */}
                        {selectedOrderDetail.courier || selectedOrderDetail.trackingNumber ? (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#E8F5E9] rounded-xl px-4 py-2.5 border border-[#A5D6A7] text-xs">
                            <span className="flex items-center gap-1.5 font-bold text-[#1B5E20]">
                              <span className="material-symbols-outlined text-sm">local_shipping</span>
                              {selectedOrderDetail.courier || 'Kurir'}
                            </span>
                            {selectedOrderDetail.trackingNumber && (
                              <span className="font-mono font-bold text-[#1B5E20]">
                                Resi: {selectedOrderDetail.trackingNumber}
                              </span>
                            )}
                            <a
                              href={`https://cekresi.com/cek-resi/?courier=${selectedOrderDetail.courier}&awb=${selectedOrderDetail.trackingNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#2E7D32] font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                              Lacak
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-[#555555]">
                            Resi belum diinput oleh admin. Pesanan ini belum dikirim.
                          </p>
                        )}

                        {/* Info pengirim/tujuan/update */}
                        {trackingData?.tracking && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#F7F8F6] rounded-xl px-4 py-3 border border-[#E0E0E0]">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#555555] font-bold">Pengirim</p>
                              <p className="font-semibold text-[#1B5E20] mt-0.5">{trackingData.tracking.pengirim || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-[#555555] font-bold">Tujuan</p>
                              <p className="font-semibold text-[#1B5E20] mt-0.5">{trackingData.tracking.tujuan || '-'}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <p className="text-[10px] uppercase tracking-wide text-[#555555] font-bold">Update Terakhir</p>
                              <p className="font-semibold text-[#1B5E20] mt-0.5">
                                {formatDate(trackingData.tracking.checked_at, 'datetime')}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Timeline riwayat perjalanan */}
                        <div className="pt-4 border-t border-[#E0E0E0] space-y-4">
                          <h4 className="font-bold text-xs text-[#555555] uppercase tracking-wider">
                            Riwayat Terbaru
                          </h4>
                          {trackingLoading ? (
                            <p className="text-xs text-[#555555]">Memuat riwayat pengiriman...</p>
                          ) : trackingData?.history?.length ? (
                            <div className="space-y-3 pl-2 border-l-2 border-[#2E7D32]">
                              {trackingData.history.map((ev, idx) => (
                                <div key={idx} className="pl-3 relative">
                                  <p className="text-xs font-bold text-[#1B5E20]">
                                    {ev.event_date && ev.event_date !== '-' ? ev.event_date : '—'}
                                  </p>
                                  <p className="text-xs text-[#555555]">{ev.description}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-[#555555]">
                              Belum ada riwayat perjalanan dari ekspedisi.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Order Summary & Shipping Info */}
                    <div className="space-y-6">
                      {/* Ringkasan Pesanan */}
                      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
                        <h3 className="font-['Playfair_Display'] font-bold text-base text-[#1B5E20] border-b border-[#E0E0E0] pb-3">
                          Ringkasan Pesanan
                        </h3>

                        <div className="space-y-3">
                          {selectedOrderDetail.items.map((it, idx) => (
                            <div key={idx} className="flex gap-3 items-center">
                              <img
                                src={it.product.image}
                                alt={it.product.name}
                                className="w-14 h-14 object-cover rounded-xl bg-[#F7F8F6] border border-[#E0E0E0]"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-[#1B5E20] truncate font-['Playfair_Display']">
                                  {it.product.name}
                                </h4>
                                <p className="text-[11px] text-[#555555]">
                                  {it.product.unitInfo || it.product.weight} x {it.quantity}
                                </p>
                                <p className="font-bold text-xs text-[#1B5E20]">
                                  Rp {(it.product.price * it.quantity).toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-[#E0E0E0] pt-3 space-y-1.5 text-xs text-[#555555]">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>
                              Rp{' '}
                              {selectedOrderDetail.items
                                .reduce((s, i) => s + i.product.price * i.quantity, 0)
                                .toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-sm text-[#1B5E20] pt-2 border-t border-[#E0E0E0]">
                            <span>Total Tagihan</span>
                            <span>Rp {selectedOrderDetail.totalAmount.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Informasi Pengiriman */}
                      <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-2">
                        <div className="flex items-center gap-1.5 text-[#1B5E20] font-bold text-sm">
                          <span className="material-symbols-outlined text-lg">location_on</span>
                          <span>Informasi Pengiriman</span>
                        </div>
                        <p className="text-xs font-bold text-[#1B5E20]">
                          {selectedOrderDetail.customerName || 'Aruna Sorgum'}
                        </p>
                        <p className="text-xs text-[#555555]">
                          {selectedOrderDetail.customerPhone || '+62 812-3456-7890'}
                        </p>
                        <p className="text-xs text-[#555555] leading-relaxed pt-1 whitespace-pre-line">
                          {selectedOrderDetail.shippingAddress ||
                            'Jl. Kebon Jeruk No. 12, Jakarta Barat, DKI Jakarta, 11530'}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        {selectedOrderDetail.status === 'Pending' && (
                            <button
                              onClick={() => handleCancelOrder(selectedOrderDetail.id)}
                              className="flex-1 bg-[#D32F2F] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#B71C1C] cursor-pointer"
                            >
                              Batalkan Pesanan
                            </button>
                          )}
                        <button
                          onClick={() => setSelectedOrderDetail(null)}
                          className={`py-3 rounded-xl font-bold text-xs hover:bg-[#1B5E20] cursor-pointer ${
                            selectedOrderDetail.status !== 'Dikirim' &&
                            selectedOrderDetail.status !== 'Selesai' &&
                            selectedOrderDetail.status !== 'Dibatalkan'
                              ? 'flex-1 bg-[#2E7D32] text-white'
                              : 'w-full bg-[#2E7D32] text-white'
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
                  <div className="bg-[#FFFFFF] p-3 rounded-2xl border border-[#E0E0E0] shadow-2xs flex gap-2 overflow-x-auto no-scrollbar">
                    {[
                      'Semua',
                      'Belum Bayar',
                      'Sedang Dikemas',
                      'Dikirim',
                      'Selesai',
                      'Dibatalkan',
                    ].map((tabName) => (
                      <button
                        key={tabName}
                        onClick={() => setOrderFilter(tabName)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          orderFilter === tabName
                            ? 'bg-[#2E7D32] text-white shadow-2xs'
                            : 'text-[#555555] hover:bg-[#E8F5E9]'
                        }`}
                      >
                        {tabName}
                      </button>
                    ))}
                  </div>

                  {/* Order List Cards */}
                  {filteredOrders.length === 0 ? (
                    <div className="bg-[#FFFFFF] rounded-2xl p-12 text-center border border-[#E0E0E0]">
                      <span className="material-symbols-outlined text-5xl text-[#C89B3C] mb-2">
                        receipt_long
                      </span>
                      <h3 className="font-['Playfair_Display'] font-bold text-lg text-[#1B5E20]">
                        Belum ada pesanan pada kategori ini
                      </h3>
                      <p className="text-xs text-[#555555] mt-1 mb-4">
                        Jelajahi berbagai produk sorgum terbaik SORGUM dan buat pesanan pertama Anda.
                      </p>
                      <button
                        onClick={onNavigateProducts}
                        className="bg-[#2E7D32] text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-[#1B5E20]"
                      >
                        Lihat Katalog Produk
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#E0E0E0] shadow-2xs space-y-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#E0E0E0] pb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-['Playfair_Display'] font-bold text-lg text-[#1B5E20]">
                                {ord.orderNumber ? `#${ord.orderNumber}` : 'Pesanan'}
                              </span>
                              {ord.items[0]?.product.badge && (
                                <span className="bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                                  {ord.items[0].product.badge}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-['Playfair_Display'] font-bold text-base text-[#1B5E20]">
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

                          <p className="text-xs text-[#555555]">Pesanan pada {ord.createdAt}</p>

                          {/* List of checked out items */}
                          <div className="space-y-3 py-2 border-y border-[#E0E0E0]">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <img
                                    src={it.product.image}
                                    alt={it.product.name}
                                    className="w-14 h-14 object-cover rounded-xl bg-[#F7F8F6] border border-[#E0E0E0] shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm text-[#1B5E20] truncate font-['Playfair_Display']">
                                      {it.product.name}
                                    </p>
                                    <p className="text-xs text-[#555555]">
                                      {it.product.unitInfo || it.product.weight} • <strong className="text-[#1B5E20] font-bold">{it.quantity}x</strong>
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-bold text-xs text-[#1B5E20]">
                                    Rp {(it.product.price * it.quantity).toLocaleString('id-ID')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => setSelectedOrderDetail(ord)}
                              className="bg-[#FFFFFF] border-2 border-[#2E7D32] text-[#2E7D32] hover:bg-[#2E7D32] hover:text-white px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer"
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
              <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#E0E0E0] shadow-2xs">
                <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1B5E20] mb-1">
                  Produk Favorit Anda
                </h2>
                <p className="text-xs sm:text-sm text-[#555555] mb-6">
                  Koleksi kurasi sorghum pilihan Anda, siap untuk menyempurnakan hidangan sehat keluarga.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                  {favoriteProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E0E0E0] relative flex flex-col justify-between group hover:shadow-md transition-shadow"
                    >
                      {/* Heart Button */}
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
                        className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white/90 text-[#D32F2F] flex items-center justify-center shadow-2xs hover:scale-110 transition-transform cursor-pointer"
                      >
                        ♥
                      </button>

                      <div>
                        {/* Image */}
                        <div className="relative rounded-xl overflow-hidden mb-3 bg-[#F7F8F6] h-48 flex items-center justify-center border border-[#E0E0E0]">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {prod.badge && (
                            <span className="absolute top-2 left-2 bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] text-[10px] font-bold px-2 py-0.5 rounded tracking-wider">
                              {prod.badge}
                            </span>
                          )}
                          {discountBadgeLabel(prod) && (
                            <span className="absolute top-2 right-2 bg-[#D32F2F] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider">
                              {discountBadgeLabel(prod)}
                            </span>
                          )}
                        </div>

                        {/* Title & info */}
                        <span className="text-[10px] font-bold uppercase text-[#555555] tracking-wider block">
                          {prod.categoryLabel}
                        </span>
                        <h3 className="font-['Playfair_Display'] font-bold text-base text-[#1B5E20] mb-1">
                          {prod.name}
                        </h3>
                        <p className="text-xs text-[#555555] line-clamp-2 mb-3">
                          {prod.description}
                        </p>
                      </div>

                      {/* Price & Action */}
                      <div className="pt-3 border-t border-[#E0E0E0] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#555555] block">{prod.unitInfo}</span>
                          <span className="font-bold text-sm text-[#1B5E20]">
                            {prod.formattedPrice}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => onAddToCart(prod)}
                            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white p-2 rounded-xl transition-all cursor-pointer"
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

          {/* TAB 4: PENGATURAN AKUN */}
          {activeTab === 'pengaturan' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Privasi & Data */}
              <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#E0E0E0] shadow-2xs max-w-xl space-y-4">
                <div className="flex items-center gap-3 mb-2 pb-4 border-b border-[#E0E0E0]">
                  <span className="material-symbols-outlined text-2xl text-[#1B5E20]">
                    visibility
                  </span>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1B5E20]">
                    Privasi & Data
                  </h3>
                </div>

                <div className="bg-[#FFEBEE] rounded-2xl p-5 border border-[#D32F2F]/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#D32F2F]">Hapus Akun Permanen</span>
                  <button
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin menghapus akun secara permanen?')) {
                        onLogout();
                        showToast('Akun telah dihapus.');
                      }
                    }}
                    className="p-2 bg-[#D32F2F] text-white hover:bg-[#B71C1C] rounded-xl transition-colors cursor-pointer"
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

export default ProfilePage;
