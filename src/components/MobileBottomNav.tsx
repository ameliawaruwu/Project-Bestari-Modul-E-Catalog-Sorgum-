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
    { id: 'informasi', label: t('Artikel', 'Articles'), icon: 'article' },
    { id: 'faq', label: t('FAQ', 'FAQ'), icon: 'quiz' },
    { id: 'tracking', label: t('Lacak', 'Track'), icon: 'local_shipping' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0E1A11]/95 backdrop-blur-md text-[#20352A] dark:text-[#F4F8F3] border-t border-[#E2EFE0] dark:border-white/10 shadow-2xl px-1.5 py-1.5 flex justify-around items-center">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
              isActive 
                ? 'text-[#1F5132] dark:text-[#86EFAC]' 
                : 'text-[#6B756D] dark:text-white/60 hover:text-[#1F5132] dark:hover:text-white'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              isActive 
                ? 'bg-[#EAF6E8] dark:bg-[#152718] text-[#1F5132] dark:text-[#86EFAC] shadow-2xs' 
                : ''
            }`}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
            </div>
            <span className={`text-[10px] sm:text-[11px] font-['Plus_Jakarta_Sans'] mt-0.5 ${isActive ? 'font-black text-[#1F5132] dark:text-[#86EFAC]' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};


