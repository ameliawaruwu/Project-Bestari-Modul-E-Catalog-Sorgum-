import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';

interface AdminHeaderProps {
  user: User | null;
  onToggleSidebar: () => void;
  onNavigateHome: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  user,
  onToggleSidebar,
  onNavigateHome,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/50 px-6 py-3 flex justify-between items-center shadow-2xs">
        {/* Mobile Drawer Hamburger Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 text-[#162809] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          title="Buka Menu"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>

        {/* Profile Dropdown Container */}
        <div ref={dropdownRef} className="relative ml-auto flex items-center">
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-3 cursor-pointer group select-none hover:opacity-85 transition-opacity"
            title="Menu Profil"
          >
            {/* Profile Label */}
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#1d1b17]">
                {user?.name || 'Administrator Bestari'}
              </p>
              <p className="text-[9px] font-extrabold text-amber-700 uppercase tracking-widest mt-0.5">
                Administrator
              </p>
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center">
              <span className="material-symbols-outlined text-[#162809] text-3xl group-active:opacity-70 transition-opacity">
                account_circle
              </span>
            </div>
          </div>

          {/* Dropdown Menu Box */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-md py-1.5 z-50 animate-fadeIn text-xs text-[#1d1b17]">
              <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                <p className="font-bold text-[#1d1b17] truncate">{user?.name || 'Administrator Bestari'}</p>
                <p className="text-[10px] text-gray-500 font-medium">Administrator</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(true);
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
              >
                <span className="material-symbols-outlined text-base text-gray-500">person</span>
                <span>Lihat Profil</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigateHome();
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer font-semibold"
              >
                <span className="material-symbols-outlined text-base text-gray-500">storefront</span>
                <span>Halaman Utama (Katalog)</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Profile Details Modal Dialog */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[110] animate-fadeIn p-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 max-w-sm w-full p-6 shadow-xl space-y-5 text-center relative">
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title="Tutup"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Avatar Header */}
            <div className="mx-auto w-16 h-16 rounded-full bg-[#162809]/10 flex items-center justify-center text-[#162809]">
              <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-lg text-[#1d1b17]">
                {user?.name || 'Administrator Bestari'}
              </h3>
              <p className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full inline-block uppercase tracking-wider">
                Administrator
              </p>
            </div>

            {/* Profile Fields List */}
            <div className="text-left bg-gray-50 p-4 rounded-xl border border-slate-200/50 space-y-3 text-xs">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Nama Akun</p>
                <p className="font-semibold text-gray-700">{user?.name || 'Administrator Bestari'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">No. WhatsApp</p>
                <p className="font-semibold text-gray-700">{user?.whatsapp || '+62 812-3456-7890'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Hak Akses</p>
                <p className="font-semibold text-gray-700">Super Admin Console</p>
              </div>
            </div>

            {/* Close Action Button */}
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="w-full py-2 bg-[#162809] hover:opacity-90 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </>
  );
};
