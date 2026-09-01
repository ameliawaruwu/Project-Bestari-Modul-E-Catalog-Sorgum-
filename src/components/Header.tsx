import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user?: unknown | null;
  onNavigateAuth?: (mode: 'login' | 'register') => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onLogout?: () => void;
  alwaysSolid?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  alwaysSolid = false,
}) => {
  const { language, theme, toggleLanguage, toggleTheme, t, shopSettings } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      id="main-header"
      className={`fixed top-0 left-0 w-full z-50 h-20 transition-all duration-300 px-4 md:px-10 flex justify-between items-center text-white ${
        isScrolled || alwaysSolid
          ? 'bg-[#1B5E20] shadow-md border-b border-[#A5D6A7]/20'
          : 'bg-transparent shadow-none'
      }`}
    >
      <div className="flex items-center shrink-0">
        <button
          onClick={() => setActiveTab('beranda')}
          className="text-left flex items-center gap-2.5 focus:outline-none hover:opacity-90 transition-opacity cursor-pointer"
        >
          {shopSettings.logoUrl ? (
            <img
              src={shopSettings.logoUrl}
              alt={shopSettings.storeName || 'SORGUM'}
              className="h-8 max-w-[140px] object-contain rounded bg-white/10 p-0.5"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="font-['Playfair_Display'] text-xl lg:text-2xl font-bold tracking-tight text-white">
              {shopSettings.storeName ? shopSettings.storeName.split(' ')[0] : 'SORGUM'}
            </span>
          )}
        </button>
      </div>

      <nav className="hidden md:flex items-center gap-4 lg:gap-8 absolute left-1/2 -translate-x-1/2">
        <button
          onClick={() => setActiveTab('beranda')}
          className={`font-['Plus_Jakarta_Sans'] text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all duration-200 py-1 focus:outline-none border-b-2 ${
            activeTab === 'beranda'
              ? 'text-[#C89B3C] font-bold border-[#C89B3C]'
              : 'text-white/80 hover:text-white border-transparent'
          }`}
        >
          {t('Beranda', 'Home')}
        </button>
        <button
          onClick={() => setActiveTab('produk')}
          className={`font-['Plus_Jakarta_Sans'] text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all duration-200 py-1 focus:outline-none border-b-2 ${
            activeTab === 'produk'
              ? 'text-[#C89B3C] font-bold border-[#C89B3C]'
              : 'text-white/80 hover:text-white border-transparent'
          }`}
        >
          {t('Produk', 'Products')}
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`font-['Plus_Jakarta_Sans'] text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all duration-200 py-1 focus:outline-none border-b-2 ${
            activeTab === 'tracking'
              ? 'text-[#C89B3C] font-bold border-[#C89B3C]'
              : 'text-white/80 hover:text-white border-transparent'
          }`}
        >
          {t('Lacak Pesanan', 'Track Order')}
        </button>
      </nav>

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Theme Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="p-1.5 hover:bg-[#2E7D32] rounded-lg transition-all active:scale-95 flex items-center justify-center focus:outline-none cursor-pointer"
          title={theme === 'light' ? t('Mode Gelap', 'Dark Mode') : t('Mode Terang', 'Light Mode')}
        >
          <span className="material-symbols-outlined text-white text-lg sm:text-xl">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="p-1.5 hover:bg-[#2E7D32] rounded-lg transition-all active:scale-95 flex items-center justify-center focus:outline-none gap-0.5 cursor-pointer"
          title={language === 'id' ? 'Switch to English' : 'Ubah ke Bahasa Indonesia'}
        >
          <span className="material-symbols-outlined text-white text-lg sm:text-xl">language</span>
          <span className="hidden lg:inline text-[10px] font-bold font-['Plus_Jakarta_Sans'] uppercase tracking-wider">
            {language}
          </span>
        </button>


      </div>
    </header>
  );
};

export default Header;
