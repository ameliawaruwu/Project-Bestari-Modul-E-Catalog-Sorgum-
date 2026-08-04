import React from 'react';
import { User } from '../types';
import { useApp } from '../context/AppContext';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  user?: User | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  user,
}) => {
  const { t } = useApp();
  const navItems = [
    ...(user?.role === 'admin'
      ? [{ id: 'admin', label: t('Admin', 'Admin'), icon: 'admin_panel_settings' }]
      : [
          { id: 'beranda', label: t('Beranda', 'Home'), icon: 'home' },
          { id: 'produk', label: t('Produk', 'Products'), icon: 'storefront' },
          { id: 'informasi', label: t('Informasi', 'Info'), icon: 'article' },
          { id: 'faq', label: t('FAQ', 'FAQ'), icon: 'help_outline' },
        ]),
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#2b3e1d] text-white border-t border-[#c4c8bc]/20 shadow-2xl px-2 py-1.5 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
              isActive ? 'text-[#fde08b]' : 'text-white/70 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-full ${isActive ? 'bg-[#162809]' : ''}`}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
            </div>
            <span className={`text-[11px] font-['Plus_Jakarta_Sans'] ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Cart Item in Bottom Nav — hidden untuk admin */}
      {user?.role !== 'admin' && (
        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center justify-center py-1 px-3 rounded-xl text-white/70 hover:text-white transition-all active:scale-95 cursor-pointer"
        >
          <div className="p-1 rounded-full relative">
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#715c13] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-['Plus_Jakarta_Sans'] font-medium">{t('Troli', 'Cart')}</span>
        </button>
      )}
    </div>
  );
};

