import React, { useState, useEffect } from 'react';
import { BannerSlide } from '../../types/admin';

interface BannerFormViewProps {
  initialBanner?: BannerSlide | null;
  onSave: (bannerData: { title: string; titleEn?: string; targetLink: string; image: string; id?: string }) => void;
  onCancel: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const BannerFormView: React.FC<BannerFormViewProps> = ({
  initialBanner,
  onSave,
  onCancel,
  showToast,
}) => {
  const [titleInput, setTitleInput] = useState('');
  const [titleEnInput, setTitleEnInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialBanner) {
      setTitleInput(initialBanner.title);
      setTitleEnInput(initialBanner.titleEn || '');
      setTargetInput(initialBanner.targetLink);
      setImageInput(initialBanner.image);
    } else {
      setTitleInput('');
      setTitleEnInput('');
      setTargetInput('');
      setImageInput('');
    }
  }, [initialBanner]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) {
      showToast('Masukkan judul banner slide!');
      return;
    }

    onSave({
      id: initialBanner?.id,
      title: titleInput,
      titleEn: titleEnInput.trim() || undefined,
      targetLink: targetInput || 'Halaman Toko: Semua Produk',
      image:
        imageInput ||
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1920',
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header & Breadcrumb */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#555555] mb-1">
            <ol className="flex items-center space-x-2">
              <li>
                <button
                  type="button"
                  onClick={onCancel}
                  className="hover:text-[#1B5E20] transition-colors cursor-pointer"
                >
                  Pengaturan Landing Page
                </button>
              </li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#1B5E20] font-bold">
                {initialBanner ? 'Edit Banner Slide' : 'Tambah Banner Baru'}
              </li>
            </ol>
          </nav>
          <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl font-bold text-[#1B5E20]">
            {initialBanner ? 'Edit Banner Slide' : 'Halaman Tambah Banner Slide Baru'}
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="bg-[#FFFFFF] border border-[#E0E0E0] text-[#1B5E20] px-5 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-[#E8F5E9] transition-all cursor-pointer font-bold text-xs shadow-2xs"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span>KEMBALI KE DAFTAR</span>
        </button>
      </section>

      {/* Form Card */}
      <div className="bg-[#FFFFFF] rounded-2xl shadow-2xs border border-[#E0E0E0] overflow-hidden">
        <div className="p-6 bg-[#1B5E20] text-white flex justify-between items-center">
          <div>
            <h3 className="font-['Playfair_Display'] text-xl font-bold">
              {initialBanner ? 'Edit Banner' : 'Formulir Banner Beranda'}
            </h3>
            <p className="text-[#E8F5E9] text-xs mt-1">
              Atur judul promosi, tautan target, dan gambar utama untuk menarik pembeli di halaman depan.
            </p>
          </div>
          <span className="text-xs font-bold uppercase bg-[#E8F5E9] text-[#1B5E20] px-3 py-1 rounded-full">
            {initialBanner ? 'Mode Edit' : 'Halaman Baru'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Upload Field */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-[#1B5E20]">
              Upload / URL Gambar Banner
            </label>
            <div className="border-2 border-dashed border-[#E0E0E0] rounded-2xl p-8 text-center bg-[#F7F8F6] hover:border-[#2E7D32] transition-all group relative">
              <div className="space-y-3">
                {imageInput ? (
                  <div className="max-w-md mx-auto aspect-[16/6] rounded-xl overflow-hidden border border-[#E0E0E0] shadow-xs">
                    <img src={imageInput} alt="Preview Slide" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-5xl text-[#2E7D32] group-hover:text-[#1B5E20] transition-colors">
                    cloud_upload
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-[#1B5E20]">
                    Seret dan lepas gambar ke sini atau tempel URL publik
                  </p>
                  <p className="text-xs text-[#555555]">
                    Rasio disarankan: 1920x600 px (Landscape HD)
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <label className="inline-flex items-center gap-2 bg-[#2E7D32] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#1B5E20] transition-all cursor-pointer">
                    <span className="material-symbols-outlined text-base">upload_file</span>
                    {uploading ? 'Mengunggah...' : 'Pilih File Gambar'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          setUploading(true);
                          const { productAdminApi } = await import('../../api/adminApi');
                          const url = await productAdminApi.uploadImage(file);
                          if (!url) throw new Error('upload gagal');
                          setImageInput(url);
                          showToast('Gambar berhasil diunggah.');
                        } catch (e: any) {
                          showToast(e?.message || 'Gagal mengunggah gambar.', 'error');
                        } finally {
                          setUploading(false);
                          // Reset input supaya file yang sama bisa dipilih ulang
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  <span className="text-[11px] text-[#555555]">atau</span>
                  <input
                    type="text"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    placeholder="Masukkan URL Gambar Banner (https://...)"
                    className="w-full max-w-md mx-auto h-11 px-3.5 border border-[#E0E0E0] bg-[#FFFFFF] rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#2E7D32] text-[#1B5E20]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title Input */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Judul Promosi Banner (ID) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Contoh: Panen Raya Sorgum Merah Organik"
                required
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none font-medium"
              />
            </div>

            {/* Title EN Input — dipakai saat Switch Bahasa EN */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Judul Promosi Banner (EN)
              </label>
              <input
                type="text"
                value={titleEnInput}
                onChange={(e) => setTitleEnInput(e.target.value)}
                placeholder="Contoh: Organic Red Sorghum Harvest Festival"
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none font-medium"
              />
              <p className="text-[11px] text-[#555555]">
                Opsional — kosongkan agar memakai judul ID saat bahasa Inggris aktif.
              </p>
            </div>

            {/* Target Link Select */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#1B5E20]">
                Tautan / Destinasi Target Klik
              </label>
              <select
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-full bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl p-3.5 text-xs sm:text-sm text-[#1B5E20] focus:ring-1 focus:ring-[#2E7D32] outline-none cursor-pointer font-medium"
              >
                <option value="">Pilih target tautan banner</option>
                <option value="Detail Produk: Tepung Sorgum Putih">
                  Detail Produk: Tepung Sorgum Putih
                </option>
                <option value="Detail Produk: Beras Sorgum Merah">
                  Detail Produk: Beras Sorgum Merah
                </option>
                <option value="Informasi: Budidaya Lokal">
                  Informasi: Budidaya Lokal
                </option>
                <option value="Informasi: Resep Sorgum Sehat">
                  Informasi: Resep Sorgum Sehat
                </option>
                <option value="Halaman Toko: Semua Produk">
                  Halaman Toko: Semua Produk
                </option>
              </select>
            </div>
          </div>

          {/* Preview Section */}
          <div className="pt-6 border-t border-[#E0E0E0]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#1B5E20]">Preview Tampilan Live Beranda</h4>
              <span className="text-[10px] font-bold uppercase bg-[#E8F5E9] text-[#1B5E20] px-2.5 py-1 rounded">
                Pratinjau Pelanggan
              </span>
            </div>
            <div className="aspect-[16/5] bg-[#F7F8F6] rounded-2xl border border-[#E0E0E0] flex items-center justify-center relative overflow-hidden p-6 shadow-inner">
              {imageInput && (
                <img
                  src={imageInput}
                  alt="Pratinjau Banner"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent"></div>
              <div className="relative z-10 w-full text-white space-y-1 max-w-lg">
                <p className="text-[11px] uppercase tracking-widest text-[#C89B3C] font-bold">
                  SORGUM PREMIUM
                </p>
                <h3 className="font-['Playfair_Display'] text-lg sm:text-2xl font-bold leading-tight">
                  {titleInput || 'Judul Promosi Banner...'}
                </h3>
                <p className="text-xs opacity-90">
                  {targetInput || 'Target tautan...'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl border border-[#E0E0E0] text-[#555555] font-bold text-xs hover:bg-[#F7F8F6] transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-[#2E7D32] text-white px-8 py-3 rounded-xl font-bold text-xs hover:bg-[#1B5E20] shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              {initialBanner ? 'Simpan Perubahan Banner' : 'Simpan Banner Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
