import React, { useState, useEffect } from 'react';
import { BannerSlide } from '../../types/admin';
import { useApp, LandingContent } from '../../context/AppContext';

interface LandingSettingsTabProps {
  banners: BannerSlide[];
  onToggleBanner: (id: string) => void;
  onDeleteBanner: (id: string) => void;
  onOpenCreateBanner: () => void;
  onOpenEditBanner: (banner: BannerSlide) => void;
  showToast: (msg: string) => void;
}

export const LandingSettingsTab: React.FC<LandingSettingsTabProps> = ({
  banners,
  onToggleBanner,
  onDeleteBanner,
  onOpenCreateBanner,
  onOpenEditBanner,
  showToast,
}) => {
  const { landingContent, saveLandingContent } = useApp();
  const [searchBanner, setSearchBanner] = useState('');
  const [contentForm, setContentForm] = useState<LandingContent>(landingContent);
  const [activeTab, setActiveTab] = useState<'banners' | 'text'>('banners');

  useEffect(() => {
    if (landingContent) {
      setContentForm(landingContent);
    }
  }, [landingContent]);

  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    saveLandingContent(contentForm);
    showToast('Konten Landing Page berhasil disimpan!');
  };

  const filteredBanners = banners.filter(
    (b) =>
      b.title.toLowerCase().includes(searchBanner.toLowerCase()) ||
      b.targetLink.toLowerCase().includes(searchBanner.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Breadcrumb */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-slate-400 mb-1">
            <ol className="flex items-center space-x-2">
              <li>Dashboard</li>
              <li>
                <span className="material-symbols-outlined text-xs leading-none">
                  chevron_right
                </span>
              </li>
              <li className="text-slate-600 font-semibold">Pengaturan Landing Page</li>
            </ol>
          </nav>
          <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
            Pengaturan Landing Page
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-[#162809] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Banner Carousel ({banners.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-[#162809] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Teks &amp; Konten Landing Page
          </button>
        </div>
      </section>

      {activeTab === 'banners' ? (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onOpenCreateBanner}
              className="bg-[#162809] hover:bg-[#2b3e1d] text-white px-4 py-2 rounded-lg flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer font-semibold text-xs tracking-wider"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>TAMBAH BANNER BARU</span>
            </button>
          </div>

          {/* Table Card: Daftar Banner Beranda */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
              <h3 className="text-sm font-bold text-slate-800">
                Daftar Banner Beranda
              </h3>
              <div className="flex items-center bg-[#f8fafc] rounded-lg px-3 py-1.5 border border-slate-200/80">
                <span className="material-symbols-outlined text-slate-400 mr-2 text-base">search</span>
                <input
                  type="text"
                  value={searchBanner}
                  onChange={(e) => setSearchBanner(e.target.value)}
                  placeholder="Cari banner..."
                  className="bg-transparent border-none outline-none text-xs text-slate-700 w-44 placeholder:text-slate-400/80"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-3">Thumbnail</th>
                    <th className="px-6 py-3">Judul Slide</th>
                    <th className="px-6 py-3">Link Target</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {filteredBanners.map((banner) => (
                    <tr key={banner.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="w-20 h-11 rounded-lg bg-slate-100 overflow-hidden border border-slate-200/60 shadow-3xs">
                          <img
                            src={banner.image}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-xs text-slate-800">{banner.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Diunggah {banner.uploadDate}</p>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-500 font-mono-custom">{banner.targetLink}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={banner.active}
                              onChange={() => onToggleBanner(banner.id)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#162809]"></div>
                          </label>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end space-x-2 text-slate-400">
                          <button
                            type="button"
                            onClick={() => onOpenEditBanner(banner)}
                            className="hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-100/50 transition-all cursor-pointer flex items-center justify-center"
                            title="Edit banner"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteBanner(banner.id)}
                            className="hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-slate-100/50 hover:border-rose-100 transition-all cursor-pointer flex items-center justify-center"
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

            <div className="p-4 bg-white text-slate-500 text-xs font-medium flex justify-between items-center border-t border-slate-100">
              <span>
                Menampilkan {filteredBanners.length} dari {banners.length} Banner
              </span>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handleSaveContent} className="space-y-6">
          {/* Card: Hero Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              1. Hero Banner Content
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Hero (ID)</label>
                <input
                  type="text"
                  value={contentForm.heroTitleId}
                  onChange={(e) => setContentForm({ ...contentForm, heroTitleId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#162809]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hero Title (EN)</label>
                <input
                  type="text"
                  value={contentForm.heroTitleEn}
                  onChange={(e) => setContentForm({ ...contentForm, heroTitleEn: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#162809]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi Hero (ID)</label>
                <textarea
                  rows={3}
                  value={contentForm.heroDescId}
                  onChange={(e) => setContentForm({ ...contentForm, heroDescId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#162809]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hero Description (EN)</label>
                <textarea
                  rows={3}
                  value={contentForm.heroDescEn}
                  onChange={(e) => setContentForm({ ...contentForm, heroDescEn: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#162809]"
                />
              </div>
            </div>
          </div>

          {/* Card: Brand Story Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              2. Kisah Kami (Brand Story)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Story (ID)</label>
                <input
                  type="text"
                  value={contentForm.storyTitleId}
                  onChange={(e) => setContentForm({ ...contentForm, storyTitleId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#162809]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Story Title (EN)</label>
                <input
                  type="text"
                  value={contentForm.storyTitleEn}
                  onChange={(e) => setContentForm({ ...contentForm, storyTitleEn: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#162809]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">URL Gambar Story</label>
                <input
                  type="text"
                  value={contentForm.storyImageUrl}
                  onChange={(e) => setContentForm({ ...contentForm, storyImageUrl: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#162809]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Paragraf 1 (ID)</label>
                <textarea
                  rows={3}
                  value={contentForm.storyDesc1Id}
                  onChange={(e) => setContentForm({ ...contentForm, storyDesc1Id: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#162809]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Paragraph 1 (EN)</label>
                <textarea
                  rows={3}
                  value={contentForm.storyDesc1En}
                  onChange={(e) => setContentForm({ ...contentForm, storyDesc1En: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#162809]"
                />
              </div>
            </div>
          </div>

          {/* Card: Benefits Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              3. Seksi Keunggulan (Why Choose Sorghum)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Seksi (ID)</label>
                <input
                  type="text"
                  value={contentForm.benefitsTitleId}
                  onChange={(e) => setContentForm({ ...contentForm, benefitsTitleId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#162809]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Section Title (EN)</label>
                <input
                  type="text"
                  value={contentForm.benefitsTitleEn}
                  onChange={(e) => setContentForm({ ...contentForm, benefitsTitleEn: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-[#162809]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#162809] hover:bg-[#2b3e1d] text-white px-6 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Simpan Konten Landing Page
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
