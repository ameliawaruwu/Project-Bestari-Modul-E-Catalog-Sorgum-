import React from 'react';

interface ProfileSettingsSectionProps {
  onLogout: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

/**
 * TAB "Pengaturan Akun" — privasi & data (hapus akun).
 */
export const ProfileSettingsSection: React.FC<ProfileSettingsSectionProps> = ({
  onLogout,
  showToast,
}) => {
  return (
<div className="space-y-6 animate-fadeIn">
  {/* Privasi & Data */}
  <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#E0E0E0] shadow-2xs max-w-xl space-y-4">
    <div className="flex items-center gap-3 mb-2 pb-4 border-b border-[#E0E0E0]">
      <span className="material-symbols-outlined text-2xl text-[#1B5E20]">
        visibility
      </span>
      <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1B5E20]">
        Privasi & Data
      </h3>
    </div>

    <div className="bg-[#FFEBEE] rounded-2xl p-5 border border-[#D32F2F]/20 flex items-center justify-between">
      <span className="text-xs font-bold text-[#D32F2F]">Hapus Akun Permanen</span>
      <button
        onClick={() => {
          if (confirm('Apakah Anda yakin ingin menghapus akun secara permanen?')) {
            onLogout();
            showToast('Akun telah dihapus.');
          }
        }}
        className="p-2 bg-[#D32F2F] text-white hover:bg-[#B71C1C] rounded-xl transition-colors cursor-pointer"
        title="Hapus Akun"
      >
        <span className="material-symbols-outlined text-lg">delete_forever</span>
      </button>
    </div>
  </div>
</div>

  );
};
