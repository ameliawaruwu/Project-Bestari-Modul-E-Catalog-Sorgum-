import React, { useState, useEffect } from 'react';
import { useApp, ShopSettings } from '../../context/AppContext';
import BadgeManagement from './BadgeManagement';
import CategoryManagement from './CategoryManagement';

interface OtherSettingsTabProps {
  showToast: (msg: string) => void;
  onBadgesChange?: (badges: { id: number; name: string; is_active: number | boolean }[]) => void;
  onCategoriesChange?: (categories: { id: number; name: string; slug: string }[]) => void;
}

const PRESET_LOGOS = [
  {
    label: 'Default Typography',
    url: '',
    description: 'Logo teks elegan Playfair Display (SORGUM)',
  },
  {
    label: 'Sorghum Gold Emblem',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
    description: 'Ikon biji sorgum keemasan',
  },
  {
    label: 'Green Eco Sorghum',
    url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=200&q=80',
    description: 'Daun organik hijau alami',
  },
];

const PRESET_QRIS = [
  {
    label: 'QRIS Standard Sorgum',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIKWh-z2qzILYDC9woreBeFgSVM7_5bAXQw5pYZ_WwXgCifGERVX51aW8YsqJjhz82BHNB45qL6bJnxNWBWwpAxsM67_7x2OTYNFuUS0K4XILgSk6ErmPXJ-UP3WMQhaf0M_b3gWRwVKHSZ6kbqzO0x1MUI3RpV0ldxSddeaWujNrHtPTNPk0WLMpMDYC-ht49m3cEFZM04MALEK2_xXvp7VSo9wE4R95RE8g09iTX-hLm7IdsDkg',
    nmid: 'ID1029384756382',
  },
  {
    label: 'QRIS GoPay & All E-Wallet',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    nmid: 'ID1099887766554',
  },
];

const DEFAULT_SETTINGS_FALLBACK: ShopSettings = {
  storeName: 'SORGUM',
  logoUrl: '',
  qrisImageUrl: '',
  qrisNmid: '',
  whatsappNumber: '',
  qrisStatus: 'AKTIF',
  faviconUrl: '',
  storeAddress: '',
  storeEmail: '',
};

