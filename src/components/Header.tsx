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
  searchQuery = '',
  setSearchQuery,
}) => {
  const { language, theme, toggleLanguage, toggleTheme, t, shopSettings } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  // Draft pencarian di header (mobile). Commit saat Enter / tombol cari,
  // supaya tidak memicu filter tiap ketikan.
  const [draftSearch, setDraftSearch] = useState(searchQuery);

  useEffect(() => {
    setDraftSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 20;
          setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'beranda', label: t('Beranda', 'Home') },
    { id: 'produk', label: t('Produk', 'Products') },
    { id: 'informasi', label: t('Artikel', 'Articles') },
    { id: 'tracking', label: t('Lacak Pesanan', 'Track Order') },
  ];

  // Pencarian dari header mobile: commit nilai draft lalu arahkan ke tab Produk
  // (di sana daftar produk memakai searchQuery yang sama → hasil konsisten).
  const submitSearch = (value: string) => {
    const q = value.trim();
    if (setSearchQuery) setSearchQuery(q);
    if (q) {
      setActiveTab('produk');
    }
  };

  return (
    <header id="main-header" className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* ── Dynamic Navigation Bar (White at top, Evergreen when scrolled) ── */}
      <div
        className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 transition-all duration-300 backdrop-blur-md ${
          isScrolled
            ? 'bg-[#1F5132]/95 dark:bg-[#070D08]/95 text-white border-b border-[#3A8F4B]/30 shadow-sm'
            : 'bg-white/95 dark:bg-[#0B1A10]/95 text-[#20352A] dark:text-[#F4F8F3] border-b border-[#E8F5E9] dark:border-[rgba(165,214,167,0.15)] shadow-2xs'
        }`}
      >
        <div className="max-w-[1140px] mx-auto flex items-center justify-between">
          
          {/* Brand Logo (Green Leaves + KWT SORGUM) */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => setActiveTab('beranda')}
              className="text-left flex items-center gap-2 focus:outline-none hover:opacity-90 transition-opacity cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center overflow-hidden shadow-2xs group-hover:scale-105 transition-all ${
                    isScrolled ? 'bg-white/15' : 'bg-[#E8F5E9] dark:bg-[#152718]'
                  }`}
                >
                  <img
                    src={shopSettings.logoUrl || '/favicon-spa2.svg'}
                    alt={shopSettings.storeName || 'Logo toko'}
                    className="w-full h-full object-contain p-0.5"
                  />
                </div>
                <div>
                  <span
                    className={`font-['Plus_Jakarta_Sans'] text-sm sm:text-base font-black tracking-tight uppercase block leading-none transition-colors ${
                      isScrolled
                        ? 'text-white'
                        : 'text-[#1F5132] dark:text-[#F4F8F3]'
                    }`}
                  >
                    {shopSettings.storeName ? shopSettings.storeName.split(' ')[0] : 'KWT'}
                  </span>
                  <span className="font-['Plus_Jakarta_Sans'] text-[8px] sm:text-[9px] font-bold tracking-widest uppercase block mt-0.5 text-[#E3B84B]">
                    SORGUM E-CATALOG
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-bold tracking-normal focus:outline-none transition-colors duration-200 cursor-pointer ${
                    isScrolled
                      ? isActive
                        ? 'text-[#E3B84B]'
                        : 'text-white/85 hover:text-[#E3B84B]'
                      : isActive
                        ? 'text-[#3A8F4B] dark:text-[#65B86B]'
                        : 'text-[#20352A] dark:text-[#CBD5C8] hover:text-[#3A8F4B] dark:hover:text-[#65B86B]'
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
              className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs ${
                isScrolled
                  ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  : 'bg-white dark:bg-[#152718] text-[#1F5132] dark:text-[#65B86B] border border-[#E8F5E9] dark:border-[rgba(165,214,167,0.2)] hover:border-[#3A8F4B]/40'
              }`}
              title={theme === 'light' ? t('Mode Gelap', 'Dark Mode') : t('Mode Terang', 'Light Mode')}
            >
              <span className="material-symbols-outlined text-sm sm:text-base">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className={`h-7.5 sm:h-8 px-2 sm:px-2.5 rounded-full flex items-center gap-1 transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs ${
                isScrolled
                  ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                  : 'bg-white dark:bg-[#152718] text-[#1F5132] dark:text-[#65B86B] border border-[#E8F5E9] dark:border-[rgba(165,214,167,0.2)] hover:border-[#3A8F4B]/40'
              }`}
              title={language === 'id' ? 'Switch to English' : 'Ubah ke Bahasa Indonesia'}
            >
              <span className="material-symbols-outlined text-xs sm:text-sm">language</span>
              <span className="text-[10px] font-bold font-['Plus_Jakarta_Sans'] uppercase">
                {language}
              </span>
            </button>

          </div>

        </div>

        {/* ── Mobile Search Row (≤767px) ── */}
        <div className="md:hidden max-w-[1140px] mx-auto mt-1.5">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm select-none text-[#6B756E] dark:text-[#94A390]">
              search
            </span>
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitSearch(draftSearch);
              }}
              placeholder={t('Cari produk atau kategori...', 'Search product or category...')}
              aria-label={t('Cari produk', 'Search products')}
              className={`w-full pl-8 pr-8 py-2 rounded-lg border font-['Plus_Jakarta_Sans'] text-xs font-medium transition-all focus:outline-none ${
                isScrolled
                  ? 'bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/15 focus:border-white/40'
                  : 'bg-[#F7F5EF] dark:bg-[#152718] border-[#E8F5E9] dark:border-[rgba(165,214,167,0.2)] text-[#20352A] dark:text-[#F4F8F3] placeholder-[#6B756E]/70 dark:placeholder-[#94A390]/60 focus:bg-white dark:focus:bg-[#1B2C1F] focus:border-[#3A8F4B]'
              }`}
            />
            {draftSearch && (
              <button
                type="button"
                onClick={() => {
                  setDraftSearch('');
                  submitSearch('');
                }}
                aria-label={t('Hapus pencarian', 'Clear search')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-[#6B756E] dark:text-[#94A390] hover:text-[#1F5132] dark:hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown menu mobile DIHAPUS — di HP navigasi sudah lewat
          MobileBottomNav (4 menu yang sama), jadi ini duplikat. */}

    </header>
  );
};

export default Header;
