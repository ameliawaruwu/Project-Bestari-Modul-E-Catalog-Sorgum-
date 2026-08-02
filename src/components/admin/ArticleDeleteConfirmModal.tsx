import React from 'react';
import { ArticleItem } from '../../types/admin';

interface ArticleDeleteConfirmModalProps {
  isOpen: boolean;
  article: ArticleItem | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
}

export const ArticleDeleteConfirmModal: React.FC<ArticleDeleteConfirmModalProps> = ({
  isOpen,
  article,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#c4c8bc] overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 p-5 border-b border-red-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">delete_forever</span>
          </div>
          <div>
            <h3 className="font-['Playfair_Display'] text-lg font-bold text-red-900">
              Konfirmasi Hapus Artikel
            </h3>
            <p className="text-xs text-red-700">
              Apakah Anda yakin ingin menghapus artikel informasi ini secara permanen?
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-[#fdfbf7] rounded-xl border border-[#c4c8bc]/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#d2eabb] text-[#162809] rounded-md font-mono">
                {article.category}
              </span>
              <span className="text-[11px] text-[#44483f]/80">
                {article.date}
              </span>
            </div>
            
            <h4 className="font-bold text-sm text-[#1d1b17]">
              {article.title}
            </h4>
            
            <p className="text-xs text-[#44483f]">
              Ditulis oleh: <span className="font-semibold text-[#1d1b17]">{article.author}</span>
            </p>
          </div>

          <p className="text-xs text-gray-500 italic">
            * Tindakan ini tidak dapat dibatalkan. Artikel ini akan dihapus secara permanen dari basis data dan tidak akan lagi muncul di halaman artikel edukasi publik.
          </p>
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-[#f9f8f6] border-t border-[#c4c8bc]/60 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#c4c8bc] bg-white text-[#44483f] font-bold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(article.id);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            Ya, Hapus Artikel Ini
          </button>
        </div>
      </div>
    </div>
  );
};
