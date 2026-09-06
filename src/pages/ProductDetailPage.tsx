import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { productApi } from '../api/productApi';

interface ProductDetailPageProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  setActiveTab: (tab: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onSelectProduct,
  setActiveTab,
}) => {
  const { t, shopSettings } = useApp();
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [descExpanded, setDescExpanded] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);

  // Gallery images — dari DB (product_images, diedit admin di Kelola Produk).
  const galleryImages = (product.images && product.images.length
    ? product.images.map((img) => img.image_url)
    : [product.image]
  ).slice(0, 5);

  // Reset pada pergantian produk
  useEffect(() => {
    setSelectedImage(product.image);
    setDescExpanded(false);
    setQuantity(1);
  }, [product]);

  // Load related products from backend (same category, exclude current)
  useEffect(() => {
    let cancelled = false;
    productApi
      .getProducts({ category: product.category })
      .then((list) => {
        if (!cancelled) {
          setRelatedProducts(list.filter((p) => p.id !== product.id).slice(0, 4));
        }
      })
      .catch(() => {
        if (!cancelled) setRelatedProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [product.id, product.category]);

  // Nomor tujuan order WA: prioritas nomor pemilik produk (wa_contact), fallback nomor toko global.
  const rawWaNumber = (product.waContact || shopSettings.whatsappNumber || '').replace(/[^0-9]/g, '').replace(/^0/, '62');
  const waNumber = rawWaNumber || '';
  const totalPrice = product.price * quantity;

  const orderMessageText =
    `Halo Admin Bestari Sorgum, saya ingin memesan produk:\n*${product.name}*\nJumlah: ${quantity} ${product.unitInfo || 'item'}\nTotal: Rp ${totalPrice.toLocaleString('id-ID')}\n\nMohon info ketersediaan dan ongkos kirim. Terima kasih!`;
  const orderWhatsappUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(orderMessageText)}` : '#';

  return (
    <main className="pt-6 sm:pt-8 pb-16 px-4 sm:px-6 md:px-8 max-w-[1180px] mx-auto animate-fadeIn min-h-screen">

      {/* ── Breadcrumb & Tombol Kembali (Di Bawah Breadcrumb) ── */}
      <div className="mb-4 sm:mb-6 flex flex-col items-start gap-2.5">
        <nav className="flex items-center flex-wrap gap-y-0.5 space-x-1.5 font-['Plus_Jakarta_Sans'] text-xs text-[#556353] dark:text-white/60">
          <button
            onClick={() => setActiveTab('beranda')}
            className="hover:underline text-[#245B3A] dark:text-[#86EFAC] font-medium cursor-pointer"
          >
            {t('Beranda', 'Home')}
          </button>
          <span className="material-symbols-outlined text-[13px]">chevron_right</span>
          <button
            onClick={() => setActiveTab('produk')}
            className="hover:underline text-[#245B3A] dark:text-[#86EFAC] font-medium cursor-pointer"
          >
            {t('Produk', 'Products')}
          </button>
          <span className="material-symbols-outlined text-[13px]">chevron_right</span>
          <span className="font-semibold text-[#14331C] dark:text-white truncate max-w-[180px] sm:max-w-[340px]">
            {product.name}
          </span>
        </nav>

        <button
          type="button"
          onClick={() => setActiveTab('produk')}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#245B3A] dark:text-[#86EFAC] bg-white/80 dark:bg-[#122316] hover:bg-[#EAF6E8] dark:hover:bg-[#1A3320] border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.2)] px-3.5 py-1.5 rounded-full transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer group"
        >
          <span className="material-symbols-outlined text-base transition-transform group-hover:-translate-x-0.5">
            arrow_back
          </span>
          <span>{t('Kembali ke Katalog', 'Back to Catalog')}</span>
        </button>
      </div>

      {/* ── Shopee-Style Product Card Container ── */}
      <div className="bg-white dark:bg-[#0E1A11] p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-sm mb-12 sm:mb-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

          {/* ─── Kolom Kiri: Galeri Foto Kompak Proporsional (Shopee Style) ─── */}
          <div className="lg:col-span-5 w-full max-w-[420px] mx-auto space-y-3.5">
            
            {/* Foto Utama — Ukuran Terukur & Pas (Tidak Terlalu Besar) */}
            <div className="aspect-square w-full bg-[#FAF7EE] dark:bg-[#122316] rounded-xl sm:rounded-2xl overflow-hidden border border-[#E2EFE0] dark:border-white/10 relative group">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-[#D32F2F] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                    {t('Stok Habis', 'Sold Out')}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery Row (Shopee 5 Thumbnails Grid) */}
            <div className="grid grid-cols-5 gap-2">
              {galleryImages.map((img, idx) => {
                const isSelected = selectedImage === img;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square rounded-lg sm:rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
                      isSelected
                        ? 'border-[#245B3A] dark:border-[#86EFAC] shadow-xs'
                        : 'border-[#E2EFE0] dark:border-white/10 opacity-60 hover:opacity-100 hover:border-[#97B88A]'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>

          </div>

          {/* ─── Kolom Kanan: Detail Produk (Shopee Specs & WA Direct Order) ─── */}
          <div className="lg:col-span-7 flex flex-col space-y-4 sm:space-y-5">

            {/* 1. Nama Produk */}
            <div>
              <span className="inline-block font-['Plus_Jakarta_Sans'] text-[11px] font-bold tracking-widest text-[#245B3A] dark:text-[#86EFAC] uppercase mb-1">
                {product.categoryLabel}
              </span>
              <h1 className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl lg:text-[26px] font-extrabold text-[#14331C] dark:text-[#F4F8F3] leading-snug">
                {product.name}
              </h1>
            </div>

            {/* 3. Strip Harga Menonjol (Shopee Price Highlight Box) */}
            <div className="bg-[#F4F8F2] dark:bg-[#122316] p-4 sm:p-5 rounded-xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.2)] flex items-baseline gap-3 flex-wrap">
              <span className="font-['JetBrains_Mono'] font-black text-2xl sm:text-3xl text-[#245B3A] dark:text-[#86EFAC]">
                Rp {product.price.toLocaleString('id-ID')}
              </span>
              {product.unitInfo && (
                <span className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm font-semibold text-[#556353] dark:text-white/60">
                  / {product.unitInfo}
                </span>
              )}
            </div>

            {/* 4. Shopee Specs Rows (Pengiriman & Jaminan) */}
            <div className="space-y-3 text-xs sm:text-sm pt-1">
              
              {/* Row Pengiriman */}
              <div className="grid grid-cols-12 gap-2 items-start">
                <span className="col-span-3 text-[#556353] dark:text-white/50 font-medium">
                  {t('Pengiriman', 'Shipping')}
                </span>
                <div className="col-span-9 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#14331C] dark:text-white">
                    <span className="material-symbols-outlined text-base text-[#245B3A] dark:text-[#86EFAC]">
                      local_shipping
                    </span>
                    <span>{t('Kirim ke Seluruh Nusantara', 'Nationwide Delivery')}</span>
                  </div>
                </div>
              </div>

              {/* Row Jaminan */}
              <div className="grid grid-cols-12 gap-2 items-start pt-2 border-t border-[#E2EFE0]/60 dark:border-white/5">
                <span className="col-span-3 text-[#556353] dark:text-white/50 font-medium">
                  {t('Jaminan', 'Guarantee')}
                </span>
                <div className="col-span-9 flex items-center gap-2 font-medium text-[#245B3A] dark:text-[#86EFAC] text-xs">
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span>{t('100% Original • Tanpa Pengawet • Higienis', '100% Original • Preservative Free • Hygienic')}</span>
                </div>
              </div>

            </div>

            {/* 5. Deskripsi Produk dengan Toggle */}
            {product.description && (
              <div className="pt-2 border-t border-[#E2EFE0] dark:border-white/10 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#14331C] dark:text-white">
                  {t('Deskripsi Produk', 'Product Description')}
                </h4>
                <p className={`font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#465444] dark:text-[#CBD5C8] leading-relaxed whitespace-pre-line ${
                  !descExpanded ? 'line-clamp-3' : ''
                }`}>
                  {product.description}
                </p>
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="flex items-center gap-1 text-xs font-bold text-[#245B3A] dark:text-[#86EFAC] hover:underline cursor-pointer"
                >
                  <span>
                    {descExpanded ? t('Sembunyikan', 'Show Less') : t('Baca Selengkapnya', 'Read More')}
                  </span>
                  <span
                    className="material-symbols-outlined text-base transition-transform duration-200"
                    style={{ transform: descExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    expand_more
                  </span>
                </button>
              </div>
            )}

            {/* 6. Shopee Quantity Stepper */}
            <div className="pt-3 border-t border-[#E2EFE0] dark:border-white/10 flex items-center gap-4">
              <span className="text-xs sm:text-sm font-semibold text-[#556353] dark:text-white/60">
                {t('Kuantitas', 'Quantity')}
              </span>
              
              <div className="flex items-center border border-[#C5D8C1] dark:border-white/20 rounded-lg overflow-hidden bg-white dark:bg-[#122316]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || product.stock === 0}
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[#14331C] dark:text-white hover:bg-[#F2F7F0] dark:hover:bg-[#162B1C] disabled:opacity-40 cursor-pointer"
                >
                  -
                </button>
                <span className="w-10 text-center text-xs sm:text-sm font-bold text-[#14331C] dark:text-white font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={product.stock === 0}
                  className="w-8 h-8 flex items-center justify-center text-sm font-bold text-[#14331C] dark:text-white hover:bg-[#F2F7F0] dark:hover:bg-[#162B1C] disabled:opacity-40 cursor-pointer"
                >
                  +
                </button>
              </div>

              {product.stock !== 0 && (
                <span className="text-xs text-[#556353] dark:text-white/50">
                  {t('Stok Tersedia', 'In Stock')}
                </span>
              )}
            </div>

            {/* 7. Action Button: Pesan via WhatsApp (Shopee Button Style, Tanpa Proses Checkout Rumit) */}
            <div className="pt-2 flex flex-col items-start sm:items-end">
              <a
                href={orderWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full sm:max-w-md flex items-center justify-center gap-2.5 text-white h-12 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-sm shadow-md hover:shadow-xl active:scale-[0.99] transition-all cursor-pointer ${
                  product.stock === 0
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed pointer-events-none'
                    : 'bg-[#245B3A] hover:bg-[#14331C]'
                }`}
              >
                <span className="material-symbols-outlined text-xl" style={{ color: '#25D366' }}>
                  chat
                </span>
                <span>
                  {product.stock === 0
                    ? t('Stok Habis', 'Sold Out')
                    : `${t('Pesan via WhatsApp', 'Order via WhatsApp')} • Rp ${totalPrice.toLocaleString('id-ID')}`}
                </span>
              </a>
              <p className="text-[11px] text-[#556353] dark:text-white/50 mt-1.5 text-left sm:text-right">
                {t('Pesanan langsung terhubung ke chat admin WhatsApp tanpa proses checkout rumit.', 'Directly connects to admin WhatsApp chat without complex checkout flow.')}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ─── Produk Terkait (Shopee Related Products) ─── */}
      {relatedProducts.length > 0 && (
        <section className="mb-8">
          <div className="mb-5 sm:mb-6">
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-bold text-[#14331C] dark:text-white mb-1">
              {t('Produk Terkait Lainnya', 'Other Related Products')}
            </h2>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#556353] dark:text-white/60">
              {t('Pilihan nutrisi sorgum terbaik untuk keluarga Anda', 'The best sorghum nutrition choices for your family')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  onSelectProduct(rel);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group bg-white dark:bg-[#0E1A11] rounded-[18px] sm:rounded-[22px] overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col relative border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] cursor-pointer hover:border-[#245B3A]/50 dark:hover:border-[#86EFAC]/30 transform hover:-translate-y-1"
              >
                <div className="aspect-square overflow-hidden bg-[#FAF7EE] dark:bg-[#122316] relative border-b border-[#E2EFE0] dark:border-white/10">
                  <img
                    src={rel.image}
                    alt={rel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                <div className="p-3 sm:p-5 flex flex-col flex-grow">
                  <span className="text-[#556353] dark:text-[#86EFAC] font-['Plus_Jakarta_Sans'] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1">
                    {rel.categoryLabel}
                  </span>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-xs sm:text-base font-bold text-[#14331C] dark:text-white mb-1 group-hover:text-[#245B3A] dark:group-hover:text-[#86EFAC] transition-colors leading-snug line-clamp-2">
                    {rel.name}
                  </h3>
                  {rel.unitInfo && (
                    <p className="text-[#556353] dark:text-white/50 font-['Plus_Jakarta_Sans'] text-[10px] sm:text-xs mb-2 sm:mb-3 font-normal">
                      {rel.unitInfo}
                    </p>
                  )}
                  <div className="mt-auto flex justify-between items-center pt-2 sm:pt-3 border-t border-[#E2EFE0] dark:border-white/10">
                    <span className="font-['JetBrains_Mono'] text-xs sm:text-base text-[#245B3A] dark:text-[#86EFAC] font-extrabold">
                      Rp {rel.price.toLocaleString('id-ID')}
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#EAF6E8] dark:bg-[#152718] text-[#245B3A] dark:text-[#86EFAC] flex items-center justify-center group-hover:bg-[#245B3A] group-hover:text-white transition-colors duration-200">
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetailPage;
