import React from 'react';
import { Order } from '../../types';

interface OrderDeleteConfirmModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirmDelete: (id: string) => void;
}

export const OrderDeleteConfirmModal: React.FC<OrderDeleteConfirmModalProps> = ({
  isOpen,
  order,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !order) return null;

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
              Konfirmasi Hapus Transaksi
            </h3>
            <p className="text-xs text-red-700">
              Apakah Anda yakin ingin menghapus catatan transaksi ini secara permanen?
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="p-4 bg-[#fdfbf7] rounded-xl border border-[#c4c8bc]/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#162809] text-white rounded-md font-mono">
                {order.orderNumber || order.id}
              </span>
              <span className="text-xs text-[#44483f] font-medium">
                {order.createdAt}
              </span>
            </div>
            
            <div className="border-t border-[#c4c8bc]/30 pt-2 space-y-1">
              <p className="text-xs text-[#44483f]">Pelanggan:</p>
              <h4 className="font-bold text-sm text-[#1d1b17]">
                {order.customerName || 'Pelanggan Sorgum'}
              </h4>
              <p className="text-xs text-[#44483f] font-mono">{order.customerPhone}</p>
            </div>

            <div className="border-t border-[#c4c8bc]/30 pt-2 flex justify-between items-center">
              <span className="text-xs text-[#44483f]">Total Bayar:</span>
              <span className="font-bold text-sm text-[#162809] font-mono">
                Rp {order.totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500 italic">
            * Tindakan ini tidak dapat dibatalkan. Catatan transaksi ini akan dihapus permanen dari riwayat laporan admin.
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
              onConfirmDelete(order.id);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            Ya, Hapus Transaksi Ini
          </button>
        </div>
      </div>
    </div>
  );
};
