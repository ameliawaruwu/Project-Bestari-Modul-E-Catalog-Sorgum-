import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  user: User | null;
  onNavigateAuth: (mode: 'login' | 'register') => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onLogout?: () => void;
  alwaysSolid?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  user,
  onNavigateAuth,
  onLogout,
  alwaysSolid = false,
}) => {
  const { language, theme, toggleLanguage, toggleTheme, t, shopSettings } = useApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown profil saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
          ? 'bg-[#2b3e1d] shadow-md border-b border-[#c4c8bc]/10'
          : 'bg-transparent shadow-none'
      }`}
    >
      <div className="flex items-center shrink-0">
        <button
          onClick={() => setActiveTab(user?.role === 'admin' ? 'admin' : 'beranda')}
          className="text-left flex items-center gap-2.5 focus:outline-none hover:opacity-90 transition-opacity cursor-pointer"
        >
          {shopSettings.logoUrl ? (
            <img
              src={shopSettings.logoUrl}
              alt={shopSettings.storeName || 'BESTARI'}
              className="h-8 max-w-[140px] object-contain rounded bg-white/10 p-0.5"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="font-['Roboto'] text-xl lg:text-2xl font-bold tracking-tight text-white">
              {shopSettings.storeName ? shopSettings.storeName.split(' ')[0] : 'BESTARI'}
            </span>
          )}
        </button>
      </div>

      {user?.role !== 'admin' && (
        <nav className="hidden md:flex items-center gap-4 lg:gap-8 absolute left-1/2 -translate-x-1/2">
        <button
          onClick={() => setActiveTab('beranda')}
          className={`font-['Plus_Jakarta_Sans'] text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all duration-200 py-1 focus:outline-none border-b-2 ${
            activeTab === 'beranda'
              ? 'text-[#fade88] font-bold border-[#fade88]'
              : 'text-white/80 hover:text-white border-transparent'
          }`}
        >
          {t('Beranda', 'Home')}
        </button>
        <button
          onClick={() => setActiveTab('produk')}
          className={`font-['Plus_Jakarta_Sans'] text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all duration-200 py-1 focus:outline-none border-b-2 ${
            activeTab === 'produk'
              ? 'text-[#fade88] font-bold border-[#fade88]'
              : 'text-white/80 hover:text-white border-transparent'
          }`}
        >
          {t('Produk', 'Products')}
        </button>
        <button
          onClick={() => setActiveTab('informasi')}
          className={`font-['Plus_Jakarta_Sans'] text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all duration-200 py-1 focus:outline-none border-b-2 ${
            activeTab === 'informasi'
              ? 'text-[#fade88] font-bold border-[#fade88]'
              : 'text-white/80 hover:text-white border-transparent'
          }`}
        >
          {t('Informasi', 'Information')}
        </button>
        <button
          onClick={() => setActiveTab('faq')}
          className={`font-['Plus_Jakarta_Sans'] text-xs sm:text-sm uppercase tracking-wider font-semibold transition-all duration-200 py-1 focus:outline-none border-b-2 ${
            activeTab === 'faq'
              ? 'text-[#fade88] font-bold border-[#fade88]'
              : 'text-white/80 hover:text-white border-transparent'
          }`}
        >
          {t('FAQ', 'FAQ')}
        </button>

      </nav>
      )}

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Theme Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="p-1.5 hover:bg-[#162809] rounded-lg transition-all active:scale-95 flex items-center justify-center focus:outline-none cursor-pointer"
          title={theme === 'light' ? t('Mode Gelap', 'Dark Mode') : t('Mode Terang', 'Light Mode')}
        >
          <span className="material-symbols-outlined text-white text-lg sm:text-xl">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="p-1.5 hover:bg-[#162809] rounded-lg transition-all active:scale-95 flex items-center justify-center focus:outline-none gap-0.5 cursor-pointer"
          title={language === 'id' ? 'Switch to English' : 'Ubah ke Bahasa Indonesia'}
        >
          <span className="material-symbols-outlined text-white text-lg sm:text-xl">language</span>
          <span className="hidden lg:inline text-[10px] font-bold font-['Plus_Jakarta_Sans'] uppercase tracking-wider">
            {language}
          </span>
        </button>

        {/* Shopping Cart Button — hanya untuk user yang LOGIN & bukan admin */}
        {user && user.role !== 'admin' && (
          <button
            onClick={onOpenCart}
            className="relative p-2 hover:bg-[#162809] rounded-lg transition-all active:scale-95 focus:outline-none cursor-pointer"
            aria-label={t('Keranjang Belanja', 'Shopping Cart')}
          >
            <span className="material-symbols-outlined text-white text-lg sm:text-xl">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-[#715c13] text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        )}

        {/* User Account / Auth */}
        <div className="relative" ref={userMenuRef}>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-1.5 hover:bg-[#162809] rounded-lg transition-all active:scale-95 flex items-center justify-center focus:outline-none cursor-pointer"
                aria-label={t('Profil Pengguna', 'User Profile')}
              >
                <span className="material-symbols-outlined text-white text-lg sm:text-xl">account_circle</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-[#fff8f2] text-[#1d1b17] rounded-xl shadow-xl border border-[#c4c8bc]/30 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-[#c4c8bc]/20">
                    <p className="font-bold text-sm truncate">
                      <span>{user.name}</span>
                    </p>
                    <p className="text-xs text-[#44483f] truncate">{user.email}</p>
                  </div>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setActiveTab('admin');
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3ede6] text-[#162809] flex items-center gap-2 font-bold cursor-pointer transition-colors border-b border-[#c4c8bc]/20"
                    >
                      <span className="material-symbols-outlined text-lg text-[#162809]">admin_panel_settings</span>
                      {t('Halaman Admin', 'Admin Panel')}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setActiveTab('profil');
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3ede6] flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">person</span>
                    {t('Profil Saya', 'My Profile')}
                  </button>
                  {user.role !== 'admin' && (
                    <>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('pesanan');
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3ede6] flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">history</span>
                        {t('Pesanan Saya', 'My Orders')}
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('favorit');
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3ede6] flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">favorite</span>
                        {t('Produk Favorit', 'Favorite Products')}
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('pengaturan');
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3ede6] flex items-center gap-2 border-b border-[#c4c8bc]/20 pb-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">settings</span>
                        {t('Pengaturan Akun', 'Account Settings')}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-[#ffdad6] flex items-center gap-2 pt-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    {t('Keluar', 'Logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigateAuth('login')}
              className="px-4 py-1.5 border border-white/30 text-white hover:bg-[#fade88] hover:text-[#162809] hover:border-transparent rounded-lg transition-all active:scale-95 focus:outline-none font-['Plus_Jakarta_Sans'] text-xs font-bold uppercase tracking-wider cursor-pointer shadow-3xs"
            >
              {t('Masuk', 'Login')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
