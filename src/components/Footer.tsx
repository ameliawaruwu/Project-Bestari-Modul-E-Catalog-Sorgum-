import React from 'react';
import { useApp } from '../context/AppContext';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const { t, shopSettings } = useApp();

  return (
    <footer className="w-full py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 bg-[#1F5132] dark:bg-[#070D08] text-white border-t border-[#3A8F4B]/30 dark:border-[rgba(165,214,167,0.15)] transition-colors duration-300 relative z-10">
      <div className="max-w-[1180px] mx-auto flex flex-col md:flex-row justify-between items-start gap-8 lg:gap-12">
        <div className="max-w-xs">
          <div className="flex items-center gap-2.5 mb-2.5">
            {shopSettings.logoUrl ? (
              <img
                src={shopSettings.logoUrl}
                alt={shopSettings.storeName || 'BESTARI'}
                className="h-9 max-w-[150px] object-contain rounded p-0.5"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-white/15 text-[#E3B84B] shadow-2xs">
                  <span className="material-symbols-outlined text-xl sm:text-2xl">
                    eco
                  </span>
                </div>
                <div>
                  <span className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-black tracking-tight uppercase block leading-none text-white">
                    {shopSettings.storeName ? shopSettings.storeName.split(' ')[0] : 'BESTARI'}
                  </span>
                  <span className="font-['Plus_Jakarta_Sans'] text-[9px] sm:text-[10px] font-bold tracking-widest uppercase block mt-0.5 text-[#E3B84B]">
                    SORGUM E-CATALOG
                  </span>
                </div>
              </div>
            )}
          </div>
          <p className="font-['Plus_Jakarta_Sans'] text-xs text-white/80 leading-relaxed font-normal">
            {t(
              'Pelopor produk sorgum berkualitas tinggi di Indonesia. Kami berdedikasi untuk kesehatan Anda dan keberlanjutan bumi melalui inovasi pangan lokal.',
              'Pioneer of high-quality sorghum products in Indonesia. We are dedicated to your health and the sustainability of the earth through local food innovation.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 flex-grow">
          <div>
            <h5 className="font-['Plus_Jakarta_Sans'] text-[11px] font-bold text-[#E3B84B] mb-2.5 uppercase tracking-wider">
              {t('Navigasi', 'Navigation')}
            </h5>
            <ul className="space-y-2 font-['Plus_Jakarta_Sans'] text-xs">
              <li>
                <button onClick={() => setActiveTab('beranda')} className="hover:text-[#E3B84B] hover:underline transition-all text-white/90 text-left cursor-pointer">
                  {t('Beranda', 'Home')}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('produk')} className="hover:text-[#E3B84B] hover:underline transition-all text-white/90 text-left cursor-pointer">
                  {t('Katalog Produk', 'Product Catalog')}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('tracking')} className="hover:text-[#E3B84B] hover:underline transition-all text-white/90 text-left cursor-pointer">
                  {t('Lacak Pesanan', 'Track Order')}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-['Plus_Jakarta_Sans'] text-[11px] font-bold text-[#E3B84B] mb-2.5 uppercase tracking-wider">
              {t('Informasi', 'Information')}
            </h5>
            <ul className="space-y-2 font-['Plus_Jakarta_Sans'] text-xs">
              <li>
                <button onClick={() => setActiveTab('informasi')} className="hover:text-[#E3B84B] hover:underline transition-all text-white/90 text-left cursor-pointer">
                  {t('Informasi & Artikel', 'Info & Articles')}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-['Plus_Jakarta_Sans'] text-[11px] font-bold text-[#E3B84B] mb-2.5 uppercase tracking-wider">
              {t('Kontak', 'Contact')}
            </h5>
            <p className="font-['Plus_Jakarta_Sans'] text-xs mb-1.5 text-white/90">WhatsApp: {shopSettings.whatsappNumber}</p>
            <p className="font-['Plus_Jakarta_Sans'] text-xs mb-1.5 text-white/90">Email: {shopSettings.storeEmail || 'halo@bestari.id'}</p>
            {shopSettings.storeAddress && (
              <p className="font-['Plus_Jakarta_Sans'] text-xs mb-1.5 text-white/90">Alamat: {shopSettings.storeAddress}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto mt-6 sm:mt-8 flex justify-center text-center">
        <p className="font-['Plus_Jakarta_Sans'] text-[11px] text-white/65">
          © 2026 BESTARI — Kemurnian Alami untuk Hidup Sehat.
        </p>
      </div>
    </footer>
  );
};

