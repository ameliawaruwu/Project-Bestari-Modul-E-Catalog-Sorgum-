import React, { useState, useEffect } from 'react';
import { useApp, ShopSettings } from '../../context/AppContext';
import BadgeManagement from './BadgeManagement';

interface OtherSettingsTabProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onBadgesChange?: (badges: { id: number; name: string; is_active: number | boolean }[]) => void;
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

const DEFAULT_SETTINGS_FALLBACK: ShopSettings = {
  storeName: 'SORGUM',
  logoUrl: '',
  whatsappNumber: '',
  faviconUrl: '',
  storeAddress: '',
  storeEmail: '',
};

export const OtherSettingsTab: React.FC<OtherSettingsTabProps> = ({ showToast, onBadgesChange }) => {
  const { shopSettings, saveShopSettings } = useApp();
  const [settings, setSettings] = useState<ShopSettings>(shopSettings || DEFAULT_SETTINGS_FALLBACK);

  useEffect(() => {
    if (shopSettings) {
      setSettings(shopSettings);
    }
  }, [shopSettings]);

  // Handle local image file upload for Logo — upload ke server via API,
  // dapat URL /uploads/xxx (bukan base64). URL baru tiap upload → browser
  // tidak cache gambar lama (root cause QRIS tidak berubah, fix 2026-08-07).
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran berkas logo terlalu besar (maksimal 2MB)!');
      return;
    }
    try {
      const { productAdminApi } = await import('../../api/adminApi');
      const { compressImage } = await import('../../utils/imageCompress');
      const toUpload = await compressImage(file, 512);
      const url = await productAdminApi.uploadImage(toUpload);
      if (!url) throw new Error('upload gagal');
      setSettings((prev) => ({ ...prev, logoUrl: url }));
      showToast('Gambar logo berhasil diunggah!');
    } catch (e: any) {
      showToast(e?.message || 'Gagal mengunggah gambar logo.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Save Settings
  const handleSave = async () => {
    const ok = await saveShopSettings(settings);
    if (ok) {
      showToast('Pengaturan toko berhasil disimpan!');
    } else {
      showToast('Gagal menyimpan pengaturan. Periksa koneksi / ukuran gambar lalu coba lagi.');
    }
  };

  // Reset Settings
  const handleReset = async () => {
    setSettings(DEFAULT_SETTINGS_FALLBACK);
    const ok = await saveShopSettings(DEFAULT_SETTINGS_FALLBACK);
    if (ok) {
      showToast('Pengaturan berhasil dikembalikan ke standar bawaan.');
    } else {
      showToast('Gagal menyimpan pengaturan.');
    }
  };

  // Hapus Logo — langsung simpan ke BE (bukan cuma state lokal),
  // supaya benar-benar hilang walau halaman di-reload.
  const handleRemoveImage = async (key: 'logoUrl', okMsg: string, failMsg: string) => {
    try {
      const next = { ...settings, [key]: '' };
      setSettings(next);
      const ok = await saveShopSettings(next);
      if (ok) {
        showToast(okMsg);
      } else {
        showToast(failMsg);
      }
    } catch (e: any) {
      showToast(e?.message || failMsg, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#556353] dark:text-white/60 mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">chevron_right</span>
              </li>
              <li className="text-[#1F5132] dark:text-[#86EFAC] font-bold">Kelola Lain</li>
            </ol>
          </nav>
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-extrabold text-[#14331C] dark:text-[#F4F8F3] tracking-tight">
            Pengaturan Toko &amp; Badge
          </h2>
          <p className="text-xs text-[#556353] dark:text-white/60 mt-1">
            Atur tampilan identitas toko, nomor WhatsApp, serta kelola badge highlight produk.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            className="bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-base">save</span>
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>

      {/* 2-Column Grid: Left (Logo & Info Toko) | Right (Kelola Badge) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* CARD 1 (LEFT): LOGO & INFORMASI TOKO */}
        <div className="bg-white dark:bg-[#0E1A11] p-5 sm:p-6 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E2EFE0] dark:border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-xl text-[#1F5132] dark:text-[#86EFAC]">storefront</span>
              <h3 className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-extrabold text-[#14331C] dark:text-[#F4F8F3]">
                Informasi &amp; Logo Toko
              </h3>
            </div>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] rounded-md border border-[#3A8F4B]/20">
              Identitas Toko
            </span>
          </div>

          {/* Upload / Tampilan Logo */}
          <div>
            <label className="block text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] mb-1.5">
              Logo Toko / Brand
            </label>
            <label className="group block border-2 border-dashed border-[#E2EFE0] dark:border-white/15 hover:border-[#3A8F4B] dark:hover:border-[#65B86B] rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#F9FBF7] dark:bg-[#162419]">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoFileUpload}
                className="hidden"
              />
              <div className="space-y-1.5">
                {settings.logoUrl ? (
                  <div className="relative w-24 h-24 mx-auto rounded-lg overflow-hidden border border-[#E2EFE0] shadow-2xs">
                    <img src={settings.logoUrl} alt="Preview Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold">Ganti Logo</span>
                    </div>
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-4xl text-[#3A8F4B] dark:text-[#65B86B] group-hover:scale-110 transition-transform">
                    cloud_upload
                  </span>
                )}
                <div>
                  <p className="text-xs font-bold text-[#1F5132] dark:text-[#86EFAC]">
                    {settings.logoUrl ? 'Klik untuk mengganti logo' : 'Klik untuk memilih logo dari perangkat'}
                  </p>
                  <p className="text-[10px] text-[#556353] dark:text-white/60">Format JPG/PNG/WebP, maks. 2MB</p>
                </div>
              </div>
            </label>

            {settings.logoUrl && (
              <div className="text-center mt-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveImage('logoUrl', 'Logo dihapus, sekarang menggunakan logo teks standar.', 'Gagal menyimpan penghapusan logo. Coba lagi.');
                  }}
                  className="text-xs font-bold text-[#D32F2F] hover:underline cursor-pointer"
                >
                  Hapus Logo &amp; Gunakan Teks
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-[#E2EFE0] dark:border-white/10 pt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] mb-1.5">
                Nama Brand Toko
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                placeholder="BESTARI Sorghum"
                className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] focus:bg-white dark:focus:bg-[#1B2C1F] focus:outline-none focus:border-[#3A8F4B] focus:ring-1 focus:ring-[#3A8F4B] text-[#1F5132] dark:text-[#F4F8F3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] mb-1.5">
                Nomor WhatsApp Toko
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="6281234567890"
                className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[#E2EFE0] dark:border-white/10 bg-[#F9FBF7] dark:bg-[#162419] focus:bg-white dark:focus:bg-[#1B2C1F] focus:outline-none focus:border-[#3A8F4B] focus:ring-1 focus:ring-[#3A8F4B] text-[#1F5132] dark:text-[#F4F8F3]"
              />
              <p className="text-[10px] text-[#556353] dark:text-white/60 mt-1">
                Digunakan untuk tombol Pesan via WhatsApp di detail produk.
              </p>
            </div>
          </div>
        </div>

        {/* CARD 2 (RIGHT): KELOLA BADGE */}
        <div>
          <BadgeManagement showToast={showToast} onBadgesChange={onBadgesChange} />
        </div>

      </div>
    </div>
  );
};
