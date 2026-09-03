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
    { id: 'info', label: 'Kelola Info', icon: 'info' },
    { id: 'faq', label: 'Kelola FAQ', icon: 'quiz' },
    { id: 'lain', label: 'Kelola Lain', icon: 'more_horiz' },
  ];

  return (
    <aside
      className={`h-screen fixed left-0 top-0 bg-[#1F5132] border-r border-white/10 flex flex-col py-3 z-[100] transition-all duration-300 shadow-xl ${
        isCollapsed ? 'lg:w-20' : 'lg:w-64'
      } ${
        isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="px-5 mb-4 flex items-center justify-between min-h-[40px]">
        {isCollapsed ? (
          <div className="mx-auto hidden lg:flex flex-col items-center justify-center gap-2">
            {/* Collapse Toggle Button on Desktop (when collapsed) */}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Buka Menu"
            >
              <span className="material-symbols-outlined text-lg">menu</span>
            </button>
            <span className="font-['Plus_Jakarta_Sans'] text-xl text-[#E3B84B] font-black bg-white/10 w-9 h-9 flex items-center justify-center rounded-xl border border-white/15 shadow-2xs">
              B
            </span>
          </div>
        ) : null}

        <div className={isCollapsed ? 'lg:hidden block' : 'block'}>
          <h1 className="font-['Plus_Jakarta_Sans'] text-xl text-white font-black tracking-wider">
            BESTARI
          </h1>
          <p className="text-[#E3B84B] text-[10px] font-bold uppercase tracking-widest mt-0.5">
            SORGUM ADMIN CONSOLE
          </p>
        </div>

        {/* Collapse Toggle Button on Desktop (when expanded) */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:block p-1 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Sembunyikan Menu"
          >
            <span className="material-symbols-outlined text-lg">menu_open</span>
          </button>
        )}
        
        {/* Close Button on Mobile Drawer */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Tutup Menu"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2.5">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <div key={item.id} className="relative w-full flex items-center px-1">
              <button
                type="button"
                onClick={() => {
                  setActiveNav(item.id);
                  onClose(); // Close mobile drawer
                }}
                className={`group w-full flex items-center py-2.5 text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#163D24] text-white border-l-4 border-l-[#E3B84B] rounded-r-xl rounded-l-xs shadow-md pl-3.5'
                    : 'text-white/75 rounded-xl hover:text-white hover:bg-white/10 pl-3.5'
                } ${
                  isCollapsed
                    ? 'lg:justify-center lg:px-0 justify-start'
                    : 'justify-start'
                }`}
                title={item.label}
              >
                <span
                  className={`material-symbols-outlined text-lg flex-shrink-0 transition-colors ${
                    isActive ? 'text-[#E3B84B]' : 'text-white/70 group-hover:text-[#E3B84B]'
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`ml-2.5 font-bold tracking-wide truncate transition-opacity duration-200 ${
                    isActive ? 'text-white font-extrabold' : 'text-white/80 group-hover:text-white'
                  } ${isCollapsed ? 'lg:hidden inline' : 'inline'}`}
                >
                  {item.label}
                </span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Logout Bottom */}
      <div className="px-3 pt-3 mt-auto border-t border-white/10">
        <button
          type="button"
          onClick={() => {
            if (onLogout) onLogout();
            else onNavigateHome();
            onClose();
          }}
          className={`w-full flex items-center py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-all border border-transparent text-xs sm:text-sm font-medium cursor-pointer ${
            isCollapsed
              ? 'lg:justify-center lg:px-0 px-3.5 justify-start'
              : 'px-3.5 justify-start'
          }`}
          title="Logout"
        >
          <span className="material-symbols-outlined text-base flex-shrink-0">logout</span>
          <span
            className={`ml-2.5 font-bold tracking-wide transition-opacity duration-200 ${
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
