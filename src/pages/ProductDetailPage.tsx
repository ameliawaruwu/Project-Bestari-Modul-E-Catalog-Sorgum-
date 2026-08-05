import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { productApi } from '../api/productApi';

interface ProductDetailPageProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onSelectProduct: (product: Product) => void;
  setActiveTab: (tab: string) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onAddToCart,
  onSelectProduct,
  setActiveTab,
  onBuyNow,
}) => {
  const { t, shopSettings, currentUser, isFavorite, toggleWishlist } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [activeInfoTab, setActiveInfoTab] = useState<'spesifikasi' | 'deskripsi' | 'pengiriman'>('spesifikasi');
  const [selectedImage, setSelectedImage] = useState<string>(product.image);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const favorite = isFavorite(product.id);

  const handleToggleFavorite = () => {
    if (!currentUser) {
      setActiveTab('login');
      return;
    }
    toggleWishlist(product.id);
  };

  // Gallery thumbnail images
  const galleryImages = [
    product.image,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAxAom7UgxRzy5wiuynpsvZ83tKJ9gO8T8nqCFbn1eMWTHIqArmPa-76rKpcUeBBcKhNub-FngJ3ajeXJ96RnhfzuANVPHyAJHXyTSDmavrKYPNmNRj9hvdH5XUImI-R_6AKF2fwewgs-QneBabX07o09iC01ygYakq3l4MtvuGDNEGcxvbk_V8EHQALDk4v2gSb70129LevbmxnlGm16_OVQ-3DT4JisSN0jxsuiJVr2OW3UJvEY8',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBafVp-lUk22nkYhS1JGf-xDDuQMXzdvoRx7g_wPR9pXMDzq5Vi6wpCDQf1CVEtsj2MC5FJfISVZ5CQG4r60wWbaLfejpvXXCTDssFJIi5BKiqAQxD449BBRQmyBxBK3IT_AZ1rmXTTacMUjKVKOuvmps1Noa9OBt5ulk5AJquxcwMlqaFoGqI7Idhes5jSi7x7EvJNeaifDmxNTHPar3MVr_L73H5VtxJRof1lDMEfCwU8tN7WfU8',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAXfgzY3a3ytjZ9oN2Thh9dbgQ3O3fVvra6HOUak37j0NzhxCGS-BzYkoDfkscX1gNoVfgUYPdGZzT0Soxp1G8Z5Wr6nPMQDombPoYYX9I1AA_7YgzZ8aTmenwnUfgTTQ7KibDk9a5IPzJupiGe5dq9bhaA3PIcPQgberVoQ6jc4uEVx56LWLS0c-ZpoTflmwEhvwYmISqAY3t_E4YxQvAAHL-BujbrlGXR4vUBH5yWwsUcM9gS9ZM',
  ];

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
    setQuantity(1);
  }, [product]);

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity);
  };

  const handleBuyNowClick = () => {
    onAddToCart(product, quantity);
    if (onBuyNow) {
      onBuyNow(product, quantity);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Halo Bestari, saya ingin bertanya mengenai produk: ${product.name} (Rp ${product.price.toLocaleString('id-ID')})`
  );
  const waNumber = shopSettings.whatsappNumber.replace(/[^0-9]/g, '').replace(/^0/, '62');
  const whatsappUrl = `https://wa.me/${waNumber}?text=${whatsappMessage}`;

  return (
    <main className="pt-24 pb-16 px-4 md:px-10 max-w-[1280px] mx-auto animate-fadeIn min-h-screen">
      {/* Tombol Kembali */}
      <button
        onClick={() => setActiveTab('produk')}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-[#162809] hover:text-[#2b3e1d] transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-xl">arrow_back</span>
        <span>{t('Kembali', 'Back')}</span>
      </button>

      {/* Breadcrumb Navigation */}
      <nav className="mb-8 flex items-center space-x-2 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f]">
        <button
          onClick={() => setActiveTab('beranda')}
          className="hover:underline text-[#162809] font-medium cursor-pointer"
        >
          Beranda
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <button
          onClick={() => setActiveTab('produk')}
          className="hover:underline text-[#162809] font-medium cursor-pointer"
        >
          Produk
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-semibold text-[#1d1b17] truncate max-w-[200px] sm:max-w-none">
          {product.name}
        </span>
      </nav>

      {/* Main Top Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mb-16">
        {/* Left: Product Gallery */}
        <div className="md:col-span-5 space-y-6 max-w-md w-full mx-auto md:mx-0">
          <div className="aspect-square bg-[#e7e2db] rounded-2xl overflow-hidden shadow-sm border border-[#c4c8bc]/30 relative">
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
                  className={`aspect-square rounded-xl bg-[#e7e2db] overflow-hidden cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-[#162809] ring-offset-2 scale-[1.02]'
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
            <div className="mb-3">
              <span className="bg-[#fade88] text-[#756118] font-['Plus_Jakarta_Sans'] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                {product.badge || 'PREMIUM FINE GRADE'}
              </span>
            </div>

            {/* Product Title */}
            <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1d1b17] mb-4">
              {product.name}
            </h1>

            {/* Price & Stock */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              {product.originalPrice ? (
                <div className="flex items-center gap-2">
                  <span className="font-['Playfair_Display'] font-bold text-2xl sm:text-3xl text-[#162809]">
                    Rp {product.price.toLocaleString('id-ID')}
                  </span>
                  <span className="font-['Playfair_Display'] text-lg text-gray-400 line-through">
                    Rp {product.originalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              ) : (
                <span className="font-['Playfair_Display'] font-bold text-2xl sm:text-3xl text-[#162809]">
                  Rp {product.price.toLocaleString('id-ID')}
                </span>
              )}
              <span className="bg-[#d2eabb] text-[#0e2004] font-['Plus_Jakarta_Sans'] text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0e2004] inline-block animate-pulse"></span>
                {t('Stok Tersedia', 'In Stock')}
              </span>
            </div>

            {/* Description */}
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm md:text-base text-[#44483f] mb-8 leading-relaxed font-normal">
              {product.description}
            </p>

            {/* Quantity Selector */}
            <div className="mb-8">
              <label className="block text-xs font-bold text-[#44483f] mb-3 uppercase tracking-wider">
                {t('JUMLAH', 'QUANTITY')}
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDecrement}
                  className="w-12 h-12 flex items-center justify-center border border-[#75786e]/40 rounded-xl hover:bg-[#e7e2db] active:scale-95 transition-all text-[#1d1b17] cursor-pointer"
                  aria-label={t('Kurangi jumlah', 'Decrease quantity')}
                >
                  <span className="material-symbols-outlined text-xl">remove</span>
                </button>
                <span className="w-16 h-12 flex items-center justify-center bg-[#e7e2db] rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-base text-[#1d1b17] select-none">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="w-12 h-12 flex items-center justify-center border border-[#75786e]/40 rounded-xl hover:bg-[#e7e2db] active:scale-95 transition-all text-[#1d1b17] cursor-pointer"
                  aria-label={t('Tambah jumlah', 'Increase quantity')}
                >
                  <span className="material-symbols-outlined text-xl">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-[#c4c8bc]/30">
            {/* Favorite Button — HANYA icon hati yg berubah (fill merah saat favorit),
                button & teks TETAP sama. */}
            <button
              onClick={handleToggleFavorite}
              className="w-full flex items-center justify-center gap-2 border-2 h-12 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-xs sm:text-sm transition-all active:scale-[0.98] cursor-pointer border-[#75786e]/40 text-[#44483f] hover:border-red-400 hover:text-red-500"
            >
              <span className={`material-symbols-outlined text-xl ${favorite ? 'text-red-500' : ''}`}>{favorite ? 'favorite' : 'favorite_border'}</span>
              <span>
                {favorite
                  ? t('Hapus dari Favorit', 'Remove from Favorites')
                  : t('Tambah ke Favorit', 'Add to Favorites')}
              </span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleAddToCartClick}
                className="bg-[#2b3e1d] hover:bg-[#162809] text-white h-14 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-sm sm:text-base shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 btn-hover-effect cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">shopping_cart</span>
                <span>{t('Tambah ke Keranjang', 'Add to Cart')}</span>
              </button>

              <button
                onClick={handleBuyNowClick}
                className="bg-[#715c13] hover:bg-[#574500] text-white h-14 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-sm sm:text-base shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 btn-hover-effect cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">bolt</span>
                <span>{t('Beli Sekarang', 'Buy Now')}</span>
              </button>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 border-2 border-[#2b3e1d] text-[#2b3e1d] hover:bg-[#2b3e1d] hover:text-white h-14 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl" style={{ color: '#25D366' }}>
                chat
              </span>
              <span>{t('Hubungi via WhatsApp', 'Contact via WhatsApp')}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Info Tabs Section (Spesifikasi, Deskripsi, Pengiriman) */}
      <section className="bg-[#e7e2db] rounded-2xl p-6 sm:p-10 mb-16 shadow-sm border border-[#c4c8bc]/30">
        <div className="flex space-x-6 sm:space-x-10 border-b border-[#c4c8bc]/50 mb-8 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveInfoTab('spesifikasi')}
            className={`pb-4 font-['Playfair_Display'] text-lg sm:text-xl font-bold border-b-2 transition-all cursor-pointer ${
              activeInfoTab === 'spesifikasi'
                ? 'border-[#162809] text-[#162809]'
                : 'border-transparent text-[#44483f] hover:text-[#162809]'
            }`}
          >
            Spesifikasi
          </button>
          <button
            onClick={() => setActiveInfoTab('deskripsi')}
            className={`pb-4 font-['Playfair_Display'] text-lg sm:text-xl font-bold border-b-2 transition-all cursor-pointer ${
              activeInfoTab === 'deskripsi'
                ? 'border-[#162809] text-[#162809]'
                : 'border-transparent text-[#44483f] hover:text-[#162809]'
            }`}
          >
            Deskripsi
          </button>
          <button
            onClick={() => setActiveInfoTab('pengiriman')}
            className={`pb-4 font-['Playfair_Display'] text-lg sm:text-xl font-bold border-b-2 transition-all cursor-pointer ${
              activeInfoTab === 'pengiriman'
                ? 'border-[#162809] text-[#162809]'
                : 'border-transparent text-[#44483f] hover:text-[#162809]'
            }`}
          >
            Pengiriman
          </button>
        </div>

        {/* Tab 1: Spesifikasi — dari DB (admin Kelola Produk) */}
        {activeInfoTab === 'spesifikasi' && (
          <div className="animate-fadeIn font-['Plus_Jakarta_Sans']">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
              <div className="flex justify-between border-b border-[#c4c8bc]/30 py-3">
                <dt className="text-[#44483f] text-sm sm:text-base">Kemasan / Berat</dt>
                <dd className="font-semibold text-[#1d1b17] text-sm sm:text-base">
                  {product.unitInfo || product.weight || '1kg'}
                </dd>
              </div>
              <div className="flex justify-between border-b border-[#c4c8bc]/30 py-3">
                <dt className="text-[#44483f] text-sm sm:text-base">Komposisi</dt>
                <dd className="font-semibold text-[#1d1b17] text-sm sm:text-base">
                  {product.composition || '100% Sorgum'}
                </dd>
              </div>
              <div className="flex justify-between border-b border-[#c4c8bc]/30 py-3">
                <dt className="text-[#44483f] text-sm sm:text-base">Atribut Produk</dt>
                <dd className="font-semibold text-[#1d1b17] text-sm sm:text-base">
                  {product.attributes || '-'}
                </dd>
              </div>
              <div className="flex justify-between border-b border-[#c4c8bc]/30 py-3">
                <dt className="text-[#44483f] text-sm sm:text-base">Masa Simpan</dt>
                <dd className="font-semibold text-[#1d1b17] text-sm sm:text-base">
                  {product.shelfLife || '12 Bulan'}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Tab 2: Deskripsi — dari DB (admin Kelola Produk) */}
        {activeInfoTab === 'deskripsi' && (
          <div className="animate-fadeIn font-['Plus_Jakarta_Sans'] text-xs sm:text-sm md:text-base text-[#44483f] space-y-4 leading-relaxed max-w-4xl font-normal">
            <p>{product.description || `Deskripsi produk ${product.name} belum diisi.`}</p>
          </div>
        )}

        {/* Tab 3: Pengiriman */}
        {activeInfoTab === 'pengiriman' && (
          <div className="animate-fadeIn font-['Plus_Jakarta_Sans'] text-xs sm:text-sm md:text-base text-[#44483f] space-y-6 font-normal">
            {product.shippingInfo ? (
              <div className="bg-white/45 p-4 rounded-xl border border-[#c4c8bc]/40 shadow-2xs flex items-start gap-4">
                <span className="material-symbols-outlined text-[#162809] text-2xl mt-0.5">
                  local_shipping
                </span>
                <div>
                  <h4 className="font-bold text-[#1d1b17] mb-0.5 font-['Playfair_Display'] text-base">Informasi Pengiriman</h4>
                  <p className="text-[#44483f] mt-1 leading-relaxed">{product.shippingInfo}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#162809] text-2xl mt-0.5">
                    location_on
                  </span>
                  <div>
                    <h4 className="font-bold text-[#1d1b17] mb-0.5">Asal Pengiriman</h4>
                    <p className="text-[#44483f]">Yogyakarta, Indonesia</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#162809] text-2xl mt-0.5">
                    local_shipping
                  </span>
                  <div>
                    <h4 className="font-bold text-[#1d1b17] mb-0.5">Kurir Terpercaya</h4>
                    <p className="text-[#44483f]">JNE, J&amp;T Express, SiCepat, Anteraja</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#162809] text-2xl mt-0.5">
                    schedule
                  </span>
                  <div>
                    <h4 className="font-bold text-[#1d1b17] mb-0.5">Estimasi Pengiriman</h4>
                    <p className="text-[#44483f]">
                      Pesanan sebelum jam 15:00 WIB diproses di hari yang sama.
                      <br />
                      Estimasi: Jabodetabek (1-2 hari kerja), Luar Jabodetabek (3-5 hari kerja).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[#162809] text-2xl mt-0.5">
                    inventory_2
                  </span>
                  <div>
                    <h4 className="font-bold text-[#1d1b17] mb-0.5">Standar Packing</h4>
                    <p className="text-[#44483f]">
                      Kemasan ekstra aman dengan bubble wrap tebal dan dus ramah lingkungan.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Produk Terkait (Related Products) */}
      {relatedProducts.length > 0 && (
        <section className="mb-16">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold text-[#1d1b17] mb-1">
                Produk Terkait
              </h2>
              <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f]">
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
                className="bg-white rounded-2xl p-4 border border-[#c4c8bc]/30 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col justify-between btn-hover-effect"
              >
                <div>
                  <div className="aspect-square bg-[#e7e2db] rounded-xl overflow-hidden mb-4 relative">
                    <img
                      src={rel.image}
                      alt={rel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {rel.badge && (
                      <span className="absolute top-2 right-2 bg-[#fade88] text-[#756118] px-2 py-0.5 rounded-md font-['Plus_Jakarta_Sans'] text-[10px] font-bold">
                        {rel.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-['Playfair_Display'] font-bold text-base text-[#1d1b17] mb-1 group-hover:text-[#162809] transition-colors">
                    {rel.name}
                  </h3>
                  <p className="font-['Plus_Jakarta_Sans'] text-xs text-[#75786e] mb-3 font-medium">
                    {rel.unitInfo}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#c4c8bc]/20">
                  <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#162809]">
                    Rp {rel.price.toLocaleString('id-ID')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(rel, 1);
                    }}
                    className="w-9 h-9 rounded-xl bg-[#2b3e1d] text-white flex items-center justify-center hover:bg-[#162809] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">shopping_cart</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
