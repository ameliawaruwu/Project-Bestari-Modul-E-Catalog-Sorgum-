import React, { useState } from 'react';
import { BannerSlide } from '../../types/admin';

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
}) => {
  const [searchBanner, setSearchBanner] = useState('');

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

        <button
          type="button"
          onClick={onOpenCreateBanner}
          className="bg-[#162809] hover:bg-[#2b3e1d] text-white px-4 py-2 rounded-lg flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer font-semibold text-xs tracking-wider"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>TAMBAH BANNER BARU</span>
        </button>
      </section>

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
          <div className="flex space-x-2">
            <button
              disabled
              className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-xs cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs cursor-pointer">
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
