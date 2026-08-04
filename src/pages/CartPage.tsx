import React, { useState } from 'react';
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
  const { t, appliedDiscount, setAppliedDiscount } = useApp();
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    cart.map((item) => item.product.id)
  );
  const [promoCode, setPromoCode] = useState('');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoError, setPromoError] = useState('');

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
  const shippingEstimate = selectedItems.length > 0 ? 15000 : 0;
  const totalPrice = Math.max(0, subtotalPrice + shippingEstimate - appliedDiscount);

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
    <main className="pt-24 pb-16 px-4 md:px-10 max-w-[1280px] mx-auto min-h-screen animate-fadeIn font-['Plus_Jakarta_Sans'] text-[#1d1b17]">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Left Column: List of Items */}
        <section className="bg-[#f9f3ec] p-6 md:p-10 rounded-2xl shadow-sm border border-[#c4c8bc]/30">
          <header className="mb-8 border-b border-[#c4c8bc]/40 pb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-[#162809] mb-2">
              {t('Keranjang Belanja', 'Shopping Cart')}
            </h1>
            <p className="text-xs sm:text-sm text-[#44483f]">
              {cart.length === 0
                ? t('Keranjang Anda saat ini masih kosong.', 'Your cart is currently empty.')
                : `${t('Anda memiliki', 'You have')} ${cart.length} ${t('item terpilih dalam keranjang Anda.', 'selected items in your cart.')}`}
            </p>
          </header>

          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-[#75786e]/50">
                shopping_cart
              </span>
              <p className="text-xl font-bold text-[#1d1b17]">
                {t('Keranjang Belanja Kosong', 'Shopping Cart Empty')}
              </p>
              <p className="text-xs text-[#44483f] max-w-sm mx-auto">
                {t(
                  'Temukan pilihan beras, tepung, dan camilan sorghum organik pilihan terbaik untuk keluarga Anda.',
                  'Discover the best selection of organic sorghum rice, flour, and snacks for your family.'
                )}
              </p>
              <button
                onClick={onNavigateProducts}
                className="mt-4 bg-[#2b3e1d] hover:bg-[#162809] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md"
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
                    className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-6 border-b border-[#c4c8bc]/30 transition-all"
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.product.id)}
                        className="w-5 h-5 rounded border-[#75786e] text-[#2b3e1d] focus:ring-[#2b3e1d] cursor-pointer"
                      />
                      <div
                        onClick={() => onSelectProduct && onSelectProduct(item.product)}
                        className="w-24 h-24 bg-[#fff8f2] rounded-xl overflow-hidden flex-shrink-0 shadow-inner border border-[#c4c8bc]/20 cursor-pointer"
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
                          className="font-bold text-lg text-[#1d1b17] hover:text-[#162809] cursor-pointer"
                        >
                          {item.product.name}
                        </h3>
                        <p className="text-xs text-[#44483f] uppercase tracking-wider font-medium mt-0.5">
                          {item.product.unitInfo || `PILIHAN: ${item.product.weight}`}
                        </p>
                        <span className="font-bold text-sm mt-1 block text-[#162809]">
                          Rp {item.product.price.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-8">
                        {/* Quantity Adjuster */}
                        <div className="flex items-center bg-[#f3ede6] rounded-full px-3 py-1 border border-[#c4c8bc]/40">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, -1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-[#e7e2db] rounded-full transition-colors text-[#1d1b17]"
                            aria-label={t('Kurangi', 'Decrease')}
                          >
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                          </button>
                          <span className="px-4 font-bold text-sm text-[#1d1b17]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-[#e7e2db] rounded-full transition-colors text-[#1d1b17]"
                            aria-label={t('Tambah', 'Increase')}
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right min-w-[100px]">
                          <p className="text-[10px] text-[#44483f] uppercase tracking-tighter">
                            SUBTOTAL
                          </p>
                          <p className="font-bold text-base text-[#1d1b17]">
                            Rp {itemSubtotal.toLocaleString('id-ID')}
                          </p>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-[#75786e]/70 hover:text-red-700 transition-colors p-2"
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
                  className="flex items-center gap-2 text-[#2b3e1d] font-semibold text-sm hover:underline group"
                >
                  <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">
                    arrow_back
                  </span>
                  <span>{t('Kembali Berbelanja', 'Continue Shopping')}</span>
                </button>

                <button
                  onClick={onClearCart}
                  className="text-[#44483f] hover:text-red-700 font-medium text-xs underline underline-offset-4"
                >
                  {t('Hapus Semua', 'Clear All')}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Ringkasan Belanja */}
        <aside className="relative font-['Plus_Jakarta_Sans']">
          <div className="sticky top-28 bg-[#f9f3ec] p-6 sm:p-8 rounded-2xl shadow-sm border border-[#c4c8bc]/30 space-y-6">
            <h2 className="text-2xl font-bold text-[#1d1b17]">
              {t('Ringkasan Belanja', 'Order Summary')}
            </h2>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-[#44483f]">
                <span>{t('Total Item', 'Total Items')} ({totalItemCount})</span>
                <span className="font-semibold text-[#1d1b17]">
                  Rp {subtotalPrice.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#44483f]">
                <span>{t('Estimasi Ongkir', 'Est. Shipping')}</span>
                <span className="font-semibold text-[#1d1b17]">
                  Rp {shippingEstimate.toLocaleString('id-ID')}
                </span>
              </div>

              {appliedDiscount > 0 && (
                <div className="flex justify-between items-center text-[#2b3e1d] font-semibold">
                  <span>{t('Voucher Bestari', 'Bestari Voucher')}</span>
                  <span>- Rp {appliedDiscount.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="border-t border-[#c4c8bc]/40 pt-4 flex justify-between items-end">
                <span className="font-bold text-sm sm:text-base text-[#1d1b17]">{t('Total Harga', 'Total Price')}</span>
                <span className="font-bold text-2xl text-[#162809]">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Promo Voucher Trigger */}
            <div
              onClick={() => setShowPromoModal(true)}
              className="bg-[#fff8f2] border border-[#c4c8bc]/40 p-3.5 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-[#f3ede6] transition-colors group"
            >
              <span className="material-symbols-outlined text-[#715c13]">local_offer</span>
              <div className="flex-grow">
                <p className="font-bold text-xs text-[#1d1b17]">
                  {appliedDiscount > 0 ? t('Promo Terpasang (Rp 15.000)', 'Promo Applied (Rp 15,000)') : t('Gunakan Promo', 'Use Promo Code')}
                </p>
                <p className="text-[11px] text-[#44483f]">
                  {appliedDiscount > 0 ? t('Klik untuk mengubah promo', 'Click to change promo') : t('Lihat promo menarik untuk Anda', 'View available promotions')}
                </p>
              </div>
              <span className="material-symbols-outlined text-[#44483f] text-lg group-hover:translate-x-1 transition-transform">
                chevron_right
              </span>
            </div>

            {/* Checkout Button */}
            <button
              disabled={selectedItems.length === 0}
              onClick={onNavigateCheckout}
              className="w-full bg-[#2b3e1d] hover:bg-[#162809] disabled:bg-[#75786e]/40 text-white py-4 rounded-xl font-bold text-sm sm:text-base shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer btn-hover-effect"
            >
              <span>{t('Lanjut ke Checkout', 'Proceed to Checkout')}</span>
            </button>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-1.5 text-[#44483f]/80 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase pt-1">
              <span className="material-symbols-outlined text-sm text-[#162809]">
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
          <div className="bg-[#f9f3ec] max-w-md w-full rounded-2xl p-6 shadow-2xl border border-[#c4c8bc]/40 space-y-4">
            <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl text-[#1d1b17]">
                {t('Gunakan Promo', 'Use Promo Code')}
              </h3>
              <button
                onClick={() => setShowPromoModal(false)}
                className="text-[#44483f] hover:text-[#1d1b17]"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            <p className="text-xs text-[#44483f]">
              {t('Gunakan kode', 'Use code')} <strong className="text-[#162809]">BESTARI10</strong> {t('untuk mendapatkan potongan Rp 15.000.', 'to get a discount of Rp 15,000.')}
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
                  className="flex-grow bg-[#fff8f2] border border-[#c4c8bc] rounded-xl px-3.5 py-2.5 text-sm uppercase font-bold text-[#1d1b17] focus:ring-2 focus:ring-[#162809]"
                />
                <button
                  onClick={() => handleApplyPromo(promoCode)}
                  className="bg-[#2b3e1d] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#162809]"
                >
                  {t('Gunakan', 'Apply')}
                </button>
              </div>
              {promoError && <p className="text-xs text-red-700">{promoError}</p>}
            </div>

            <div className="pt-3 border-t border-[#c4c8bc]/30 space-y-2">
              <p className="text-xs font-bold text-[#44483f]">{t('Voucher Spesial Hari Ini:', 'Today\'s Special Voucher:')}</p>
              <div
                onClick={() => {
                  setPromoCode('BESTARI10');
                  handleApplyPromo('BESTARI10');
                }}
                className="p-3 bg-[#fff8f2] rounded-xl border border-[#fade88] flex justify-between items-center cursor-pointer hover:bg-[#fade88]/20"
              >
                <div>
                  <p className="font-bold text-sm text-[#162809]">BESTARI10</p>
                  <p className="text-[11px] text-[#44483f]">{t('Diskon Rp 15.000 Tanpa Minimal Belanja', 'Rp 15,000 Discount No Minimum Purchase')}</p>
                </div>
                <span className="text-xs font-bold text-[#715c13] underline">{t('Pakai', 'Apply')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
