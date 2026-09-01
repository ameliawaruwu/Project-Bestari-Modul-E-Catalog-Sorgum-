import React from 'react';
import { useApp } from '../context/AppContext';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user?: unknown | null;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { t } = useApp();
  const navItems = [
    { id: 'beranda', label: t('Beranda', 'Home'), icon: 'home' },
    { id: 'produk', label: t('Produk', 'Products'), icon: 'storefront' },
    { id: 'tracking', label: t('Lacak', 'Track'), icon: 'local_shipping' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1B5E20] text-white border-t border-[#A5D6A7]/20 shadow-2xl px-2 py-1.5 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
              isActive ? 'text-[#C89B3C]' : 'text-white/70 hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-full ${isActive ? 'bg-[#2E7D32]' : ''}`}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
            </div>
            <span className={`text-[11px] font-['Plus_Jakarta_Sans'] ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

