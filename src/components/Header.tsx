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
}) => {
  const { language, theme, toggleLanguage, toggleTheme, t, shopSettings } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'beranda', label: t('Beranda', 'Home') },
    { id: 'produk', label: t('Produk', 'Products') },
    { id: 'informasi', label: t('Artikel', 'Articles') },
    { id: 'faq', label: t('FAQ', 'FAQ') },
    { id: 'tracking', label: t('Lacak Pesanan', 'Track Order') },
  ];

  return (
    <header id="main-header" className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* ── Dynamic Navigation Bar (White at top, Evergreen when scrolled) ── */}
      <div
        className={`px-4 sm:px-6 lg:px-12 py-2.5 sm:py-3 transition-all duration-300 backdrop-blur-md ${
          isScrolled
            ? 'bg-[#1F5132]/95 dark:bg-[#070D08]/95 text-white border-b border-[#3A8F4B]/30 shadow-md'
            : 'bg-white/95 dark:bg-[#0B1A10]/95 text-[#20352A] dark:text-[#F4F8F3] border-b border-[#E8F5E9] dark:border-[rgba(165,214,167,0.15)] shadow-xs'
        }`}
      >
        <div className="max-w-[1180px] mx-auto flex items-center justify-between">
          
          {/* Brand Logo (Green Leaves + BESTARI SORGUM) */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => {
                setActiveTab('beranda');
                setMobileMenuOpen(false);
              }}
              className="text-left flex items-center gap-2.5 focus:outline-none hover:opacity-90 transition-opacity cursor-pointer group"
            >
              {shopSettings.logoUrl ? (
                <img
                  src={shopSettings.logoUrl}
                  alt={shopSettings.storeName || 'BESTARI'}
                  className="h-8 max-w-[140px] object-contain rounded p-0.5"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shadow-2xs group-hover:scale-105 transition-all ${
                      isScrolled
                        ? 'bg-white/15 text-[#E3B84B]'
                        : 'bg-[#E8F5E9] dark:bg-[#152718] text-[#3A8F4B] dark:text-[#65B86B]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl sm:text-2xl">
                      eco
                    </span>
                  </div>
                  <div>
                    <span
                      className={`font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-black tracking-tight uppercase block leading-none transition-colors ${
                        isScrolled
                          ? 'text-white'
                          : 'text-[#1F5132] dark:text-[#F4F8F3]'
                      }`}
                    >
                      {shopSettings.storeName ? shopSettings.storeName.split(' ')[0] : 'BESTARI'}
                    </span>
                    <span
                      className={`font-['Plus_Jakarta_Sans'] text-[9px] sm:text-[10px] font-bold tracking-widest uppercase block mt-0.5 transition-colors ${
                        isScrolled
                          ? 'text-[#E3B84B]'
                          : 'text-[#3A8F4B] dark:text-[#65B86B]'
                      }`}
                    >
                      SORGUM E-CATALOG
                    </span>
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`font-['Plus_Jakarta_Sans'] text-xs sm:text-sm tracking-normal focus:outline-none transition-colors duration-200 cursor-pointer ${
                    isScrolled
                      ? isActive
                        ? 'text-[#E3B84B] font-bold'
                        : 'text-white/85 hover:text-[#E3B84B] font-medium'
                      : isActive
                        ? 'text-[#3A8F4B] dark:text-[#65B86B] font-bold'
                        : 'text-[#20352A] dark:text-[#CBD5C8] hover:text-[#3A8F4B] dark:hover:text-[#65B86B] font-medium'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Language & Theme Switcher */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs ${
                isScrolled
                  ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  : 'bg-white dark:bg-[#152718] text-[#1F5132] dark:text-[#65B86B] border border-[#E8F5E9] dark:border-[rgba(165,214,167,0.2)] hover:border-[#3A8F4B]/40'
              }`}
              title={theme === 'light' ? t('Mode Gelap', 'Dark Mode') : t('Mode Terang', 'Light Mode')}
            >
              <span className="material-symbols-outlined text-base sm:text-lg">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className={`h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-full flex items-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs ${
                isScrolled
                  ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  : 'bg-white dark:bg-[#152718] text-[#1F5132] dark:text-[#65B86B] border border-[#E8F5E9] dark:border-[rgba(165,214,167,0.2)] hover:border-[#3A8F4B]/40'
              }`}
              title={language === 'id' ? 'Switch to English' : 'Ubah ke Bahasa Indonesia'}
            >
              <span className="material-symbols-outlined text-sm sm:text-base">language</span>
              <span className="text-[11px] font-bold font-['Plus_Jakarta_Sans'] uppercase">
                {language}
              </span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isScrolled
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white dark:bg-[#152718] text-[#1F5132] dark:text-[#65B86B] border border-[#E8F5E9] dark:border-[rgba(165,214,167,0.2)]'
              }`}
              aria-label="Toggle Menu"
            >
              <span className="material-symbols-outlined text-lg">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden border-b shadow-xl px-5 py-3 flex flex-col gap-2 animate-slideUp transition-colors ${
            isScrolled
              ? 'bg-[#1F5132] dark:bg-[#070D08] border-[#3A8F4B]/30 text-white'
              : 'bg-white dark:bg-[#101A12] border-[#E2EAE0] dark:border-[rgba(165,214,167,0.15)]'
          }`}
        >
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left font-['Plus_Jakarta_Sans'] text-xs font-bold py-2 px-3 rounded-lg transition-all cursor-pointer ${
                  isScrolled
                    ? isActive
                      ? 'bg-white/15 text-[#E3B84B]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                    : isActive
                      ? 'bg-[#EAF4E8] text-[#245B3A] dark:bg-[#1B3521] dark:text-[#A5D6A7]'
                      : 'text-[#44483F] hover:bg-[#F7F5EF] dark:text-[#C4CDC1] dark:hover:bg-[#162419]'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      )}

    </header>
  );
};

export default Header;
