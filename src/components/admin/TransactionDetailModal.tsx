import React from 'react';
import { Order } from '../../types';

interface TransactionDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onOpenProofModal: (url: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  order,
  onClose,
  onOpenProofModal,
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#c4c8bc] shadow-2xl p-6 relative animate-fadeIn">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#44483f] hover:text-[#1d1b17] p-1.5 rounded-full hover:bg-[#f3ede6] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="border-b border-[#c4c8bc] pb-4 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#2b3e1d] px-3 py-1 rounded-full">
            Rincian Transaksi
          </span>
          <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[#1d1b17] mt-2">
            Pesanan {order.id}
          </h3>
          <p className="text-xs text-[#44483f]">Dibuat pada {order.createdAt}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#f9f3ec] p-4 rounded-xl border border-[#c4c8bc]">
            <h4 className="text-xs font-bold uppercase text-[#44483f] mb-2">Informasi Pembeli</h4>
            <p className="font-bold text-sm text-[#1d1b17]">{order.customerName}</p>
            <p className="text-xs text-[#44483f] mt-1">📞 {order.customerPhone}</p>
            <p className="text-xs text-[#44483f]">✉️ {order.customerEmail}</p>
          </div>

          <div className="bg-[#f9f3ec] p-4 rounded-xl border border-[#c4c8bc]">
            <h4 className="text-xs font-bold uppercase text-[#44483f] mb-2">Alamat Pengiriman</h4>
            <p className="text-xs text-[#1d1b17] leading-relaxed">{order.shippingAddress}</p>
            <div className="mt-2 pt-2 border-t border-[#c4c8bc]/50 flex justify-between items-center text-xs">
              <span className="font-medium text-[#44483f]">Metode Bayar:</span>
              <span className="font-bold text-[#162809] uppercase">{order.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase text-[#44483f] mb-3">Produk Dipesan</h4>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#c4c8bc]"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-lg object-cover border border-[#c4c8bc]"
                  />
                  <div>
                    <p className="font-bold text-xs text-[#1d1b17]">{item.product.name}</p>
                    <p className="text-[11px] text-[#44483f]">{item.product.unitInfo}</p>
                    <p className="text-xs font-mono text-[#2b3e1d] mt-0.5">
                      Rp {item.product.price.toLocaleString('id-ID')} x {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="font-bold font-mono text-sm text-[#162809]">
                  Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Proof of Payment if exists */}
        {order.paymentProofUrl && (
          <div className="mb-6 p-4 bg-[#f9f3ec] rounded-xl border border-[#c4c8bc]">
            <h4 className="text-xs font-bold uppercase text-[#44483f] mb-2">
              Bukti Pembayaran QRIS
            </h4>
            <div className="flex items-center gap-4">
              <img
                src={order.paymentProofUrl}
                alt="Bukti Transfer"
                className="w-20 h-20 rounded-lg object-cover border border-[#c4c8bc] cursor-pointer"
                onClick={() => onOpenProofModal(order.paymentProofUrl!)}
              />
              <div>
                <p className="text-xs font-semibold text-[#1d1b17]">Status: Terlampir</p>
                <button
                  type="button"
                  onClick={() => onOpenProofModal(order.paymentProofUrl!)}
                  className="mt-2 text-xs font-bold text-[#2b3e1d] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">zoom_in</span>
                  <span>Perbesar Bukti Transfer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Total and Actions */}
        <div className="flex items-center justify-between border-t border-[#c4c8bc] pt-4">
          <div>
            <p className="text-xs text-[#44483f]">Total Tagihan:</p>
            <p className="text-xl font-extrabold font-mono text-[#162809]">
              Rp {order.totalAmount.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-[#c4c8bc] font-bold text-xs hover:bg-[#f3ede6] transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
