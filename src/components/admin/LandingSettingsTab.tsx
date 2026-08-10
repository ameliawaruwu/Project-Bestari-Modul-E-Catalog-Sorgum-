import React, { useState, useEffect } from 'react';
import { BannerSlide } from '../../types/admin';
import { Product } from '../../types';
import { useApp, LandingContent } from '../../context/AppContext';

interface LandingSettingsTabProps {
  banners: BannerSlide[];
  products: Product[];
  onToggleBanner: (id: string) => void;
  onDeleteBanner: (id: string) => void;
  onOpenCreateBanner: () => void;
  onOpenEditBanner: (banner: BannerSlide) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const LandingSettingsTab: React.FC<LandingSettingsTabProps> = ({
  banners,
  products,
  onToggleBanner,
  onDeleteBanner,
  onOpenCreateBanner,
  onOpenEditBanner,
  showToast,
}) => {
  const { landingContent, saveLandingContent } = useApp();
  const [searchBanner, setSearchBanner] = useState('');
  const [contentForm, setContentForm] = useState<LandingContent>(landingContent);
  const [activeTab, setActiveTab] = useState<'banners' | 'text' | 'produk'>('banners');
  const [searchProduk, setSearchProduk] = useState('');

  // Produk terpilih utk section "Koleksi Produk Pilihan" (string JSON di landingContent)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(landingContent.featuredProductIds || '[]');
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (landingContent) {
      setContentForm(landingContent);
      try {
        const parsed = JSON.parse(landingContent.featuredProductIds || '[]');
        if (Array.isArray(parsed)) setSelectedProductIds(parsed.map(String));
      } catch {
        /* abaikan */
      }
    }
  }, [landingContent]);

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await saveLandingContent(contentForm);
    if (ok) {
      showToast('Konten Landing Page berhasil disimpan!');
    } else {
      showToast('Gagal menyimpan konten. Periksa sesi admin atau coba lagi.', 'error');
    }
  };

  const filteredBanners = banners.filter(
    (b) =>
      b.title.toLowerCase().includes(searchBanner.toLowerCase()) ||
      b.targetLink.toLowerCase().includes(searchBanner.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduk.toLowerCase()) ||
      p.categoryLabel.toLowerCase().includes(searchProduk.toLowerCase())
  );

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSaveFeaturedProducts = async () => {
    // Kirim SELURUH contentForm + featuredProductIds — saveLandingContent replace seluruh state,
    // jadi jangan kirim cuma satu field (nanti field lain hilang).
    const ok = await saveLandingContent({ ...contentForm, featuredProductIds: JSON.stringify(selectedProductIds) });
    if (ok) {
      showToast('Produk Pilihan berhasil disimpan!');
    } else {
      showToast('Gagal menyimpan Produk Pilihan. Periksa sesi admin atau coba lagi.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Breadcrumb */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#555555] mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#1B5E20] font-semibold">Pengaturan Landing Page</li>
            </ol>
          </nav>
          <h2 className="text-lg md:text-xl font-bold text-[#1B5E20] tracking-tight">
            Pengaturan Landing Page
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-[#2E7D32] text-white shadow-2xs font-extrabold'
                : 'bg-[#FFFFFF] text-[#1B5E20] border border-[#E0E0E0] hover:bg-[#E8F5E9]'
            }`}
          >
            Banner Carousel ({banners.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-[#2E7D32] text-white shadow-2xs font-extrabold'
                : 'bg-[#FFFFFF] text-[#1B5E20] border border-[#E0E0E0] hover:bg-[#E8F5E9]'
            }`}
          >
            Teks &amp; Konten Landing Page
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('produk')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'produk'
                ? 'bg-[#2E7D32] text-white shadow-2xs font-extrabold'
                : 'bg-[#FFFFFF] text-[#1B5E20] border border-[#E0E0E0] hover:bg-[#E8F5E9]'
            }`}
          >
            Produk Pilihan ({selectedProductIds.length})
          </button>
        </div>
      </section>

      {activeTab === 'banners' ? (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onOpenCreateBanner}
              className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-2xs cursor-pointer font-bold text-xs tracking-wider"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>TAMBAH BANNER BARU</span>
            </button>
          </div>
          <div className="bg-[#FFFFFF] rounded-2xl shadow-2xs border border-[#E0E0E0] overflow-hidden">
            <div className="p-4 border-b border-[#E0E0E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F7F8F6]">
              <h3 className="text-sm font-extrabold text-[#1B5E20]">
                Daftar Banner Beranda
              </h3>
              <div className="flex items-center bg-[#FFFFFF] rounded-xl px-3 py-1.5 border border-[#E0E0E0]">
                <span className="material-symbols-outlined text-[#555555] mr-2 text-base">search</span>
                <input
                  type="text"
                  value={searchBanner}
                  onChange={(e) => setSearchBanner(e.target.value)}
                  placeholder="Cari banner..."
                  className="bg-transparent border-none outline-none text-xs text-[#1B5E20] w-44 placeholder:text-[#555555] font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ backgroundColor: '#E8F5E9', color: '#1B5E20' }} className="border-b border-[#C8E6C9]">
                    <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">THUMBNAIL</strong></th>
                    <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">JUDUL SLIDE</strong></th>
                    <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">LINK TARGET</strong></th>
                    <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-6 py-3.5 text-center text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">STATUS</strong></th>
                    <th style={{ backgroundColor: '#E8F5E9', color: '#1B5E20', fontWeight: 800 }} className="px-6 py-3.5 text-right text-xs font-extrabold uppercase tracking-wider"><strong className="font-black text-[#1B5E20]">AKSI</strong></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0] text-xs sm:text-sm">
                  {filteredBanners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-[#E8F5E9]/60 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="w-20 h-11 rounded-lg bg-[#F7F8F6] overflow-hidden border border-[#E0E0E0] shadow-2xs">
                          <img
                            src={banner.image}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-xs text-[#1B5E20]">{banner.title}</p>
                        <p className="text-[10px] text-[#555555] mt-0.5">Diunggah {banner.uploadDate}</p>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-[#555555] font-mono-custom">{banner.targetLink}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={banner.active}
                              onChange={() => onToggleBanner(banner.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#E0E0E0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E0E0E0] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2E7D32]"></div>
                          </label>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end space-x-2 text-[#555555]">
                          <button
                            type="button"
                            onClick={() => onOpenEditBanner(banner)}
                            className="w-8 h-8 rounded-xl bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                            title="Edit banner"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteBanner(banner.id)}
                            className="hover:text-[#D32F2F] hover:bg-[#FFEBEE] p-1.5 rounded-lg border border-[#E0E0E0] hover:border-[#FFCDD2] transition-all cursor-pointer flex items-center justify-center"
                            title="Hapus banner"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-[#FFFFFF] text-[#555555] text-xs font-medium flex justify-between items-center border-t border-[#E0E0E0]">
              <span>
                Menampilkan {filteredBanners.length} dari {banners.length} Banner
              </span>
            </div>
          </div>
        </>
      ) : activeTab === 'produk' ? (
        <div className="space-y-4">
          {/* Header + search */}
          <div className="bg-[#FFFFFF] rounded-2xl shadow-2xs border border-[#E0E0E0] overflow-hidden">
            <div className="p-4 border-b border-[#E0E0E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F7F8F6]">
              <div>
                <h3 className="text-sm font-bold text-[#1B5E20]">
                  Produk Pilihan di Beranda
                </h3>
                <p className="text-[11px] text-[#555555] mt-0.5">
                  Pilih maksimal 4 produk yang tampil di section &quot;Koleksi Produk Pilihan&quot; beranda.
                </p>
              </div>
              <div className="flex items-center bg-[#FFFFFF] rounded-xl px-3 py-1.5 border border-[#E0E0E0]">
                <span className="material-symbols-outlined text-[#555555] mr-2 text-base">search</span>
                <input
                  type="text"
                  value={searchProduk}
                  onChange={(e) => setSearchProduk(e.target.value)}
                  placeholder="Cari produk..."
                  className="bg-transparent border-none outline-none text-xs text-[#1B5E20] w-44 placeholder:text-[#555555] font-medium"
                />
              </div>
            </div>

            {/* Grid produk dengan checkbox */}
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-[#555555] text-sm">
                Tidak ada produk yang cocok.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(String(product.id));
                  return (
                    <div
                      key={product.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[#2E7D32] bg-[#E8F5E9] text-[#1B5E20] shadow-2xs'
                          : 'border-[#E0E0E0] hover:border-[#2E7D32]/50 hover:bg-[#E8F5E9]/30 bg-[#FFFFFF]'
                      }`}
                      onClick={() => toggleProductSelection(String(product.id))}
                    >
                      <div className="w-14 h-14 rounded-lg bg-[#F7F8F6] overflow-hidden border border-[#E0E0E0] flex-shrink-0">
                        <img
                          src={product.image || ''}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-[#1B5E20] truncate">{product.name}</p>
                        <p className="text-[10px] text-[#555555]">{product.categoryLabel}</p>
                        <p className="text-[11px] font-bold text-[#1B5E20] font-mono-custom">{product.formattedPrice}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProductSelection(String(product.id))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 mt-0.5 accent-[#2E7D32] cursor-pointer flex-shrink-0"
                        title="Pilih produk"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-4 bg-[#FFFFFF] text-[#555555] text-xs font-medium flex items-center justify-between border-t border-[#E0E0E0]">
              <span>
                Terpilih {selectedProductIds.length} dari {products.length} produk
              </span>
              <button
                type="button"
                onClick={handleSaveFeaturedProducts}
                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-5 py-2 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
              >
                Simpan Produk Pilihan
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveContent} className="space-y-6">
          {/* Card: Hero Section */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#1B5E20] border-b border-[#E0E0E0] pb-2">
              1. Hero Banner Content
            </h3>
            <p className="text-[11px] text-[#555555] -mt-2">Terjemahan Inggris dihasilkan otomatis saat disimpan.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1">Judul Hero</label>
                <input
                  type="text"
                  value={contentForm.heroTitleId}
                  onChange={(e) => setContentForm({ ...contentForm, heroTitleId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#555555] mb-1">Deskripsi Hero</label>
                <textarea
                  rows={3}
                  value={contentForm.heroDescId}
                  onChange={(e) => setContentForm({ ...contentForm, heroDescId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1">Teks Tombol Hero</label>
                <input
                  type="text"
                  value={contentForm.heroBtnId}
                  onChange={(e) => setContentForm({ ...contentForm, heroBtnId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium"
                />
              </div>
            </div>
          </div>

          {/* Card: Brand Story Section */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#1B5E20] border-b border-[#E0E0E0] pb-2">
              2. Kisah Kami (Brand Story)
            </h3>
            <p className="text-[11px] text-[#555555] -mt-2">Terjemahan Inggris dihasilkan otomatis saat disimpan.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#555555] mb-1">Tagline Story</label>
                <input
                  type="text"
                  value={contentForm.storyTaglineId}
                  onChange={(e) => setContentForm({ ...contentForm, storyTaglineId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#555555] mb-1">Judul Story</label>
                <input
                  type="text"
                  value={contentForm.storyTitleId}
                  onChange={(e) => setContentForm({ ...contentForm, storyTitleId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#555555] mb-1">URL Gambar Story</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={contentForm.storyImageUrl}
                    onChange={(e) => setContentForm({ ...contentForm, storyImageUrl: e.target.value })}
                    className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium"
                    placeholder="https://... atau gunakan tombol Upload"
                  />
                  <label className="cursor-pointer text-xs font-semibold text-[#1B5E20] bg-[#E8F5E9] border border-[#A5D6A7] px-3 py-2 rounded-xl hover:bg-[#C8E6C9] transition-all whitespace-nowrap flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Upload
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/avif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const { productAdminApi } = await import('../../api/adminApi');
                          const url = await productAdminApi.uploadImage(file);
                          if (!url) throw new Error('upload gagal');
                          setContentForm({ ...contentForm, storyImageUrl: url });
                          showToast('Gambar story berhasil diunggah. Klik Simpan untuk menyimpan.');
                        } catch (e: any) {
                          showToast(e?.message || 'Gagal mengunggah gambar.', 'error');
                        }
                      }}
                    />
                  </label>
                </div>
                {contentForm.storyImageUrl && (
                  <img
                    src={contentForm.storyImageUrl}
                    alt="Pratinjau Gambar Story"
                    className="mt-2 w-48 h-28 object-cover rounded-xl border border-[#E0E0E0]"
                  />
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#555555] mb-1">Paragraf 1</label>
                <textarea
                  rows={3}
                  value={contentForm.storyDesc1Id}
                  onChange={(e) => setContentForm({ ...contentForm, storyDesc1Id: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#555555] mb-1">Paragraf 2</label>
                <textarea
                  rows={3}
                  value={contentForm.storyDesc2Id}
                  onChange={(e) => setContentForm({ ...contentForm, storyDesc2Id: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium"
                />
              </div>
            </div>
          </div>

          {/* Card: Benefits Section */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#1B5E20] border-b border-[#E0E0E0] pb-2">
              3. Seksi Keunggulan (Why Choose Sorghum)
            </h3>
            <p className="text-[11px] text-[#555555] -mt-2">Terjemahan Inggris dihasilkan otomatis saat disimpan.</p>
            <div className="grid grid-cols-1 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#555555] mb-1">Judul Seksi</label>
                <input
                  type="text"
                  value={contentForm.benefitsTitleId}
                  onChange={(e) => setContentForm({ ...contentForm, benefitsTitleId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#555555] mb-1">Deskripsi Seksi</label>
                <textarea
                  rows={2}
                  value={contentForm.benefitsDescId}
                  onChange={(e) => setContentForm({ ...contentForm, benefitsDescId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium"
                />
              </div>
              {/* Benefit 1 */}
              <div className="border-t border-[#E0E0E0] pt-3">
                <p className="text-xs font-extrabold text-[#1B5E20] mb-2">Keunggulan 1</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#555555] mb-1">Judul</label>
                    <input type="text" value={contentForm.benefit1TitleId} onChange={(e) => setContentForm({ ...contentForm, benefit1TitleId: e.target.value })} className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#555555] mb-1">Ikon (Material Symbol)</label>
                    <input type="text" value={contentForm.benefit1Icon} onChange={(e) => setContentForm({ ...contentForm, benefit1Icon: e.target.value })} className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium" placeholder="contoh: eco, verified, groups" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#555555] mb-1">Deskripsi</label>
                    <textarea rows={2} value={contentForm.benefit1DescId} onChange={(e) => setContentForm({ ...contentForm, benefit1DescId: e.target.value })} className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium" />
                  </div>
                </div>
              </div>
              {/* Benefit 2 */}
              <div className="border-t border-[#E0E0E0] pt-3">
                <p className="text-xs font-extrabold text-[#1B5E20] mb-2">Keunggulan 2</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#555555] mb-1">Judul</label>
                    <input type="text" value={contentForm.benefit2TitleId} onChange={(e) => setContentForm({ ...contentForm, benefit2TitleId: e.target.value })} className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#555555] mb-1">Ikon (Material Symbol)</label>
                    <input type="text" value={contentForm.benefit2Icon} onChange={(e) => setContentForm({ ...contentForm, benefit2Icon: e.target.value })} className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium" placeholder="contoh: eco, verified, groups" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#555555] mb-1">Deskripsi</label>
                    <textarea rows={2} value={contentForm.benefit2DescId} onChange={(e) => setContentForm({ ...contentForm, benefit2DescId: e.target.value })} className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium" />
                  </div>
                </div>
              </div>
              {/* Benefit 3 */}
              <div className="border-t border-[#E0E0E0] pt-3">
                <p className="text-xs font-extrabold text-[#1B5E20] mb-2">Keunggulan 3</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#555555] mb-1">Judul</label>
                    <input type="text" value={contentForm.benefit3TitleId} onChange={(e) => setContentForm({ ...contentForm, benefit3TitleId: e.target.value })} className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#555555] mb-1">Ikon (Material Symbol)</label>
                    <input type="text" value={contentForm.benefit3Icon} onChange={(e) => setContentForm({ ...contentForm, benefit3Icon: e.target.value })} className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium" placeholder="contoh: eco, verified, groups" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-semibold text-[#555555] mb-1">Deskripsi</label>
                    <textarea rows={2} value={contentForm.benefit3DescId} onChange={(e) => setContentForm({ ...contentForm, benefit3DescId: e.target.value })} className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Featured Products Section */}
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E0E0E0] shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-[#1B5E20] border-b border-[#E0E0E0] pb-2">
              4. Koleksi Produk Pilihan (Teks Judul)
            </h3>
            <p className="text-[11px] text-[#555555] -mt-2">Terjemahan Inggris dihasilkan otomatis saat disimpan. Pemilihan produk di tab Produk Pilihan.</p>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1">Judul Seksi</label>
                <input
                  type="text"
                  value={contentForm.featuredTitleId}
                  onChange={(e) => setContentForm({ ...contentForm, featuredTitleId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#555555] mb-1">Deskripsi Seksi</label>
                <textarea
                  rows={2}
                  value={contentForm.featuredDescId}
                  onChange={(e) => setContentForm({ ...contentForm, featuredDescId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl outline-none focus:border-[#2E7D32] text-[#1B5E20] font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              Simpan Konten Landing Page
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
