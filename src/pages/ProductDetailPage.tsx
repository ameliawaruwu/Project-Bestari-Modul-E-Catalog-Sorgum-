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

  // Gallery images — dari DB (product_images, diedit admin di Kelola Produk).
  // Urutan: sort_order ASC; kalau kosong fallback ke gambar utama produk.
  const galleryImages = (product.images && product.images.length
    ? product.images.map((img) => img.image_url)
    : [product.image]
  ).slice(0, 4);

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

  useEffect(() => {
    setSelectedImage(product.image);
  }, [product]);

  const whatsappMessage = encodeURIComponent(
    `Halo Sorgum, saya ingin bertanya/memesan produk: ${product.name} (Rp ${product.price.toLocaleString('id-ID')})`
  );
  const waNumber = shopSettings.whatsappNumber.replace(/[^0-9]/g, '').replace(/^0/, '62');
  const whatsappUrl = `https://wa.me/${waNumber}?text=${whatsappMessage}`;

  return (
    <main className="pt-24 pb-16 px-4 md:px-10 max-w-[1280px] mx-auto animate-fadeIn min-h-screen">
      {/* Tombol Kembali */}
      <button
        onClick={() => setActiveTab('produk')}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-[#1B5E20] hover:text-[#2E7D32] transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-xl">arrow_back</span>
        <span>{t('Kembali', 'Back')}</span>
      </button>

      {/* Breadcrumb Navigation */}
      <nav className="mb-8 flex items-center space-x-2 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555]">
        <button
          onClick={() => setActiveTab('beranda')}
          className="hover:underline text-[#1B5E20] font-medium cursor-pointer"
        >
          Beranda
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <button
          onClick={() => setActiveTab('produk')}
          className="hover:underline text-[#1B5E20] font-medium cursor-pointer"
        >
          Produk
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-semibold text-[#1B5E20] truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Main Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-16">
        {/* Left: Product Gallery */}
        <div className="md:col-span-5 space-y-6 max-w-md w-full mx-auto md:mx-0">
          <div className="aspect-square bg-[#F7F8F6] rounded-2xl overflow-hidden shadow-2xs border border-[#E0E0E0] relative">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {galleryImages.map((img, idx) => {
              const isSelected = selectedImage === img;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-square rounded-xl bg-[#F7F8F6] overflow-hidden cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-[#1B5E20] ring-offset-2 scale-[1.02]'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Product Details & Actions */}
        <div className="md:col-span-7 flex flex-col justify-between">
          <div>
            {/* Category / Badge Label */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] font-['Plus_Jakarta_Sans'] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                {product.badge || 'PREMIUM FINE GRADE'}
              </span>
            </div>

            {/* Product Title */}
            <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1B5E20] mb-4">
              {product.name}
            </h1>

            {/* Price & Stock */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <span className="font-['Playfair_Display'] font-bold text-2xl sm:text-3xl text-[#1B5E20]">
                Rp {product.price.toLocaleString('id-ID')}
              </span>
              {product.stock === 0 ? (
                <span className="bg-[#FFEBEE] text-[#D32F2F] border border-[#FFCDD2] font-['Plus_Jakarta_Sans'] text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D32F2F] inline-block"></span>
                  {t('Habis', 'Sold Out')}
                </span>
              ) : (
                <span className="bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] font-['Plus_Jakarta_Sans'] text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D32] inline-block animate-pulse"></span>
                  {t('Stok Tersedia', 'In Stock')}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm md:text-base text-[#555555] mb-8 leading-relaxed font-normal">
              {product.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-[#E0E0E0]">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center justify-center gap-2 text-white h-14 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-sm sm:text-base shadow-2xs active:scale-[0.98] transition-all cursor-pointer ${
                product.stock === 0 ? 'bg-gray-300 cursor-not-allowed pointer-events-none' : 'bg-[#2E7D32] hover:bg-[#1B5E20]'
              }`}
            >
              <span className="material-symbols-outlined text-2xl" style={{ color: '#25D366' }}>
                chat
              </span>
              <span>{product.stock === 0 ? t('Stok Habis', 'Out of Stock') : t('Pesan via WhatsApp', 'Order via WhatsApp')}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Produk Terkait (Related Products) */}
      {relatedProducts.length > 0 && (
        <section className="mb-16">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[#1B5E20] mb-1">
                Produk Terkait
              </h2>
              <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555]">
                Lengkapi kebutuhan nutrisi harian Anda
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <div
                key={rel.id}
                onClick={() => {
                  onSelectProduct(rel);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E0E0E0] shadow-2xs hover:shadow-md hover:border-[#2E7D32]/50 transition-all duration-300 group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square bg-[#F7F8F6] rounded-xl overflow-hidden mb-4 relative">
                    <img
                      src={rel.image}
                      alt={rel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {rel.badge && (
                      <span className="absolute top-2 right-2 bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] px-2 py-0.5 rounded-md font-['Plus_Jakarta_Sans'] text-[10px] font-bold">
                        {rel.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-['Playfair_Display'] font-bold text-base text-[#1B5E20] mb-1 group-hover:text-[#2E7D32] transition-colors">
                    {rel.name}
                  </h3>
                  <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#555555] mb-3 font-medium">
                    {rel.unitInfo}
                  </p>
                </div>

                <div className="flex items-center pt-2 border-t border-[#E0E0E0]">
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1B5E20]">
                    Rp {rel.price.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
