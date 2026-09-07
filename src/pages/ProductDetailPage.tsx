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

  // Gallery images — dari DB (product_images, diedit admin di Kelola Produk).
  // Gambar utama (is_primary) TIDAK diikutkan sebagai thumbnail supaya tidak dobel
  // dengan gambar besar di atas; sisanya (galeri tambahan) maks 4.
  const galleryImages = (product.images && product.images.length
    ? product.images
        .filter((img) => !img.is_primary)
        .map((img) => img.image_url)
    : []
  ).slice(0, 4);
  // Kalau tidak ada galeri non-primary sama sekali → fallback tampilkan gambar utama
  // sebagai thumbnail tunggal (produk lama yang hanya punya 1 foto).
  const effectiveGallery = galleryImages.length ? galleryImages : (product.image ? [product.image] : []);

  // Reset pada pergantian produk
  useEffect(() => {
    setSelectedImage(product.image);
    setDescExpanded(false);
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

  // Harga tampil (tunggal atau rentang)
  const priceDisplay = product.priceMax && product.priceMax > product.price
    ? `Rp ${product.price.toLocaleString('id-ID')} - Rp ${product.priceMax.toLocaleString('id-ID')}`
    : `Rp ${product.price.toLocaleString('id-ID')}`;

  // Nomor tujuan order WA: prioritas nomor pemilik produk (wa_contact), fallback nomor toko global.
  const rawWaNumber = (product.waContact || shopSettings.whatsappNumber || '').replace(/[^0-9]/g, '').replace(/^0/, '62');
  const waNumber = rawWaNumber || '';

  // Pesan order alami ala pembeli yang berminat: sapaan ramah (Kak) + nama produk.
  const orderMessageText =
    `Halo Kak! 👋 Mau tanya untuk produk ${product.name} apakah stoknya masih ada? Kalau ready, saya mau order ya. Terima kasih! 🙏😊`;
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
      <div className="bg-white dark:bg-[#0E1A11] p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-sm mb-12 sm:mb-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ─── Kolom Kiri: Galeri Foto Kompak Proporsional (Shopee Style) ─── */}
          <div className="lg:col-span-5 w-full max-w-[320px] sm:max-w-[350px] mx-auto flex flex-col justify-between space-y-3">
            
            {/* Foto Utama — Ukuran Terukur & Pas */}
            <div className="aspect-square w-full bg-[#FAF7EE] dark:bg-[#122316] rounded-xl sm:rounded-2xl overflow-hidden border border-[#E2EFE0] dark:border-white/10 relative group">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Thumbnail Gallery Row — 1 baris x 4 kolom, selebar gambar utama; kalau gambar <4 slot kosong dibiarkan */}
            <div className="grid grid-cols-4 gap-2">
              {effectiveGallery.map((img, idx) => {
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
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-4">

            {/* Bagian Konten Atas */}
            <div className="space-y-3.5">
              
              {/* 1. Nama & Kategori Produk */}
              <div>
                <span className="inline-block font-['Plus_Jakarta_Sans'] text-[11px] font-bold tracking-widest text-[#245B3A] dark:text-[#86EFAC] uppercase mb-1">
                  {product.categoryLabel}
                </span>
                <h1 className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-extrabold text-[#14331C] dark:text-[#F4F8F3] leading-snug">
                  {product.name}
                </h1>
              </div>

              {/* 2. Harga Produk (Stand Out Tanpa Garis Border) */}
              <div className="py-2 sm:py-2.5 my-0.5 flex items-baseline gap-2.5 flex-wrap">
                <span className="font-['JetBrains_Mono'] font-black text-2xl sm:text-[26px] tracking-tight text-[#245B3A] dark:text-[#86EFAC]">
                  {product.priceMax && product.priceMax > product.price
                    ? `Rp ${product.price.toLocaleString('id-ID')} - Rp ${product.priceMax.toLocaleString('id-ID')}`
                    : `Rp ${product.price.toLocaleString('id-ID')}`}
                </span>
              </div>

              {/* 3. Specs / Info Produk (Berat & Pengiriman) */}
              <div className="pt-1 pb-1 space-y-2">
                {/* Row Berat */}
                {(product.unitInfo || product.weight) && (
                  <div className="grid grid-cols-12 gap-2 items-center text-xs sm:text-sm">
                    <span className="col-span-3 sm:col-span-2 text-[#556353] dark:text-white/50 font-medium">
                      {t('Berat', 'Weight')}
                    </span>
                    <div className="col-span-9 sm:col-span-10 font-semibold text-[#14331C] dark:text-white">
                      {product.unitInfo || product.weight}
                    </div>
                  </div>
                )}

                {/* Row Pengiriman */}
                <div className="grid grid-cols-12 gap-2 items-center text-xs sm:text-sm">
                  <span className="col-span-3 sm:col-span-2 text-[#556353] dark:text-white/50 font-medium">
                    {t('Pengiriman', 'Shipping')}
                  </span>
                  <div className="col-span-9 sm:col-span-10 font-semibold text-[#14331C] dark:text-white">
                    {t('Kirim ke Seluruh Nusantara', 'Nationwide Delivery')}
                  </div>
                </div>
              </div>

              {/* 4. Deskripsi Produk (Minimal 2 Paragraf Sebelum Baca Selengkapnya) */}
              {product.description && (() => {
                const paragraphs = product.description.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
                const hasMore = paragraphs.length > 2 || product.description.length > 350;
                const displayedText = !descExpanded && paragraphs.length > 2
                  ? paragraphs.slice(0, 2).join('\n\n')
                  : product.description;

                return (
                  <div className="pt-2.5 border-t border-[#E2EFE0] dark:border-white/10 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#14331C] dark:text-white">
                      {t('Deskripsi Produk', 'Product Description')}
                    </h4>
                    <p className={`font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#465444] dark:text-[#CBD5C8] leading-relaxed whitespace-pre-line ${
                      !descExpanded && paragraphs.length <= 2 && hasMore ? 'line-clamp-6' : ''
                    }`}>
                      {displayedText}
                    </p>
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => setDescExpanded((v) => !v)}
                        className="text-xs font-bold text-[#245B3A] dark:text-[#86EFAC] hover:underline cursor-pointer pt-0.5 inline-block"
                      >
                        {descExpanded ? t('Sembunyikan', 'Show Less') : t('Baca Selengkapnya', 'Read More')}
                      </button>
                    )}
                  </div>
                );
              })()}

            </div>

            {/* 5. Action Button: Pesan via WhatsApp */}
            <div className="pt-3 border-t border-[#E2EFE0]/60 dark:border-white/5 flex flex-col items-start sm:items-end">
              <a
                href={orderWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto sm:min-w-[270px] sm:max-w-md flex items-center justify-center gap-2 text-white h-11 px-5 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-sm shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer bg-[#245B3A] hover:bg-[#14331C]"
              >
                <span className="material-symbols-outlined text-xl" style={{ color: '#25D366' }}>
                  chat
                </span>
                <span>
                  {t('Pesan via WhatsApp', 'Order via WhatsApp')}
                </span>
              </a>
              <p className="text-[11px] text-[#556353] dark:text-white/50 mt-1.5 text-left sm:text-right">
                {t('Klik untuk chat admin, pesan otomatis terisi produk yang Anda pilih.', 'Click to chat the admin; the message auto-fills with your chosen product.')}
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
                      {rel.priceMax && rel.priceMax > rel.price
                        ? `Rp ${rel.price.toLocaleString('id-ID')} - Rp ${rel.priceMax.toLocaleString('id-ID')}`
                        : `Rp ${rel.price.toLocaleString('id-ID')}`}
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
