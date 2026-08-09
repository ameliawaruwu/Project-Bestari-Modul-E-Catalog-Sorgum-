import React, { useEffect, useRef, useState } from 'react';
import { CartItem, CheckoutData, Order } from '../types';
import { useApp } from '../context/AppContext';
import { orderApi } from '../api';
import { addressApi } from '../api/addressApi';
import { PhoneInput } from '../components/PhoneInput';

interface CheckoutPageProps {
  cart: CartItem[];
  onNavigateCart: () => void;
  onOrderComplete: (order: Order, paymentMethod: 'cod' | 'qris') => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
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
    (a) => a.category === 'Promosi'
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

  // Alamat tersimpan dari profil user — user bisa pilih untuk mengisi form otomatis.
  const [savedAddresses, setSavedAddresses] = useState<Awaited<ReturnType<typeof addressApi.getAddresses>>>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  // Prefill alamat default (is_primary) dari profil user — kalau login & punya alamat.
  // User tetap bisa ubah manual di form; ini cuma mengisi awal biar tidak kosong.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!currentUser) return;
      try {
        const list = await addressApi.getAddresses();
        if (cancelled) return;
        setSavedAddresses(list);
        const primary = list.find((a) => a.isPrimary) || list[0];
        if (primary) {
          setSelectedAddressId(primary.id);
          setFormData((prev) => ({
            ...prev,
            customerName: prev.customerName || primary.recipientName,
            customerPhone: prev.customerPhone || primary.phone,
            address: primary.addressLine,
            district: primary.district || '',
            city: primary.city,
            province: primary.province,
            postalCode: primary.postalCode,
          }));
        }
      } catch (e: any) {
        // Abaikan — alamat default tidak wajib; form tetap bisa diisi manual.
        // TAPI kalau 401 (token expired), kasih tahu user biar login ulang —
        // kalau tidak, dropdown alamat diam-diam tidak muncul = user bingung.
        if (e?.status === 401) {
          showToast?.('Sesi berakhir. Silakan login ulang untuk memuat alamat tersimpan.', 'error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [currentUser]);

  // Pilih alamat tersimpan → isi form otomatis (biar user tidak ketik ulang).
  // Pilih "Isi alamat baru (manual)" → kosongkan field alamat biar user mulai dari nol.
  const handleSelectSavedAddress = (id: string) => {
    setSelectedAddressId(id);
    const addr = savedAddresses.find((a) => a.id === id);
    if (!addr) {
      setFormData((prev) => ({
        ...prev,
        customerName: currentUser?.name || '',
        customerPhone: '',
        address: '',
        district: '',
        city: 'Bandung',
        province: 'Jawa Barat',
        postalCode: '',
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      customerName: addr.recipientName,
      customerPhone: addr.phone,
      address: addr.addressLine,
      district: addr.district || '',
      city: addr.city,
      province: addr.province,
      postalCode: addr.postalCode,
    }));
  };

  // Idempotency key per checkout session: retry/submit ulang (mis. double-click)
  // pakai key SAMA → BE replay order yang sama, bukan bikin order baru.
  const idempotencyRef = useRef<string>(
    (crypto?.randomUUID ? crypto.randomUUID() : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  // appliedDiscount = NOMINAL RUPIAH (dari CartPage promo: SORGUM10 = Rp 15.000)
  const discount = appliedDiscount > 0 ? Math.min(appliedDiscount, subtotal) : 0;

  // ─── SINKRONISASI DISKON FE ↔ BE ──────────────────────────────────────
  // Bug: user apply voucher persen di CartPage (mis. HALAL 20% → diskon dihitung
  // dari subtotal SAAT ITU). Lalu user ubah qty/isi cart di checkout → subtotal
  // berubah → BE saat order menghitung diskon ULANG dari subtotal baru → total
  // order BE ≠ total tampil FE ("harga tidak sesuai").
  // Fix: validasi ulang voucher ke BE setiap subtotal berubah; appliedDiscount
  // di-update ke nominal diskon BE untuk subtotal SAAT INI → FE selalu == BE.
  useEffect(() => {
    if (!appliedVoucherCode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await orderApi.validateVoucher(appliedVoucherCode, subtotal);
        if (cancelled) return;
        if (res.valid && res.discount !== undefined) {
          // Hanya update kalau nominal BERUBAH (hindari loop re-render)
          setAppliedDiscount(res.discount);
        } else {
          // Voucher tidak valid lagi (min belanja baru tidak tercapai / kadaluarsa)
          setAppliedDiscount(0);
        }
      } catch {
        // Keep previous — jangan crash kalau BE offline
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);
  // Ongkir dihapus (keputusan 2026-08-07) — total = subtotal - diskon
  const totalAmount = Math.max(0, subtotal - discount);


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (method: 'cod' | 'qris') => {
    setFormData((prev) => ({ ...prev, paymentMethod: method }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const finalCheckoutData: CheckoutData = {
        ...formData,
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

      // Simpan alamat checkout ke profil user (login) — supaya alamat tidak hilang
      // dan tersedia untuk checkout berikutnya. Gagal di sini TIDAK menggagalkan order.
      if (currentUser) {
        const input = {
          label: selectedAddressId ? 'Alamat Utama' : 'Alamat Checkout',
          recipient_name: formData.customerName,
          phone: formData.customerPhone,
          address_line: formData.address,
          city: formData.city,
          district: formData.district,
          province: formData.province,
          postal_code: formData.postalCode,
          is_primary: true,
        };
        const save = async () => {
          if (selectedAddressId) {
            // Update alamat yang dipilih (data terbaru dari form)
            await addressApi.updateAddress(selectedAddressId, input);
          } else {
            // Alamat baru (custom) — simpan sebagai primary kalau masih muat.
            // Kalau sudah 3, BE tolak → biarkan (order tetap sukses).
            await addressApi.createAddress(input);
          }
        };
        // Fire-and-forget: jangan tahan halaman sukses menunggu save alamat.
        save().catch((err) => {
          console.warn('Simpan alamat checkout gagal (non-fatal):', err);
        });
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      const msg = err?.message || 'Gagal membuat pesanan. Silakan coba lagi.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="pt-24 pb-16 px-4 md:px-10 max-w-[1280px] mx-auto min-h-screen font-['Plus_Jakarta_Sans'] text-[#1B5E20] animate-fadeIn">
      {/* Header & Breadcrumb */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1B5E20] mb-2 font-['Playfair_Display']">
          {t('Checkout', 'Checkout')}
        </h1>
        <nav className="flex items-center text-xs text-[#555555] space-x-2">
          <button
            onClick={onNavigateCart}
            className="hover:underline font-bold text-[#1B5E20] cursor-pointer"
          >
            {t('Keranjang', 'Cart')}
          </button>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1B5E20] font-bold">{t('Informasi Pengiriman', 'Shipping Information')}</span>
        </nav>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Informasi Pembeli */}
          <section className="lg:col-span-7">
            <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 shadow-2xs border border-[#E0E0E0] space-y-6">
              <h2 className="text-2xl font-bold text-[#1B5E20] border-b border-[#E0E0E0] pb-4 font-['Playfair_Display']">
                {t('Informasi Pembeli', 'Buyer Information')}
              </h2>

              {/* Pilih Alamat Tersimpan — dari profil user (maks 3 alamat).
                  Ditaruh PALING ATAS: user pilih alamat DULU, form terisi otomatis.
                  Kalau pilih "manual", form tetap bisa diisi dari nol. */}
              {savedAddresses.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#555555]">
                    {t('Pilih Alamat Pengiriman', 'Choose Shipping Address')}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedAddressId}
                      onChange={(e) => handleSelectSavedAddress(e.target.value)}
                      className="w-full bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl p-3 pr-10 text-xs sm:text-sm text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none appearance-none cursor-pointer font-bold"
                    >
                      <option value="">
                        {t('Isi alamat baru (manual)', 'Enter a new address (manual)')}
                      </option>
                      {savedAddresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.label}
                          {addr.isPrimary ? ' (Utama)' : ''}
                          {addr.recipientName ? ` — ${addr.recipientName}` : ''}
                          {addr.city ? ` — ${addr.city}` : ''}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#1B5E20] text-lg">
                      expand_more
                    </span>
                  </div>
                  <p className="text-[11px] text-[#555555]">
                    {t(
                      'Pilih alamat tersimpan dan form akan terisi otomatis.',
                      'Pick a saved address and the form fills in automatically.'
                    )}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#555555]">{t('Nama Lengkap', 'Full Name')}</label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="Contoh: Budi Santoso"
                    className="bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl p-3 text-xs sm:text-sm text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-medium"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#555555]">{t('Nomor WhatsApp', 'WhatsApp Number')}</label>
                  <PhoneInput
                    value={formData.customerPhone.replace(/^\+?62/, '').replace(/^0/, '')}
                    onChange={(digits) => setFormData((prev) => ({ ...prev, customerPhone: digits }))}
                    placeholder="8123456789"
                    className="p-3"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#555555]">Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  required
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="alamat@email.com"
                  className="bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl p-3 text-xs sm:text-sm text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-medium"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#555555]">{t('Alamat Lengkap', 'Full Address')}</label>
                <textarea
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={t('Nama jalan, Nomor rumah, RT/RW', 'Street name, House number, RT/RW')}
                  className="bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl p-3 text-xs sm:text-sm text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#555555]">{t('Provinsi', 'Province')}</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl p-3 text-xs sm:text-sm text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none appearance-none cursor-pointer font-bold"
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
                  <label className="text-xs font-bold text-[#555555]">{t('Kabupaten / Kota', 'City / Regency')}</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl p-3 text-xs sm:text-sm text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none appearance-none cursor-pointer font-bold"
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
                  <label className="text-xs font-bold text-[#555555]">Kecamatan</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    placeholder="Nama Kecamatan"
                    className="bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl p-3 text-xs sm:text-sm text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-medium"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#555555]">Kode Pos</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="12345"
                    className="bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl p-3 text-xs sm:text-sm text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#555555]">
                  Catatan Pesanan (Opsional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Contoh: Titip di satpam jika tidak ada orang"
                  className="bg-[#F7F8F6] focus:bg-[#FFFFFF] border border-[#E0E0E0] rounded-xl p-3 text-xs sm:text-sm text-[#1B5E20] focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32] outline-none font-medium"
                />
              </div>
            </div>
          </section>

          {/* Right Column: Ringkasan Pesanan & Metode Pembayaran */}
          <aside className="lg:col-span-5 space-y-6">
            {/* Order Summary Card */}
            <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 shadow-2xs border border-[#E0E0E0]">
              <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1B5E20] mb-6">
                Ringkasan Pesanan
              </h2>

              {/* Item List */}
              <ul className="space-y-4 mb-6">
                {cart.map((item) => (
                  <li key={item.product.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-[#F7F8F6] overflow-hidden flex-shrink-0 border border-[#E0E0E0]">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-['Playfair_Display'] font-bold text-sm text-[#1B5E20]">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-[#555555]">
                        {item.product.unitInfo || item.product.weight} × {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-sm text-[#1B5E20]">
                      Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Calculation */}
              <div className="space-y-3 pt-4 border-t border-[#E0E0E0] text-xs sm:text-sm">
                <div className="flex justify-between text-[#555555]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1B5E20]">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#2E7D32]">
                    <span>Diskon Promo</span>
                    <span className="font-semibold">- Rp {discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-[#E0E0E0]">
                  <span className="font-bold text-sm sm:text-base text-[#1B5E20]">Total Bayar</span>
                  <span className="font-['Playfair_Display'] font-bold text-2xl text-[#1B5E20]">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Promotions Section */}
            {promoArticles.length > 0 && (
              <div className="bg-[#FFF8E1] border border-[#FFE0B2] rounded-2xl p-6 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPromoExpanded(!promoExpanded)}
                  className="flex items-center justify-between w-full cursor-pointer"
                >
                  <h2 className="font-['Playfair_Display'] text-lg font-bold text-[#C89B3C] flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">local_offer</span>
                    {t('Promosi & Penawaran', 'Promotions & Offers')}
                  </h2>
                  <span className="material-symbols-outlined text-[#C89B3C]">
                    {promoExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {promoExpanded && (
                  <div className="mt-4 space-y-3">
                    {promoArticles.map((promo) => (
                      <div key={promo.id} className="bg-[#FFFFFF] rounded-xl p-4 border border-[#FFE0B2] flex items-start gap-3">
                        {promo.image && (
                          <img src={promo.image} alt={promo.title} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                        )}
                        <div className="flex-grow">
                          <p className="font-bold text-xs text-[#1B5E20]">{promo.title}</p>
                          <p className="text-[11px] text-[#555555] mt-1 line-clamp-2">{promo.snippet}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Payment Method Card */}
            <div className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 shadow-2xs border border-[#E0E0E0]">
              <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#1B5E20] mb-6">
                Metode Pembayaran
              </h2>

              <div className="space-y-4">
                {/* COD Option */}
                <label
                  onClick={() => handlePaymentMethodChange('cod')}
                  className={`relative flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.paymentMethod === 'cod'
                      ? 'border-[#2E7D32] bg-[#E8F5E9]/50 ring-2 ring-[#2E7D32]/20 shadow-2xs'
                      : 'border-[#E0E0E0] bg-[#FFFFFF] hover:bg-[#F7F8F6]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={() => handlePaymentMethodChange('cod')}
                    className="w-4 h-4 text-[#2E7D32] focus:ring-[#2E7D32] cursor-pointer"
                  />
                  <div className="ml-4 flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#E8F5E9] rounded-xl border border-[#A5D6A7]">
                      <span className="material-symbols-outlined text-[#1B5E20]">payments</span>
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-[#1B5E20] leading-tight">
                        COD (Cash on Delivery)
                      </p>
                      <p className="text-[11px] text-[#555555]">
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
                      ? 'border-[#2E7D32] bg-[#E8F5E9]/50 ring-2 ring-[#2E7D32]/20 shadow-2xs'
                      : 'border-[#E0E0E0] bg-[#FFFFFF] hover:bg-[#F7F8F6]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="qris"
                    checked={formData.paymentMethod === 'qris'}
                    onChange={() => handlePaymentMethodChange('qris')}
                    className="w-4 h-4 text-[#2E7D32] focus:ring-[#2E7D32] cursor-pointer"
                  />
                  <div className="ml-4 flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-[#FFF8E1] rounded-xl border border-[#FFE0B2]">
                      <span className="material-symbols-outlined text-[#C89B3C]">qr_code_2</span>
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-[#1B5E20] leading-tight">QRIS</p>
                      <p className="text-[11px] text-[#555555]">
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
                  className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-gray-300 text-white py-4 px-6 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
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

                <p className="text-center text-[11px] text-[#555555] font-medium leading-relaxed px-2">
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
