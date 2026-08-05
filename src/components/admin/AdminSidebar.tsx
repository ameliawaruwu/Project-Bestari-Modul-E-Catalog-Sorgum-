import React from 'react';
import { AdminActiveNav } from '../../types/admin';

interface AdminSidebarProps {
  activeNav: AdminActiveNav;
  setActiveNav: (nav: AdminActiveNav) => void;
  onLogout?: () => void;
  onNavigateHome: () => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeNav,
  setActiveNav,
  onLogout,
  onNavigateHome,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems: { id: AdminActiveNav; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'landing', label: 'Pengaturan Landing Page', icon: 'web' },
    { id: 'produk', label: 'Kelola Produk', icon: 'inventory_2' },
    { id: 'transaksi', label: 'Kelola Transaksi', icon: 'receipt_long' },
    { id: 'info', label: 'Kelola Info', icon: 'info' },
    { id: 'user', label: 'Kelola User', icon: 'group' },
    { id: 'faq', label: 'Kelola FAQ', icon: 'quiz' },
    { id: 'voucher', label: 'Kelola Voucher', icon: 'confirmation_number' },
    { id: 'lain', label: 'Kelola Lain', icon: 'more_horiz' },
  ];

  return (
    <aside
      className={`h-screen fixed left-0 top-0 bg-white dark:bg-[#1a1815] border-r border-[#c4c8bc]/40 dark:border-white/10 flex flex-col py-4 z-[100] transition-all duration-300 ${
        isCollapsed ? 'lg:w-20' : 'lg:w-64'
      } ${
        isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="px-5 mb-6 flex items-center justify-between min-h-[40px]">
        {isCollapsed ? (
          <div className="mx-auto hidden lg:flex flex-col items-center justify-center gap-2">
            {/* Collapse Toggle Button on Desktop (when collapsed) */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 text-[#75786e] dark:text-[#b8bcb4] hover:text-[#162809] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Buka Menu"
            >
              <span className="material-symbols-outlined text-lg">menu</span>
            </button>
            <span className="font-['Playfair_Display'] text-xl text-[#162809] dark:text-[#fde08b] font-extrabold bg-[#2b3e1d]/10 dark:bg-white/10 w-9 h-9 flex items-center justify-center rounded-xl border border-[#2b3e1d]/20 dark:border-white/15 shadow-2xs">
              B
            </span>
          </div>
        ) : null}

        <div className={isCollapsed ? 'lg:hidden block' : 'block'}>
          <h1 className="font-['Playfair_Display'] text-xl text-[#162809] dark:text-[#fde08b] font-bold tracking-wider">
            BESTARI
          </h1>
          <p className="text-[#715c13] dark:text-[#8a8e86] text-[9px] font-extrabold uppercase tracking-widest mt-0.5">
            Admin Console
          </p>
        </div>

        {/* Collapse Toggle Button on Desktop (when expanded) */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:block p-1 text-[#75786e] dark:text-[#b8bcb4] hover:text-[#162809] dark:hover:text-white hover:bg-[#faf8f5] dark:hover:bg-[#252320] rounded-lg transition-colors cursor-pointer"
            title="Sembunyikan Menu"
          >
            <span className="material-symbols-outlined text-lg">menu_open</span>
          </button>
        )}
        
        {/* Close Button on Mobile Drawer */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1 text-[#75786e] dark:text-[#b8bcb4] hover:text-[#162809] dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Tutup Menu"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <div key={item.id} className="relative w-full flex items-center">
              {/* Gold Indicator Pill on the left edge for active item */}
              {isActive && (
                <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#fade88] rounded-full z-10 shadow-2xs" />
              )}
              <button
                type="button"
                onClick={() => {
                  setActiveNav(item.id);
                  onClose(); // Close mobile drawer
                }}
                className={`w-full flex items-center py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer border group ${
                  isActive
                    ? 'bg-[#2b3e1d] text-white border-[#2b3e1d] font-bold shadow-sm pl-4'
                    : 'text-[#44483f] dark:text-[#b8bcb4] border-transparent hover:bg-[#faf8f5] dark:hover:bg-[#252320] hover:text-[#162809] dark:hover:text-white font-medium'
                } ${
                  isCollapsed
                    ? 'lg:justify-center lg:px-0 px-3.5 justify-start'
                    : 'px-3.5 justify-start'
                }`}
                title={item.label}
              >
                <span className={`material-symbols-outlined text-base flex-shrink-0 ${isActive ? 'text-[#fade88]' : 'text-[#75786e] dark:text-[#8a8e86] group-hover:text-[#162809] dark:group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <span
                  className={`ml-2.5 tracking-wide truncate transition-opacity duration-200 ${
                    isCollapsed ? 'lg:hidden inline' : 'inline'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Logout Bottom */}
      <div className="px-3 pt-3 mt-auto border-t border-[#c4c8bc]/30 dark:border-white/10">
        <button
          type="button"
          onClick={() => {
            if (onLogout) onLogout();
            else onNavigateHome();
            onClose();
          }}
          className={`w-full flex items-center py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all border border-transparent text-xs sm:text-sm font-semibold cursor-pointer ${
            isCollapsed
              ? 'lg:justify-center lg:px-0 px-3.5 justify-start'
              : 'px-3.5 justify-start'
          }`}
          title="Logout"
        >
          <span className="material-symbols-outlined text-base flex-shrink-0">logout</span>
          <span
            className={`ml-2.5 tracking-wide transition-opacity duration-200 ${
              isCollapsed ? 'lg:hidden inline' : 'inline'
            }`}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};
