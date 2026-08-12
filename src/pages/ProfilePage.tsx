import React, { useState, useEffect } from 'react';
import { User, Order, Product } from '../types';
import { useApp } from '../context/AppContext';
import { PhoneInput } from '../components/PhoneInput';
import { ProfileOrdersSection } from '../components/profile/ProfileOrdersSection';
import { ProfileFavoritesSection } from '../components/profile/ProfileFavoritesSection';
import { ProfileSettingsSection } from '../components/profile/ProfileSettingsSection';

interface ProfilePageProps {
  user: User | null;
  initialTab?: 'profil' | 'pesanan' | 'favorit' | 'pengaturan';
  onLogout: () => void;
  onNavigateProducts: () => void;
  onAddToCart: (product: Product) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onNavigateAdmin?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  initialTab = 'profil',
  onLogout,
  onNavigateProducts,
  onAddToCart,
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
            <ProfileOrdersSection
              orders={orders}
              currentUser={currentUser}
              onNavigateProducts={onNavigateProducts}
              onCancelOrder={handleCancelOrder}
              showToast={showToast}
            />
          )}

          {/* TAB 3: PRODUK FAVORIT */}
                    {activeTab === 'favorit' && (
            <ProfileFavoritesSection
              currentUser={currentUser}
              allProducts={allProducts}
              ctxWishlistIds={ctxWishlistIds}
              onAddToCart={onAddToCart}
              onToggleWishlist={toggleWishlist}
              showToast={showToast}
            />
          )}

          {/* TAB 4: PENGATURAN AKUN */}
                    {activeTab === 'pengaturan' && (
            <ProfileSettingsSection onLogout={onLogout} showToast={showToast} />
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
