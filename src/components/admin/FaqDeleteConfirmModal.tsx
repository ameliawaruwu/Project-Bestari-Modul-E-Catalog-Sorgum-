import React from 'react';
import { FAQItem } from '../../types/admin';

interface FaqDeleteConfirmModalProps {
  isOpen: boolean;
  faq: FAQItem | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
}

export const FaqDeleteConfirmModal: React.FC<FaqDeleteConfirmModalProps> = ({
  isOpen,
  faq,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !faq) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[#FFFFFF] rounded-2xl shadow-2xl border border-[#E0E0E0] overflow-hidden p-6 text-center space-y-4">
        {/* Gambar Icon Tong Sampah di Tengah */}
        <div className="w-16 h-16 rounded-full bg-[#FFEBEE] text-[#D32F2F] flex items-center justify-center mx-auto shadow-2xs">
          <span className="material-symbols-outlined text-3xl">delete_forever</span>
        </div>

        {/* Teks Judul & Pesan */}
        <div className="space-y-1">
          <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1B5E20]">
            Hapus FAQ ini?
          </h3>
          <p className="text-xs text-[#555555]">
            FAQ akan dihapus secara permanen dari daftar.
          </p>
        </div>

        {/* Pilihan Tombol Batal & Ya di Bawah */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] text-[#555555] font-bold text-xs hover:bg-[#F7F8F6] transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(faq.id);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-[#C62828] text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            Ya
          </button>
        </div>
      </div>
    </div>
  );
};
