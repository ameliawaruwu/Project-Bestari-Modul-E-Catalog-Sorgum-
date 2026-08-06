import React from 'react';
import { AdminUser } from '../../types/admin';

interface SoftDeleteConfirmModalProps {
  isOpen: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onConfirmSoftDelete: (userId: string) => void;
  onConfirmRestore: (userId: string) => void;
}

export const SoftDeleteConfirmModal: React.FC<SoftDeleteConfirmModalProps> = ({
  isOpen,
  user,
  onClose,
  onConfirmSoftDelete,
  onConfirmRestore,
}) => {
  if (!isOpen || !user) return null;

  const isAlreadyDeleted = user.isDeleted || user.status === 'NONAKTIF';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn backdrop-blur-xs">
      <div className="bg-[#FFFFFF] rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-[#E0E0E0] p-6 text-center space-y-4">
        {/* Gambar Icon di Tengah */}
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-2xs ${
            isAlreadyDeleted ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFEBEE] text-[#D32F2F]'
          }`}
        >
          <span className="material-symbols-outlined text-3xl">
            {isAlreadyDeleted ? 'restore_from_trash' : 'delete_forever'}
          </span>
        </div>

        {/* Judul & Pesan */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-[#1B5E20] font-['Playfair_Display']">
            {isAlreadyDeleted ? 'Pulihkan user ini?' : 'Hapus user ini?'}
          </h3>
          <p className="text-xs text-[#555555]">
            {isAlreadyDeleted
              ? 'Akses user akan diaktifkan kembali di sistem.'
              : 'User akan dinonaktifkan dari sistem.'}
          </p>
        </div>

        {/* Pilihan Tombol Batal & Ya di Bawah */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-xs font-bold text-[#555555] bg-[#FFFFFF] border border-[#E0E0E0] hover:bg-[#F7F8F6] rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>

          {isAlreadyDeleted ? (
            <button
              type="button"
              onClick={() => {
                onConfirmRestore(user.id);
                onClose();
              }}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              Ya
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onConfirmSoftDelete(user.id);
                onClose();
              }}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-[#D32F2F] hover:bg-[#C62828] rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              Ya
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
