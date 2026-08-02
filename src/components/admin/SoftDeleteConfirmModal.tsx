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
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-[#c4c8bc] p-6 text-center space-y-4">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
            isAlreadyDeleted ? 'bg-[#d2eabb]/30 text-[#162809]' : 'bg-amber-100 text-amber-700'
          }`}
        >
          <span className="material-symbols-outlined text-2xl">
            {isAlreadyDeleted ? 'restore_from_trash' : 'archive'}
          </span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-[#1d1b17] font-['Playfair_Display']">
            {isAlreadyDeleted ? 'Pulihkan Akun Pengguna?' : 'Konfirmasi Soft Delete'}
          </h3>
          <p className="text-xs text-[#555] mt-1">
            Pengguna: <strong className="text-[#1d1b17]">{user.name}</strong> ({user.email})
          </p>
        </div>

        {/* Informational Callout */}
        <div className="bg-[#f9f8f6] p-3.5 rounded-xl border border-[#c4c8bc]/60 text-left text-xs text-[#44483f] space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-[#162809]">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>Prinsip Soft Delete:</span>
          </div>
          <p className="leading-relaxed">
            {isAlreadyDeleted
              ? 'Pengguna ini saat ini berstatus Nonaktif (Soft Deleted). Memulihkan akan mengembalikan status menjadi AKTIF kembali.'
              : 'Soft Delete menonaktifkan akun user tanpa menghapus data pesanan atau alamat dari database secara permanen.'}
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 text-xs font-bold text-[#44483f] bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
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
              className="w-1/2 py-2.5 text-xs font-bold text-white bg-[#162809] hover:bg-[#233e0e] rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">restore</span>
              Pulihkan User
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onConfirmSoftDelete(user.id);
                onClose();
              }}
              className="w-1/2 py-2.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">archive</span>
              Soft Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
