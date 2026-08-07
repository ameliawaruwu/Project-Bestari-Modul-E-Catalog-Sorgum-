import React, { useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { useApp } from '../context/AppContext';
import { orderApi } from '../api/orderApi';

interface CartPageProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onNavigateProducts: () => void;
  onNavigateCheckout: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateProducts,
  onNavigateCheckout,
  onSelectProduct,
}) => {
  const { t, appliedDiscount, setAppliedDiscount, setAppliedVoucherCode } = useApp();
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    cart.map((item) => item.product.id)
  );
  const [promoCode, setPromoCode] = useState('');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [activeVouchers, setActiveVouchers] = useState<{ code: string; discount_amount: number; min_purchase: number }[]>([]);

  // Fetch voucher aktif dari BE (public) — supaya promo tampil sinkron dengan yang dibuat admin
  useEffect(() => {
    orderApi.getActiveVouchers().then(setActiveVouchers);
  }, []);

  // Toggle selection
  const toggleSelect = (id: string) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter((i) => i !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const selectedItems = cart.filter((item) => selectedItemIds.includes(item.product.id));
  const totalItemCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotalPrice = selectedItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );
  // Ongkir dihapus (2026-08-07) — total = subtotal - diskon
  const totalPrice = Math.max(0, subtotalPrice - appliedDiscount);

  const handleApplyPromo = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setPromoError(t('Masukkan kode promo terlebih dahulu', 'Please enter a promo code first'));
      return;
    }
    try {
      const result = await orderApi.validateVoucher(cleanCode, subtotalPrice);
      if (result.valid && result.discount) {
        setAppliedDiscount(result.discount);
        setAppliedVoucherCode(cleanCode);
        setPromoError('');
        setShowPromoModal(false);
      } else {
        setPromoError(result.message || t('Kode promo tidak valid', 'Invalid promo code'));
      }
    } catch {
      setPromoError(t('Gagal memvalidasi kode promo', 'Failed to validate promo code'));
    }
  };

  return (
    <main className="pt-24 pb-16 px-4 md:px-10 max-w-[1280px] mx-auto min-h-screen animate-fadeIn font-['Plus_Jakarta_Sans'] text-[#1B5E20]">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Left Column: List of Items */}
        <section className="bg-[#FFFFFF] p-6 md:p-10 rounded-2xl shadow-2xs border border-[#E0E0E0]">
          <header className="mb-8 border-b border-[#E0E0E0] pb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-[#1B5E20] mb-2 font-['Playfair_Display']">
              {t('Keranjang Belanja', 'Shopping Cart')}
            </h1>
            <p className="text-xs sm:text-sm text-[#555555]">
              {cart.length === 0
                ? t('Keranjang Anda saat ini masih kosong.', 'Your cart is currently empty.')
                : `${t('Anda memiliki', 'You have')} ${cart.length} ${t('item terpilih dalam keranjang Anda.', 'selected items in your cart.')}`}
            </p>
          </header>

          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-[#C89B3C]">
                shopping_cart
              </span>
              <p className="text-xl font-bold text-[#1B5E20] font-['Playfair_Display']">
                {t('Keranjang Belanja Kosong', 'Shopping Cart Empty')}
              </p>
              <p className="text-xs text-[#555555] max-w-sm mx-auto">
                {t(
                  'Temukan pilihan beras, tepung, dan camilan sorghum organik pilihan terbaik untuk keluarga Anda.',
                  'Discover the best selection of organic sorghum rice, flour, and snacks for your family.'
                )}
              </p>
              <button
                onClick={onNavigateProducts}
                className="mt-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-2xs cursor-pointer"
              >
                {t('Mulai Belanja Sekarang', 'Start Shopping Now')}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => {
                const isSelected = selectedItemIds.includes(item.product.id);
                const itemSubtotal = item.product.price * item.quantity;

                return (
                  <div
                    key={item.product.id}
                    className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b border-[#E0E0E0] transition-all"
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.product.id)}
                        className="w-5 h-5 rounded border-[#E0E0E0] text-[#2E7D32] focus:ring-[#2E7D32] cursor-pointer"
                      />
                      <div
                        onClick={() => onSelectProduct && onSelectProduct(item.product)}
                        className="w-24 h-24 bg-[#F7F8F6] rounded-xl overflow-hidden flex-shrink-0 shadow-2xs border border-[#E0E0E0] cursor-pointer"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    </div>

                    <div className="flex-grow flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                      <div>
                        <h3
                          onClick={() => onSelectProduct && onSelectProduct(item.product)}
                          className="font-bold text-lg text-[#1B5E20] hover:text-[#2E7D32] cursor-pointer font-['Playfair_Display']"
                        >
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-[#555555] uppercase tracking-wider font-medium mt-0.5">
                          {item.product.unitInfo || `PILIHAN: ${item.product.weight}`}
                        </p>
                        <span className="font-bold text-sm mt-1 block text-[#1B5E20]">
                          Rp {item.product.price.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-8">
                        {/* Quantity Adjuster */}
                        <div className="flex items-center bg-[#E8F5E9] rounded-full px-3 py-1 border border-[#A5D6A7] text-[#1B5E20]">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-[#A5D6A7]/30 rounded-full transition-colors text-[#1B5E20] cursor-pointer"
                            aria-label={t('Kurangi', 'Decrease')}
                          >
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                          </button>
                          <span className="px-4 font-bold text-sm text-[#1B5E20]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-[#A5D6A7]/30 rounded-full transition-colors text-[#1B5E20] cursor-pointer"
                            aria-label={t('Tambah', 'Increase')}
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right min-w-[100px]">
                          <p className="text-[10px] text-[#555555] uppercase tracking-tighter">
                            SUBTOTAL
                          </p>
                          <p className="font-bold text-base text-[#1B5E20]">
                            Rp {itemSubtotal.toLocaleString('id-ID')}
                          </p>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-[#D32F2F] hover:bg-[#FFEBEE] transition-colors p-2 rounded-lg cursor-pointer"
                          title={t('Hapus Item', 'Remove Item')}
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap justify-between items-center gap-4">
                <button
                  onClick={onNavigateProducts}
                  className="flex items-center gap-2 text-[#2E7D32] font-semibold text-sm hover:underline group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">
                    arrow_back
                  </span>
                  <span>{t('Kembali Berbelanja', 'Continue Shopping')}</span>
                </button>

                <button
                  onClick={onClearCart}
                  className="text-[#555555] hover:text-[#D32F2F] font-medium text-xs underline underline-offset-4 cursor-pointer"
                >
                  {t('Hapus Semua', 'Clear All')}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Ringkasan Belanja */}
        <aside className="relative font-['Plus_Jakarta_Sans']">
          <div className="sticky top-28 bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl shadow-2xs border border-[#E0E0E0] space-y-6">
            <h2 className="text-2xl font-bold text-[#1B5E20] font-['Playfair_Display']">
              {t('Ringkasan Belanja', 'Order Summary')}
            </h2>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-[#555555]">
                <span>{t('Total Item', 'Total Items')} ({totalItemCount})</span>
                <span className="font-semibold text-[#1B5E20]">
                  Rp {subtotalPrice.toLocaleString('id-ID')}
                </span>
              </div>

              {appliedDiscount > 0 && (
                <div className="flex justify-between items-center text-[#2E7D32] font-semibold">
                  <span>{t('Voucher Sorgum', 'Sorgum Voucher')}</span>
                  <span>- Rp {appliedDiscount.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="border-t border-[#E0E0E0] pt-4 flex justify-between items-end">
                <span className="font-bold text-sm sm:text-base text-[#1B5E20]">{t('Total Harga', 'Total Price')}</span>
                <span className="font-bold text-2xl text-[#1B5E20]">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Promo Voucher Trigger */}
            <div
              onClick={() => setShowPromoModal(true)}
              className="bg-[#E8F5E9] border border-[#A5D6A7] p-3.5 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-[#A5D6A7]/20 transition-colors group"
            >
              <span className="material-symbols-outlined text-[#C89B3C]">local_offer</span>
              <div className="flex-grow">
                <p className="font-bold text-xs text-[#1B5E20]">
                  {appliedDiscount > 0 ? t('Promo Terpasang', 'Promo Applied') : t('Gunakan Promo', 'Use Promo Code')}
                </p>
                <p className="text-[11px] text-[#555555]">
                  {appliedDiscount > 0 ? t('Klik untuk mengubah promo', 'Click to change promo') : t('Lihat promo menarik untuk Anda', 'View available promotions')}
                </p>
              </div>
              <span className="material-symbols-outlined text-[#1B5E20] text-lg group-hover:translate-x-1 transition-transform">
                chevron_right
              </span>
            </div>

            {/* Checkout Button */}
            <button
              disabled={selectedItems.length === 0}
              onClick={onNavigateCheckout}
              className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-gray-300 text-white py-4 rounded-xl font-bold text-sm sm:text-base shadow-2xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('Lanjut ke Checkout', 'Proceed to Checkout')}</span>
            </button>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-1.5 text-[#555555] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase pt-1">
              <span className="material-symbols-outlined text-sm text-[#1B5E20]">
                verified_user
              </span>
              <span>{t('PEMBAYARAN AMAN & TERENKRIPSI', 'SECURE & ENCRYPTED PAYMENT')}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Promo Code Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[#FFFFFF] max-w-md w-full rounded-2xl p-6 shadow-2xl border border-[#E0E0E0] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl text-[#1B5E20] font-['Playfair_Display']">
                {t('Gunakan Promo', 'Use Promo Code')}
              </h3>
              <button
                onClick={() => setShowPromoModal(false)}
                className="text-[#555555] hover:text-[#1B5E20] cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <p className="text-xs text-[#555555]">
              {t('Gunakan kode', 'Use code')} <strong className="text-[#1B5E20]">SORGUM10</strong> {t('untuk mendapatkan potongan promo.', 'to get a discount.')}
            </p>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoError('');
                  }}
                  placeholder={t('Masukkan Kode Promo', 'Enter Promo Code')}
                  className="flex-grow bg-[#F7F8F6] border border-[#E0E0E0] rounded-xl px-3.5 py-2.5 text-sm uppercase font-bold text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32]"
                />
                <button
                  onClick={() => handleApplyPromo(promoCode)}
                  className="bg-[#2E7D32] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#1B5E20] cursor-pointer"
                >
                  {t('Gunakan', 'Apply')}
                </button>
              </div>
              {promoError && <p className="text-xs text-[#D32F2F]">{promoError}</p>}
            </div>

            <div className="pt-3 border-t border-[#E0E0E0] space-y-2">
              <p className="text-xs font-bold text-[#555555]">{t('Voucher Spesial Hari Ini:', 'Today\'s Special Voucher:')}</p>
              {activeVouchers.length > 0 ? (
                activeVouchers.map((v) => (
                  <div
                    key={v.code}
                    onClick={() => {
                      setPromoCode(v.code);
                      handleApplyPromo(v.code);
                    }}
                    className="p-3 bg-[#E8F5E9] rounded-xl border border-[#A5D6A7] flex justify-between items-center cursor-pointer hover:bg-[#A5D6A7]/20"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#1B5E20]">{v.code}</p>
                      <p className="text-[11px] text-[#555555]">
                        {t('Diskon Rp', 'Discount Rp')} {v.discount_amount.toLocaleString('id-ID')}
                        {v.min_purchase > 0 ? ` ${t('min. belanja Rp', 'min. purchase Rp')} ${v.min_purchase.toLocaleString('id-ID')}` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#2E7D32] underline">{t('Pakai', 'Apply')}</span>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-[#555555]">{t('Belum ada voucher aktif.', 'No active vouchers yet.')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