export const OtherSettingsTab: React.FC<OtherSettingsTabProps> = ({ showToast, onBadgesChange, onCategoriesChange }) => {
  const { shopSettings, saveShopSettings } = useApp();
  const [settings, setSettings] = useState<ShopSettings>(shopSettings || DEFAULT_SETTINGS_FALLBACK);

  useEffect(() => {
    if (shopSettings) {
      setSettings(shopSettings);
    }
  }, [shopSettings]);

  // Handle local image file upload for Logo
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran berkas logo terlalu besar (maksimal 2MB)!');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setSettings((prev) => ({ ...prev, logoUrl: result }));
          showToast('Gambar logo berhasil diunggah!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle local image file upload for QRIS
  const handleQrisFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast('Ukuran berkas gambar QRIS terlalu besar (maksimal 3MB)!');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setSettings((prev) => ({ ...prev, qrisImageUrl: result }));
          showToast('Gambar barcode QRIS berhasil diunggah!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Settings
  const handleSave = () => {
    saveShopSettings(settings);
    showToast('Pengaturan logo & QRIS pembayaran berhasil disimpan!');
  };

  // Reset Settings
  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS_FALLBACK);
    saveShopSettings(DEFAULT_SETTINGS_FALLBACK);
    showToast('Pengaturan berhasil dikembalikan ke standar bawaan.');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#555555] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#1B5E20] font-bold">Kelola Lain</li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1B5E20]">
            Pengaturan Logo &amp; QRIS Pembayaran
          </h2>
          <p className="text-xs text-[#555555] mt-1">
            Atur tampilan logo brand toko dan gambar barcode QRIS yang digunakan pada halaman pembayaran konsumen.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>Simpan Pengaturan Toko</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Sections vs Live Previews */}
      <div className="space-y-6">
        {/* Left 2 Columns: Settings Form Controls */}
        <div className="space-y-6">
          {/* Card 1: Pengaturan Logo Toko / Brand */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-[#1B5E20]">local_mall</span>
                <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1B5E20]">
                  Logo Toko / Brand
                </h3>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#E8F5E9] text-[#1B5E20] rounded-md">
                Tampilan Header
              </span>
            </div>

            {/* Foto Logo */}
            <label className="group block border-2 border-dashed border-[#E0E0E0] hover:border-[#2E7D32] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#F7F8F6]">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoFileUpload}
                className="hidden"
              />
              <div className="space-y-2">
                {settings.logoUrl ? (
                  <div className="relative w-28 h-28 mx-auto rounded-xl overflow-hidden border border-[#E0E0E0] shadow-2xs">
                    <img src={settings.logoUrl} alt="Preview Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold">Pilih Logo Baru</span>
                    </div>
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-5xl text-[#C89B3C] group-hover:text-[#1B5E20] transition-colors">
                    cloud_upload
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-[#1B5E20]">
                    Klik untuk memilih foto logo dari perangkat Anda
                  </p>
                  <p className="text-xs text-[#555555]">Format JPG/PNG/WebP, maksimal 2MB</p>
                </div>
              </div>
            </label>

            {settings.logoUrl && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSettings({ ...settings, logoUrl: '' });
                    showToast('Logo dihapus, sekarang menggunakan logo teks standar.');
                  }}
                  className="text-xs font-bold text-[#D32F2F] hover:underline cursor-pointer"
                >
                  Hapus Logo &amp; Gunakan Teks
                </button>
              </div>
            )}
          </div>

          {/* Card 2: Pengaturan Gambar QRIS Pembayaran */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-xl text-[#1B5E20]">qr_code_2</span>
                <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1B5E20]">
                  Gambar QRIS Halaman Pembayaran
                </h3>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#E8F5E9] text-[#1B5E20] rounded-md">
                Tampilan QRIS Checkout
              </span>
            </div>

            {/* Status Switcher & NMID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                  Status Layanan QRIS
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, qrisStatus: 'AKTIF' })}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      settings.qrisStatus === 'AKTIF'
                        ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                        : 'bg-[#F7F8F6] border-[#E0E0E0] text-[#555555]'
                    }`}
                  >
                    Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, qrisStatus: 'NONAKTIF' })}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      settings.qrisStatus === 'NONAKTIF'
                        ? 'bg-[#D32F2F] text-white border-[#D32F2F]'
                        : 'bg-[#F7F8F6] border-[#E0E0E0] text-[#555555]'
                    }`}
                  >
                    Non-Aktif
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                  Kode NMID Merchant QRIS
                </label>
                <input
                  type="text"
                  value={settings.qrisNmid}
                  onChange={(e) => setSettings({ ...settings, qrisNmid: e.target.value })}
                  placeholder="ID1029384756382"
                  className="w-full px-4 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl border border-[#E0E0E0] bg-[#F7F8F6] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] text-[#1B5E20]"
                />
              </div>
            </div>

            {/* Foto QRIS */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1B5E20]">Gambar Barcode QRIS</label>
              <label className="group block border-2 border-dashed border-[#E0E0E0] hover:border-[#2E7D32] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#F7F8F6]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrisFileUpload}
                  className="hidden"
                />
                <div className="space-y-2">
                  {settings.qrisImageUrl ? (
                    <div className="relative w-28 h-28 mx-auto rounded-xl overflow-hidden border border-[#E0E0E0] shadow-2xs">
                      <img src={settings.qrisImageUrl} alt="Preview QRIS" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-bold">Pilih Barcode Baru</span>
                      </div>
                    </div>
                  ) : (
                    <span className="material-symbols-outlined text-5xl text-[#C89B3C] group-hover:text-[#1B5E20] transition-colors">
                      cloud_upload
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#1B5E20]">
                      Klik untuk memilih file QRIS dari perangkat Anda
                    </p>
                    <p className="text-xs text-[#555555]">Format JPG/PNG, maksimal 3MB</p>
                  </div>
                </div>
              </label>
            </div>

            {settings.qrisImageUrl && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSettings({ ...settings, qrisImageUrl: '' });
                    showToast('Gambar QRIS berhasil dihapus.');
                  }}
                  className="text-xs font-bold text-[#D32F2F] hover:underline cursor-pointer"
                >
                  Hapus Gambar QRIS
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Informasi Kontak Toko */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#E0E0E0] pb-3">
              <span className="material-symbols-outlined text-xl text-[#1B5E20]">storefront</span>
              <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1B5E20]">
                Informasi Toko &amp; Kontak WhatsApp
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                  Nama Brand Toko
                </label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  placeholder="SORGUM Sorghum"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-[#E0E0E0] bg-[#F7F8F6] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] text-[#1B5E20]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B5E20] mb-1.5">
                  Nomor WhatsApp Konfirmasi Pembayaran
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  placeholder="+62 812-3456-7890"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl border border-[#E0E0E0] bg-[#F7F8F6] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] text-[#1B5E20]"
                />
                <p className="text-[10px] text-[#555555] mt-1">
                  Digunakan untuk menerima pesan konfirmasi bukti transfer QRIS dari pelanggan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Kelola Badge & Kelola Kategori */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BadgeManagement showToast={showToast} onBadgesChange={onBadgesChange} />
          <CategoryManagement showToast={showToast} onCategoriesChange={onCategoriesChange} />
        </div>
      </div>
    </div>
  );
};
