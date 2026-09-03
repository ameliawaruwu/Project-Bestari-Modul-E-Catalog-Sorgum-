import React, { useState, useEffect } from 'react';
import { BannerSlide } from '../../types/admin';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { LandingContent } from '../../context/defaults';

// Header kartu bagian (badge nomor + judul + deskripsi) — dipakai 4x di form konten.
const SectionCardHeader: React.FC<{ num: number; title: string; desc: string }> = ({ num, title, desc }) => (
  <div className="flex items-start gap-3 border-b border-[#E2EFE0] dark:border-white/10 pb-3">
    <span className="w-7 h-7 rounded-lg bg-[#1F5132] text-white text-sm font-extrabold flex items-center justify-center flex-shrink-0 shadow-2xs">
      {num}
    </span>
    <div>
      <h3 className="text-sm font-extrabold text-[#14331C] dark:text-[#F4F8F3]">{title}</h3>
      <p className="text-[11px] text-[#556353] dark:text-white/60 mt-0.5">{desc}</p>
    </div>
  </div>
);

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
  // Loading simpan — BE auto-translate 17 field (~3-5s), tombol harus disabled
  // biar admin tidak klik ganda / bingung "telat banget".
  const [savingContent, setSavingContent] = useState(false);
  const [savingProducts, setSavingProducts] = useState(false);

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
    if (savingContent) return; // cegah double-click
    setSavingContent(true);
    try {
      const ok = await saveLandingContent(contentForm);
      if (ok) {
        showToast('Konten Landing Page berhasil disimpan!');
      } else {
        showToast('Gagal menyimpan konten. Periksa sesi admin atau coba lagi.', 'error');
      }
    } finally {
      setSavingContent(false);
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
    if (savingProducts) return; // cegah double-click
    setSavingProducts(true);
    try {
      // Kirim SELURUH contentForm + featuredProductIds — saveLandingContent replace seluruh state,
      // jadi jangan kirim cuma satu field (nanti field lain hilang).
      const ok = await saveLandingContent({ ...contentForm, featuredProductIds: JSON.stringify(selectedProductIds) });
      if (ok) {
        showToast('Produk Pilihan berhasil disimpan!');
      } else {
        showToast('Gagal menyimpan Produk Pilihan. Periksa sesi admin atau coba lagi.', 'error');
      }
    } finally {
      setSavingProducts(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Breadcrumb */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-[#556353] dark:text-white/60 mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-[#1F5132] dark:text-[#86EFAC] font-semibold">Pengaturan Landing Page</li>
            </ol>
          </nav>
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl md:text-3xl font-extrabold text-[#14331C] dark:text-[#F4F8F3] tracking-tight">
            Pengaturan Landing Page
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-[#1F5132] text-white shadow-xs'
                : 'bg-white dark:bg-[#0E1A11] text-[#1F5132] dark:text-[#86EFAC] border border-[#E2EFE0] dark:border-white/10 hover:bg-[#EAF6E8]'
            }`}
          >
            Banner Carousel ({banners.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-[#1F5132] text-white shadow-xs'
                : 'bg-white dark:bg-[#0E1A11] text-[#1F5132] dark:text-[#86EFAC] border border-[#E2EFE0] dark:border-white/10 hover:bg-[#EAF6E8]'
            }`}
          >
            Teks &amp; Konten Landing Page
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('produk')}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'produk'
                ? 'bg-[#1F5132] text-white shadow-xs'
                : 'bg-white dark:bg-[#0E1A11] text-[#1F5132] dark:text-[#86EFAC] border border-[#E2EFE0] dark:border-white/10 hover:bg-[#EAF6E8]'
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
              className="bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] text-white px-4.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer font-bold text-xs active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>TAMBAH BANNER BARU</span>
            </button>
          </div>
          <div className="bg-white dark:bg-[#0E1A11] rounded-2xl shadow-2xs border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] overflow-hidden">
            <div className="p-4 border-b border-[#E2EFE0] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F9FBF7] dark:bg-[#122316]">
              <h3 className="text-sm font-extrabold text-[#1F5132] dark:text-[#F4F8F3]">
                Daftar Banner Beranda
              </h3>
              <div className="flex items-center bg-white dark:bg-[#0E1A11] rounded-xl px-3 py-1.5 border border-[#E2EFE0] dark:border-white/10">
                <span className="material-symbols-outlined text-[#556353] dark:text-white/60 mr-2 text-base">search</span>
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
                disabled={savingProducts}
                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-5 py-2 rounded-xl font-bold text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingProducts ? 'Menyimpan...' : 'Simpan Produk Pilihan'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSaveContent} className="space-y-6">
          {/* Card 1: Hero Section */}
          <div className="bg-white dark:bg-[#0E1A11] p-5 sm:p-6 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs space-y-4">
            <SectionCardHeader
              num={1}
              title="Bagian Hero (Banner Paling Atas)"
              desc="Bagian pertama yang dilihat pengunjung — teks besar di atas halaman utama."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] mb-1">Judul Utama</label>
                <input
                  type="text"
                  value={contentForm.heroTitleId}
                  onChange={(e) => setContentForm({ ...contentForm, heroTitleId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F9FBF7] dark:bg-[#162419] border border-[#E2EFE0] dark:border-white/10 rounded-xl outline-none focus:border-[#3A8F4B] focus:ring-1 focus:ring-[#3A8F4B] text-[#1F5132] dark:text-[#F4F8F3] font-medium"
                  placeholder="Contoh: Kemurnian Alam dalam Tiap Butir Sorgum Pilihan"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] mb-1">Teks Penjelasan</label>
                <textarea
                  rows={3}
                  value={contentForm.heroDescId}
                  onChange={(e) => setContentForm({ ...contentForm, heroDescId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F9FBF7] dark:bg-[#162419] border border-[#E2EFE0] dark:border-white/10 rounded-xl outline-none focus:border-[#3A8F4B] focus:ring-1 focus:ring-[#3A8F4B] text-[#1F5132] dark:text-[#F4F8F3] font-medium"
                  placeholder="Kalimat singkat yang menjelaskan produk Anda"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] mb-1">Teks Tombol</label>
                <input
                  type="text"
                  value={contentForm.heroBtnId}
                  onChange={(e) => setContentForm({ ...contentForm, heroBtnId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F9FBF7] dark:bg-[#162419] border border-[#E2EFE0] dark:border-white/10 rounded-xl outline-none focus:border-[#3A8F4B] focus:ring-1 focus:ring-[#3A8F4B] text-[#1F5132] dark:text-[#F4F8F3] font-medium"
                  placeholder="Contoh: Belanja Sekarang"
                />
                <p className="text-[10px] text-[#556353] dark:text-white/60 mt-1">Tulisan di tombol hijau. Singkat saja, 2&ndash;3 kata.</p>
              </div>
            </div>
          </div>

          {/* Card 2: Featured Products Section */}
          <div className="bg-white dark:bg-[#0E1A11] p-5 sm:p-6 rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs space-y-4">
            <SectionCardHeader
              num={2}
              title="Bagian Produk Pilihan"
              desc="Judul dan keterangan di atas deretan produk pilihan. Pilihan produknya diatur lewat tab &quot;Produk Pilihan&quot; di atas."
            />
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] mb-1">Judul Bagian Ini</label>
                <input
                  type="text"
                  value={contentForm.featuredTitleId}
                  onChange={(e) => setContentForm({ ...contentForm, featuredTitleId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F9FBF7] dark:bg-[#162419] border border-[#E2EFE0] dark:border-white/10 rounded-xl outline-none focus:border-[#3A8F4B] focus:ring-1 focus:ring-[#3A8F4B] text-[#1F5132] dark:text-[#F4F8F3] font-medium"
                  placeholder="Contoh: Koleksi Produk Pilihan"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1F5132] dark:text-[#F4F8F3] mb-1">Teks Penjelasan</label>
                <textarea
                  rows={2}
                  value={contentForm.featuredDescId}
                  onChange={(e) => setContentForm({ ...contentForm, featuredDescId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-[#F9FBF7] dark:bg-[#162419] border border-[#E2EFE0] dark:border-white/10 rounded-xl outline-none focus:border-[#3A8F4B] focus:ring-1 focus:ring-[#3A8F4B] text-[#1F5132] dark:text-[#F4F8F3] font-medium"
                  placeholder="Satu kalimat singkat di bawah judul"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingContent}
              className="bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {savingContent ? 'Menyimpan...' : 'Simpan Konten Landing Page'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
