import React, { useRef, useState } from 'react';
import { CartItem, CheckoutData, Order } from '../types';
import { useApp } from '../context/AppContext';
import { orderApi } from '../api';

interface CheckoutPageProps {
  cart: CartItem[];
  onNavigateCart: () => void;
  onOrderComplete: (order: Order, paymentMethod: 'cod' | 'qris') => void;
  showToast?: (message: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cart,
  onNavigateCart,
  onOrderComplete,
  showToast,
}) => {
  const { t, shopSettings, articles, appliedDiscount, setAppliedDiscount, appliedVoucherCode, currentUser } = useApp();

  // Promotional articles for the checkout promotions section
  const promoArticles = articles.filter(
    (a) => a.category === 'Promosi' || a.category === 'Promotion'
  );
  const [promoExpanded, setPromoExpanded] = useState(false);

  const [formData, setFormData] = useState<CheckoutData>({
    customerName: currentUser?.name || '',
    customerPhone: '',
    customerEmail: currentUser?.email || '',
    address: '',
    province: 'Jawa Barat',
    city: 'Bandung',
    district: '',
    postalCode: '',
    notes: '',
    paymentMethod: 'cod',
  });

  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  // Idempotency key per checkout session: retry/submit ulang (mis. double-click)
  // pakai key SAMA → BE replay order yang sama, bukan bikin order baru.
  const idempotencyRef = useRef<string>(
    (crypto?.randomUUID ? crypto.randomUUID() : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  );
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  // appliedDiscount = NOMINAL RUPIAH (dari CartPage promo: SORGUM10 = Rp 15.000)
  const discount = appliedDiscount > 0 ? Math.min(appliedDiscount, subtotal) : 0;
  // Ongkir dari settings BE (bukan hardcode 15000)
  const shippingFee = cart.length > 0 ? (shopSettings.shippingCost ?? 15000) : 0;
  const totalAmount = Math.max(0, subtotal - discount + shippingFee);


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (method: 'cod' | 'qris') => {
    setFormData((prev) => ({ ...prev, paymentMethod: method }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaymentProofFile(file);
      setPaymentProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalCheckoutData: CheckoutData = {
        ...formData,
        paymentProofUrl: paymentProofPreview || undefined,
        voucherCode: appliedVoucherCode || undefined, // kirim KODE voucher (BE verifikasi & hitung diskon)
        idempotencyKey: idempotencyRef.current,
      };

      // Construct items summary string for WhatsApp
      const itemsSummary = cart
        .map(
          (item) =>
            `- ${item.product.name} (${item.product.unitInfo || item.product.weight}) x${
              item.quantity
            } = Rp ${(item.product.price * item.quantity).toLocaleString('id-ID')}`
        )
        .join('\n');

      const fullMessage = `Halo Admin SORGUM, saya ingin melakukan pemesanan:${
        formData.paymentMethod === 'qris' ? ' (Metode: QRIS)' : ' (Metode: COD)'
      }

*Detail Pesanan:*
${itemsSummary}
Subtotal: Rp ${subtotal.toLocaleString('id-ID')}
Ongkir: Rp ${shippingFee.toLocaleString('id-ID')}
*Total Bayar: Rp ${totalAmount.toLocaleString('id-ID')}*

*Informasi Pembeli:*
Nama: ${formData.customerName}
WhatsApp: +62${formData.customerPhone}
Email: ${formData.customerEmail}
Alamat: ${formData.address}, ${formData.district}, ${formData.city}, ${formData.province} (${formData.postalCode})
${formData.notes ? `Catatan: ${formData.notes}\n` : ''}
${
  formData.paymentMethod === 'qris'
    ? 'Saya telah memilih pembayaran via QRIS dan akan mengirimkan bukti transfer di sini.'
    : 'Metode Pembayaran: Cash on Delivery (COD).'
}`;

      // Kirim order ke backend — TANPA fallback mock.
      // Kalau BE gagal (jaringan, validasi, cart kosong), tampilkan error
      // ke user — jangan diam-diam lanjut ke halaman sukses dengan order fiktif.
      const finalOrder = await orderApi.checkoutOrder(finalCheckoutData);
      onOrderComplete(finalOrder, formData.paymentMethod);
    } catch (err: any) {
      console.error('Checkout error:', err);
      const msg = err?.message || 'Gagal membuat pesanan. Silakan coba lagi.';
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="pt-24 pb-16 px-4 md:px-10 max-w-[1280px] mx-auto min-h-screen font-['Plus_Jakarta_Sans'] text-[#1d1b17] animate-fadeIn">
      {/* Header & Breadcrumb */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#162809] mb-2">
          {t('Checkout', 'Checkout')}
        </h1>
        <nav className="flex items-center text-xs text-[#44483f] space-x-2">
          <button
            onClick={onNavigateCart}
            className="hover:underline font-bold text-[#162809] cursor-pointer"
          >
            {t('Keranjang', 'Cart')}
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#162809] font-bold">{t('Informasi Pengiriman', 'Shipping Information')}</span>
        </nav>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Informasi Pembeli */}
          <section className="lg:col-span-7">
            <div className="bg-[#f9f3ec] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#c4c8bc]/30 space-y-6">
              <h2 className="text-2xl font-bold text-[#162809] border-b border-[#c4c8bc]/40 pb-4">
                {t('Informasi Pembeli', 'Buyer Information')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#44483f]">{t('Nama Lengkap', 'Full Name')}</label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="Contoh: Budi Santoso"
                    className="bg-white border border-[#c4c8bc] rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-[#162809] focus:border-[#162809] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#44483f]">{t('Nomor WhatsApp', 'WhatsApp Number')}</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-[#44483f] text-xs font-bold">
                      +62
                    </span>
                    <input
                      type="tel"
                      name="customerPhone"
                      required
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      placeholder="8123456789"
                      className="w-full bg-white border border-[#c4c8bc] rounded-xl p-3 pl-12 text-xs sm:text-sm focus:ring-2 focus:ring-[#162809] focus:border-[#162809] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#44483f]">Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  required
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="alamat@email.com"
                  className="bg-white border border-[#c4c8bc] rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-[#162809] focus:border-[#162809] outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#44483f]">{t('Alamat Lengkap', 'Full Address')}</label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={t('Nama jalan, Nomor rumah, RT/RW', 'Street name, House number, RT/RW')}
                  className="bg-white border border-[#c4c8bc] rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-[#162809] focus:border-[#162809] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#44483f]">{t('Provinsi', 'Province')}</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="bg-white border border-[#c4c8bc] rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-[#162809] focus:border-[#162809] outline-none appearance-none cursor-pointer"
                  >
                    <option value="Jawa Barat">Jawa Barat</option>
                    <option value="Jawa Tengah">Jawa Tengah</option>
                    <option value="Jawa Timur">Jawa Timur</option>
                    <option value="DKI Jakarta">DKI Jakarta</option>
                    <option value="DI Yogyakarta">DI Yogyakarta</option>
                    <option value="Banten">Banten</option>
                    <option value="Bali">Bali</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#44483f]">{t('Kabupaten / Kota', 'City / Regency')}</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="bg-white border border-[#c4c8bc] rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-[#162809] focus:border-[#162809] outline-none appearance-none cursor-pointer"
                  >
                    <option value="Bandung">Bandung</option>
                    <option value="Semarang">Semarang</option>
                    <option value="Surabaya">Surabaya</option>
                    <option value="Jakarta Selatan">Jakarta Selatan</option>
                    <option value="Yogyakarta">Yogyakarta</option>
                    <option value="Bogor">Bogor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#44483f]">Kecamatan</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="Nama Kecamatan"
                    className="bg-white border border-[#c4c8bc] rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-[#162809] focus:border-[#162809] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#44483f]">Kode Pos</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="12345"
                    className="bg-white border border-[#c4c8bc] rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-[#162809] focus:border-[#162809] outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#44483f]">
                  Catatan Pesanan (Opsional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Contoh: Titip di satpam jika tidak ada orang"
                  className="bg-white border border-[#c4c8bc] rounded-xl p-3 text-xs sm:text-sm focus:ring-2 focus:ring-[#162809] focus:border-[#162809] outline-none"
                />
              </div>
            </div>
          </section>

          {/* Right Column: Ringkasan Pesanan & Metode Pembayaran */}
          <aside className="lg:col-span-5 space-y-6">
            {/* Order Summary Card */}
            <div className="bg-[#f9f3ec] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#c4c8bc]/30">
              <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#162809] mb-6">
                Ringkasan Pesanan
              </h2>

              {/* Item List */}
              <ul className="space-y-4 mb-6">
                {cart.map((item) => (
                  <li key={item.product.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-[#fff8f2] overflow-hidden flex-shrink-0 border border-[#c4c8bc]/30">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-['Playfair_Display'] font-bold text-sm text-[#162809]">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-[#44483f]">
                        {item.product.unitInfo || item.product.weight} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-sm text-[#1d1b17]">
                      Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Calculation */}
              <div className="space-y-3 pt-4 border-t border-[#c4c8bc]/40 text-xs sm:text-sm">
                <div className="flex justify-between text-[#44483f]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1d1b17]">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[#44483f]">
                  <span>Ongkos Kirim</span>
                  <span className="font-semibold text-[#1d1b17]">Rp {shippingFee.toLocaleString('id-ID')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Diskon Promo</span>
                    <span className="font-semibold">- Rp {discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-[#c4c8bc]/40">
                  <span className="font-bold text-sm sm:text-base text-[#162809]">Total Bayar</span>
                  <span className="font-['Playfair_Display'] font-bold text-2xl text-[#1d1b17]">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Promotions Section */}
            {promoArticles.length > 0 && (
              <div className="bg-[#fefce8] border border-[#fade88] rounded-2xl p-6 shadow-sm">
                <button
                  type="button"
                  onClick={() => setPromoExpanded(!promoExpanded)}
                  className="flex items-center justify-between w-full cursor-pointer"
                >
                  <h2 className="font-['Playfair_Display'] text-lg font-bold text-[#715c13] flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">local_offer</span>
                    {t('Promosi & Penawaran', 'Promotions & Offers')}
                  </h2>
                  <span className="material-symbols-outlined text-[#715c13]">
                    {promoExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {promoExpanded && (
                  <div className="mt-4 space-y-3">
                    {promoArticles.map((promo) => (
                      <div key={promo.id} className="bg-white rounded-xl p-4 border border-[#fade88]/60 flex items-start gap-3">
                        {promo.imageUrl && (
                          <img src={promo.imageUrl} alt={promo.title} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                        )}
                        <div className="flex-grow">
                          <p className="font-bold text-xs text-[#162809]">{promo.title}</p>
                          <p className="text-[11px] text-[#44483f] mt-1 line-clamp-2">{promo.snippet}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payment Method Card */}
            <div className="bg-[#f9f3ec] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#c4c8bc]/30">
              <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#162809] mb-6">
                Metode Pembayaran
              </h2>

              <div className="space-y-4">
                {/* COD Option */}
                <label
                  onClick={() => handlePaymentMethodChange('cod')}
                  className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.paymentMethod === 'cod'
                      ? 'border-[#2b3e1d] bg-white ring-2 ring-[#2b3e1d]/20 shadow-sm'
                      : 'border-[#c4c8bc] bg-[#fdfbf7] hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={() => handlePaymentMethodChange('cod')}
                    className="w-4 h-4 text-[#2b3e1d] focus:ring-[#2b3e1d] cursor-pointer"
                  />
                  <div className="ml-4 flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#2b3e1d]/10 rounded-xl border border-[#2b3e1d]/20">
                      <span className="material-symbols-outlined text-[#162809]">payments</span>
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-[#162809] leading-tight">
                        COD (Cash on Delivery)
                      </p>
                      <p className="text-[11px] text-[#44483f]">
                        Bayar langsung kepada kurir saat barang diterima.
                      </p>
                    </div>
                  </div>
                </label>

                {/* QRIS Option */}
                <label
                  onClick={() => handlePaymentMethodChange('qris')}
                  className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.paymentMethod === 'qris'
                      ? 'border-[#2b3e1d] bg-white ring-2 ring-[#2b3e1d]/20 shadow-sm'
                      : 'border-[#c4c8bc] bg-[#fdfbf7] hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="qris"
                    checked={formData.paymentMethod === 'qris'}
                    onChange={() => handlePaymentMethodChange('qris')}
                    className="w-4 h-4 text-[#2b3e1d] focus:ring-[#2b3e1d] cursor-pointer"
                  />
                  <div className="ml-4 flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#fade88]/30 rounded-xl border border-[#715c13]/20">
                      <span className="material-symbols-outlined text-[#715c13]">qr_code_2</span>
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-[#162809] leading-tight">QRIS</p>
                      <p className="text-[11px] text-[#44483f]">
                        Scan QR Code di halaman baru untuk pembayaran instan.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Checkout CTA Button */}
              <div className="mt-8 space-y-3">
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full bg-[#2b3e1d] hover:bg-[#162809] text-white py-4 px-6 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer btn-hover-effect"
                >
                  <span className="material-symbols-outlined text-xl">
                    {formData.paymentMethod === 'qris' ? 'qr_code_scanner' : 'local_shipping'}
                  </span>
                  <span>
                    {isSubmitting
                      ? 'Memproses...'
                      : formData.paymentMethod === 'qris'
                      ? 'Lanjut ke Pembayaran QRIS'
                      : 'Buat Pesanan Sekarang'}
                  </span>
                </button>

                <p className="text-center text-[11px] text-[#44483f] font-medium leading-relaxed px-2">
                  {formData.paymentMethod === 'qris'
                    ? 'Anda akan diarahkan ke halaman pembayaran QRIS khusus untuk memindai kode QR & konfirmasi via WA.'
                    : 'Pesanan Anda akan langsung diproses dengan metode pembayaran Cash on Delivery.'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </main>
  );
};
