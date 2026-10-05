import React from 'react';
import { Product } from '../../types';

interface ProductDeleteConfirmModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
}

export const ProductDeleteConfirmModal: React.FC<ProductDeleteConfirmModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xs bg-[#FFFFFF] rounded-xl shadow-xl border border-[#E0E0E0] overflow-hidden p-5 text-center space-y-3.5">
        {/* Gambar Icon Tong Sampah di Tengah */}
        <div className="w-12 h-12 rounded-full bg-[#FFEBEE] text-[#D32F2F] flex items-center justify-center mx-auto shadow-2xs">
          <span className="material-symbols-outlined text-2xl">delete_forever</span>
        </div>

        {/* Teks Judul & Pesan */}
        <div className="space-y-1">
          <h3 className="font-['Playfair_Display'] text-base font-bold text-[#1B5E20]">
            Hapus produk ini?
          </h3>
          <p className="text-xs text-[#555555]">
            Produk akan dihapus secara permanen dari katalog.
          </p>
        </div>

        {/* Pilihan Tombol Batal & Ya di Bawah */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-[#E0E0E0] bg-[#FFFFFF] text-[#555555] font-bold text-xs hover:bg-[#F7F8F6] transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(product.id);
              onClose();
            }}
            className="flex-1 py-2 rounded-lg bg-[#D32F2F] hover:bg-[#C62828] text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            Ya
          </button>
        </div>
      </div>
    </div>
  );
};
