import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { productApi } from '../api/productApi';
import { ProductCard } from '../components/ProductCard';

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
  // SEMUA gambar ditampilkan (termasuk gambar utama / is_primary) sebagai
  // thumbnail di bawah foto besar — bukan hanya yang non-primary. Urut sesuai
  // sort_order (gambar utama di posisi pertama).
  const galleryImages = (product.images && product.images.length
    ? product.images.map((img) => img.image_url)
    : []
  ).slice(0, 4);
  // Kalau tidak ada product_images sama sekali → fallback tampilkan gambar utama
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
    `Halo Kak! Mau tanya untuk produk ${product.name} apakah stoknya masih ada? Kalau ready, saya mau order ya. Terima kasih!`;
  const orderWhatsappUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(orderMessageText)}` : '#';

  const cat = (product.categoryLabel || product.category || '').toLowerCase();
  const badgeClass = cat.includes('beras') || cat.includes('biji')
    ? 'bg-[#FAF3E0] text-[#8C5D1E] dark:bg-[#251E14] dark:text-[#FDE68A] border-[#EAD8B8]/60 dark:border-white/10'
    : cat.includes('tepung')
    ? 'bg-[#EBF5EA] text-[#1F5132] dark:bg-[#132616] dark:text-[#86EFAC] border-[#CDE5CA]/60 dark:border-white/10'
    : cat.includes('camilan') || cat.includes('snack') || cat.includes('makanan')
    ? 'bg-[#FDF0EB] text-[#9E4324] dark:bg-[#291712] dark:text-[#FDBA74] border-[#F2D2C6]/60 dark:border-white/10'
    : 'bg-[#F0F5EE] text-[#2B3E1D] dark:bg-[#162418] dark:text-[#A5D6A7] border-[#D6E6D2]/60 dark:border-white/10';

  // Tombol order WhatsApp + teks bantuan.
  // Dirender DUA tempat: di HP tampil tepat di bawah harga (biar tidak terkubur
  // di dasar halaman setelah deskripsi panjang), di desktop tetap di bawah.
  const waOrderCta = (
    <>
      <a
        href={orderWhatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full sm:w-auto sm:min-w-[240px] sm:max-w-md flex items-center justify-center gap-2 text-white h-10 px-5 rounded-lg font-['Plus_Jakarta_Sans'] font-bold text-xs sm:text-sm shadow-xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer bg-[#25D366] hover:bg-[#1EBE5D]"
      >
        <span className="material-symbols-outlined text-lg text-white">
          call
        </span>
        <span>
          {t('Pesan via WhatsApp', 'Order via WhatsApp')}
        </span>
      </a>
      <p className="text-[10px] text-[#556353] dark:text-white/50 mt-1 text-left sm:text-right">
        {t('Klik untuk chat admin, pesan otomatis terisi produk yang Anda pilih.', 'Click to chat the admin; the message auto-fills with your chosen product.')}
      </p>
    </>
  );

  return (
    <main className="pt-4 sm:pt-6 pb-16 md:pb-12 px-4 sm:px-6 md:px-8 max-w-[1140px] mx-auto animate-fadeIn min-h-screen w-full overflow-x-hidden">

      {/* ── Breadcrumb & Tombol Kembali (Di Bawah Breadcrumb) ── */}
      <div className="mb-3 sm:mb-4 flex flex-col items-start gap-2">
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#245B3A] dark:text-[#86EFAC] bg-white/80 dark:bg-[#122316] hover:bg-[#EAF6E8] dark:hover:bg-[#1A3320] border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.2)] px-3 py-1 rounded-full transition-all duration-200 active:scale-95 shadow-2xs cursor-pointer group"
        >
          <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-0.5">
            arrow_back
          </span>
          <span>{t('Kembali ke Katalog', 'Back to Catalog')}</span>
        </button>
      </div>

      {/* ── Shopee-Style Product Card Container ── */}
      <div className="bg-white dark:bg-[#0E1A11] p-4 sm:p-6 md:p-7 rounded-xl sm:rounded-2xl border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] shadow-xs mb-8 sm:mb-10 w-full overflow-hidden">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full">

          {/* ─── Kolom Kiri: Galeri Foto Kompak Proporsional (Shopee Style) ─── */}
          <div className="lg:col-span-5 w-full flex flex-col justify-between space-y-2.5">
            
            {/* Foto Utama — full width di HP, ukuran terukur di desktop */}
            <div className="aspect-square w-full bg-[#FAF7EE] dark:bg-[#122316] rounded-lg sm:rounded-xl overflow-hidden border border-[#E2EFE0] dark:border-white/10 relative group">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Thumbnail Gallery Row */}
            <div className="grid grid-cols-4 gap-1.5 w-full">
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
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-4 min-w-0 w-full">

            {/* Bagian Konten Atas */}
            <div className="space-y-3 min-w-0 w-full">
              
              {/* 1. Nama & Kategori Produk */}
              <div className="min-w-0">
                <div className="mb-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded font-['Plus_Jakarta_Sans'] text-[10px] font-bold uppercase tracking-wider border shadow-2xs ${badgeClass}`}>
                    {product.categoryLabel || product.category}
                  </span>
                </div>
                <h1 className="font-['Plus_Jakarta_Sans'] text-lg sm:text-xl font-extrabold text-[#14331C] dark:text-[#F4F8F3] leading-snug break-words">
                  {product.name}
                </h1>
              </div>

              {/* 2. Harga Produk */}
              <div className="py-1 sm:py-1.5 flex items-baseline gap-2 flex-wrap">
                <span className="font-['JetBrains_Mono'] font-black text-xl sm:text-2xl tracking-tight text-[#245B3A] dark:text-[#86EFAC] break-words">
                  {product.priceMax && product.priceMax > product.price
                    ? `Rp ${product.price.toLocaleString('id-ID')} - Rp ${product.priceMax.toLocaleString('id-ID')}`
                    : `Rp ${product.price.toLocaleString('id-ID')}`}
                </span>
              </div>

              {/* 2b. CTA WhatsApp — HANYA MOBILE */}
              <div className="lg:hidden flex flex-col items-stretch pt-0.5 w-full">
                {waOrderCta}
              </div>

              {/* 3. Specs / Info Produk (Berat & Pengiriman) */}
              <div className="bg-[#F9FBF7] dark:bg-[#122316] p-2.5 sm:p-3 rounded-lg border border-[#E2EFE0] dark:border-[rgba(165,214,167,0.15)] space-y-2 my-1.5 w-full">
                {/* Row Berat */}
                {(product.unitInfo || product.weight) && (
                  <div className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 sm:gap-2 sm:items-center text-xs">
                    <span className="sm:col-span-4 lg:col-span-3 text-[#556353] dark:text-white/50 font-medium flex items-center gap-1.5 shrink-0">
                      <span className="material-symbols-outlined text-[13px] text-[#3A8F4B]">balance</span>
                      <span>{t('Berat / Kemasan', 'Weight / Unit')}</span>
                    </span>
                    <div className="sm:col-span-8 lg:col-span-9 font-bold text-[#14331C] dark:text-white text-xs break-words">
                      {product.unitInfo || product.weight}
                    </div>
                  </div>
                )}

                {/* Row Pengiriman */}
                <div className="flex flex-col sm:grid sm:grid-cols-12 gap-0.5 sm:gap-2 sm:items-center text-xs">
                  <span className="sm:col-span-4 lg:col-span-3 text-[#556353] dark:text-white/50 font-medium flex items-center gap-1.5 shrink-0">
                    <span className="material-symbols-outlined text-[13px] text-[#3A8F4B]">local_shipping</span>
                    <span>{t('Pengiriman', 'Shipping')}</span>
                  </span>
                  <div className="sm:col-span-8 lg:col-span-9 font-semibold text-[#14331C] dark:text-white text-xs break-words">
                    {t('Kirim ke Seluruh Nusantara', 'Nationwide Delivery')}
                  </div>
                </div>
              </div>

              {/* 4. Deskripsi Produk */}
              {product.description && (() => {
                const paragraphs = product.description.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
                const hasMore = paragraphs.length > 2 || product.description.length > 350;
                const displayedText = !descExpanded && paragraphs.length > 2
                  ? paragraphs.slice(0, 2).join('\n\n')
                  : product.description;

                return (
                  <div className="pt-2 border-t border-[#E2EFE0] dark:border-white/10 space-y-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#14331C] dark:text-white">
                      {t('Deskripsi Produk', 'Product Description')}
                    </h4>
                    <p className={`font-['Plus_Jakarta_Sans'] text-xs text-[#465444] dark:text-[#CBD5C8] leading-relaxed whitespace-pre-line ${
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

            {/* 5. Action Button: Pesan via WhatsApp — DESKTOP SAJA */}
            <div className="hidden lg:flex pt-2.5 border-t border-[#E2EFE0]/60 dark:border-white/5 flex-col items-end">
              {waOrderCta}
            </div>

          </div>

        </div>

      </div>

      {/* ─── Produk Terkait (Shopee Related Products) ─── */}
      {relatedProducts.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 sm:mb-4">
            <h2 className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-bold text-[#14331C] dark:text-white mb-0.5">
              {t('Produk Terkait Lainnya', 'Other Related Products')}
            </h2>
            <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#556353] dark:text-white/60">
              {t('Pilihan nutrisi sorgum terbaik untuk keluarga Anda', 'The best sorghum nutrition choices for your family')}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4">
            {relatedProducts.map((rel) => (
              <ProductCard
                key={rel.id}
                product={rel}
                onClickProduct={(selected) => {
                  onSelectProduct(selected);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProductDetailPage;
