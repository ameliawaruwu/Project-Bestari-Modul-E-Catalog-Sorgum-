import React from 'react';
import { useApp } from '../context/AppContext';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const { t, shopSettings } = useApp();

  return (
    <footer className="w-full max-w-full overflow-hidden py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 bg-[#1F5132] dark:bg-[#070D08] text-white border-t border-[#3A8F4B]/30 dark:border-[rgba(165,214,167,0.15)] transition-colors duration-300 relative z-10">
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row justify-between items-start gap-7 sm:gap-8 lg:gap-12">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-2.5">
            <img
              src={shopSettings.logoUrl || '/favicon-spa2.svg'}
              alt={shopSettings.storeName || 'Logo toko'}
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg"
            />
            <span className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              {shopSettings.storeName ? shopSettings.storeName.split(' ')[0] : 'KWT'}
            </span>
          </div>
          <p className="font-['Plus_Jakarta_Sans'] text-xs text-white/80 leading-relaxed font-normal">
            {t(
              'Pelopor produk sorgum berkualitas tinggi di Indonesia. Kami berdedikasi untuk kesehatan Anda dan keberlanjutan bumi melalui inovasi pangan lokal.',
              'Pioneer of high-quality sorghum products in Indonesia. We are dedicated to your health and the sustainability of the earth through local food innovation.'
            )}
          </p>
        </div>

        {/* Di HP: 2 kolom supaya footer tidak terlalu tinggi (Navigasi+Kontak
            di baris pertama, Informasi di bawahnya). ≥sm: 3 kolom seperti semula. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-6 lg:gap-8 flex-grow w-full md:w-auto">
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

          <div className="col-span-2 sm:col-span-1">
            <h5 className="font-['Plus_Jakarta_Sans'] text-[11px] font-bold text-[#E3B84B] mb-2.5 uppercase tracking-wider">
              {t('Kontak', 'Contact')}
            </h5>
            {shopSettings.whatsappNumber && (
              <p className="font-['Plus_Jakarta_Sans'] text-xs mb-1.5 text-white/90 break-words">WhatsApp: {shopSettings.whatsappNumber}</p>
            )}
            <p className="font-['Plus_Jakarta_Sans'] text-xs mb-1.5 text-white/90 break-words">Email: {shopSettings.storeEmail || 'halo@kwt.id'}</p>
            {shopSettings.storeAddress && (
              <p className="font-['Plus_Jakarta_Sans'] text-xs mb-1.5 text-white/90 break-words">Alamat: {shopSettings.storeAddress}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto mt-5 sm:mt-6 flex justify-center text-center px-2">
        <p className="font-['Plus_Jakarta_Sans'] text-[11px] text-white/65">
          {t('© 2026 KWT · Kemurnian Alami untuk Hidup Sehat.', '© 2026 KWT · Pure Nature for Healthy Living.')}
        </p>
      </div>
    </footer>
  );
};

