import React from 'react';
import { useApp } from '../context/AppContext';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const { t, shopSettings } = useApp();

  return (
    <footer className="w-full py-16 lg:py-20 px-4 md:px-10 bg-[#1B5E20] text-white border-t border-[#A5D6A7]/20">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12 lg:gap-16">
        <div className="max-w-sm">
          <span className="font-['Playfair_Display'] text-2xl lg:text-3xl font-semibold text-white mb-4 block">
            {shopSettings.storeName || 'SORGUM'}
          </span>
          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-white/90 leading-relaxed mb-6">
            {t(
              'Pelopor produk sorgum berkualitas tinggi di Indonesia. Kami berdedikasi untuk kesehatan Anda dan keberlanjutan bumi melalui inovasi pangan lokal.',
              'Pioneer of high-quality sorghum products in Indonesia. We are dedicated to your health and the sustainability of the earth through local food innovation.'
            )}
          </p>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 flex-grow">
          <div>
            <h5 className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#C89B3C] mb-4 uppercase tracking-widest">
              {t('Navigasi', 'Navigation')}
            </h5>
            <ul className="space-y-3 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm">
              <li>
                <button onClick={() => setActiveTab('beranda')} className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer">
                  {t('Beranda', 'Home')}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('produk')} className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer">
                  {t('Katalog Produk', 'Product Catalog')}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('tracking')} className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer">
                  {t('Lacak Pesanan', 'Track Order')}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#C89B3C] mb-4 uppercase tracking-widest">
              {t('Informasi', 'Information')}
            </h5>
            <ul className="space-y-3 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm">
              <li>
                <button onClick={() => setActiveTab('informasi')} className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer">
                  {t('Informasi & Artikel', 'Info & Articles')}
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('faq')} className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer">
                  {t('FAQ', 'FAQ')}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#C89B3C] mb-4 uppercase tracking-widest">
              {t('Kontak', 'Contact')}
            </h5>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm mb-2 text-white/90">WhatsApp: {shopSettings.whatsappNumber}</p>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm mb-2 text-white/90">Email: {shopSettings.storeEmail || 'halo@sorgum.id'}</p>
            {shopSettings.storeAddress && (
              <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm mb-2 text-white/90">Alamat: {shopSettings.storeAddress}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto mt-16 pt-8 border-t border-white/20 flex justify-center">
        <p className="font-['Plus_Jakarta_Sans'] text-xs text-white/80">© 2024 SORGUM Sorghum. Crafted with Authenticity.</p>
      </div>
    </footer>
  );
};

