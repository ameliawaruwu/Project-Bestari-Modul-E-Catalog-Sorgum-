import React, { useState, useEffect } from 'react';
import { productApi } from './api/productApi';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ConnectionErrorModal } from './components/ConnectionErrorModal';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { FaqPage } from './pages/FaqPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { QrisPaymentPage } from './pages/QrisPaymentPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { Product, Article, CartItem, User, Order } from './types';
import { useApp } from './context/AppContext';

const PROTECTED_TABS = [
  'keranjang',
  'checkout',
  'qris-pembayaran',
  'pesanan-berhasil',
  'profil',
  'pesanan',
  'favorit',
  'pengaturan',
  'admin',
];

export function App() {
  const [activeTab, setActiveTab] = useState('beranda');
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null);

  const {
    currentUser: user,
    cart,
    addToCart,
    updateCartQuantity,
    removeCartItem,
    clearCart,
    resetCartLocal,
    shopSettings,
    logout,
    addOrder,
    t
  } = useApp();

  // Konversi 0→62 biar wa.me pakai format internasional (konsisten dgn QrisPaymentPage/ProductDetailPage).
  const cleanWaNumber = shopSettings.whatsappNumber.replace(/[^0-9]/g, '').replace(/^0/, '62');
  const waUrl = `https://wa.me/${cleanWaNumber}`;
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Guard protected routes when user is not logged in
  useEffect(() => {
    if (!user && PROTECTED_TABS.includes(activeTab)) {
      setSelectedProduct(null);
      setRedirectAfterLogin(activeTab);
      setActiveTab('login');
    }
    // Admin: enforce cuma panel admin (atau profil). Kalau reload/nyangkut di beranda/produk
    // sebagai admin → lempar balik ke panel admin.
    if (user?.role === 'admin' && activeTab !== 'admin' && activeTab !== 'profil') {
      setActiveTab('admin');
    }
  }, [user, activeTab]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastType(type);
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    if (!user) {
      showToast('Silakan masuk (login) terlebih dahulu untuk menambahkan produk.');
      setRedirectAfterLogin(activeTab);
      setActiveTab('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    addToCart(product, quantity);
    showToast(`${product.name} ditambahkan ke keranjang.`);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    updateCartQuantity(productId, delta);
  };

  const handleRemoveCartItem = (productId: string) => {
    removeCartItem(productId);
    showToast('Produk dihapus dari keranjang.');
  };

  const handleClearCart = () => {
    clearCart();
    showToast('Keranjang telah dikosongkan.');
  };

  const handleSelectArticle = (art: Article) => {
    setSelectedArticle(art);
    setSelectedProduct(null);
    setActiveTab('informasi');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    // Guest BOLEH lihat detail produk & tambah ke keranjang (guest cart server-side
    // via x-session-id). Saat login/register, keranjang guest di-merge otomatis.
    // (Keputusan 2026-08-18: sebelumnya guest diblokir ke login — tapi C2-1
    // "merge cart guest" tidak pernah terpakai karena guest tak bisa belanja.)
    setSelectedProduct(product);
    if (product.id) {
      productApi.getProductById(String(product.id)).then((detail) => {
        if (detail) setSelectedProduct(detail);
      }).catch(() => {});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: string) => {
    // Non-admin user: gak boleh akses halaman admin
    if (tab === 'admin' && user?.role !== 'admin') {
      setActiveTab('beranda');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // Admin: gak boleh akses halaman user (beranda/produk/dll) — kunci di admin
    if (user?.role === 'admin' && tab !== 'admin' && tab !== 'profil') {
      setActiveTab('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!user && PROTECTED_TABS.includes(tab)) {
      setRedirectAfterLogin(tab);
      setActiveTab('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'informasi' && activeTab !== 'informasi') {
      setSelectedArticle(null);
    }
    setSelectedProduct(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCartPage = () => {
    if (!user) {
      showToast('Silakan masuk (login) terlebih dahulu untuk membuka keranjang belanja.');
      setRedirectAfterLogin('keranjang');
      setActiveTab('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSelectedProduct(null);
    setActiveTab('keranjang');
    setIsCartOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckoutFromDrawer = () => {
    setIsCartOpen(false);
    if (!user) {
      setRedirectAfterLogin('checkout');
      setActiveTab('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSelectedProduct(null);
    setActiveTab('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderComplete = async (order: Order, paymentMethod: 'cod' | 'qris') => {
    setCompletedOrder(order);
    addOrder(order);
    // Cart SUDAH dihapus BE saat order dibuat (checkout consume cart_items).
    // Jangan clearCart() (kirim DELETE ke server → 404 karena item sudah tidak ada).
    // Reset state lokal saja.
    resetCartLocal();

    setSelectedProduct(null);

    if (paymentMethod === 'qris') {
      showToast('Pesanan dibuat. Silakan selesaikan pembayaran QRIS.');
      setActiveTab('qris-pembayaran');
    } else {
      showToast('Pesanan COD Anda berhasil diproses!');
      setActiveTab('pesanan-berhasil');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    showToast('Anda telah keluar.');
    // Refresh page biar semua state bersih — efek "benar-benar keluar"
    setTimeout(() => window.location.reload(), 600);
  };

  const handleAuthSuccess = (loggedInUser: User) => {
    // User non-admin TIDAK boleh diarahkan ke panel admin meski redirectAfterLogin === 'admin'
    // (mis. sempat akses tab admin saat logout → guard effect set redirectAfterLogin='admin',
    // lalu login sebagai user biasa → tanpa guard ini dia kelempark ke admin panel).
    const target =
      loggedInUser.role === 'admin'
        ? 'admin'
        : redirectAfterLogin && redirectAfterLogin !== 'admin'
          ? redirectAfterLogin
          : 'produk'; // user non-admin setelah login → ke produk
    setRedirectAfterLogin(null);
    setActiveTab(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#EFECE6] text-[#1B5E20] font-['Poppins'] selection:bg-[#fde08b] selection:text-[#231b00] relative pb-16 md:pb-0">
      {/* Toast Notification — top center (hijau=sukses, merah=error) */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] text-white px-6 py-3 rounded-xl shadow-2xl border text-xs sm:text-sm font-['Poppins'] font-medium animate-fadeIn flex items-center gap-2 max-w-[90vw] ${
          toastType === 'error'
            ? 'bg-[#D32F2F] border-[#FFCDD2]/60'
            : toastType === 'info'
            ? 'bg-[#C89B3C] border-[#fade88]/60'
            : 'bg-[#2E7D32] border-[#fade88]/40'
        }`}>
          <span className={`material-symbols-outlined ${toastType === 'error' ? 'text-[#FFCDD2]' : 'text-[#fde08b]'}`}>
            {toastType === 'error' ? 'error' : toastType === 'info' ? 'info' : 'check_circle'}
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header */}
      {activeTab !== 'login' && activeTab !== 'register' && activeTab !== 'admin' && (
        <Header
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          cartCount={totalCartCount}
          onOpenCart={handleOpenCartPage}
          user={user}
          onNavigateAuth={(mode) => {
            setSelectedProduct(null);
            setActiveTab(mode);
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onLogout={handleLogout}
          alwaysSolid={activeTab !== 'beranda' || !!selectedProduct}
        />
      )}

      {/* Dynamic View Routing */}
      <main className="flex-grow">
        {selectedProduct && activeTab !== 'login' && activeTab !== 'register' ? (
          <ProductDetailPage
            product={selectedProduct}
            onAddToCart={(p, q) => handleAddToCart(p, q)}
            onSelectProduct={handleSelectProduct}
            setActiveTab={handleTabChange}
            onBuyNow={() => {
              setSelectedProduct(null);
              if (!user) {
                setRedirectAfterLogin('checkout');
                setActiveTab('login');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
              }
              setActiveTab('checkout');
            }}
          />
        ) : (
          <>
            {activeTab === 'beranda' && (
              <HomePage
                onClickProduct={handleSelectProduct}
                onSelectArticle={handleSelectArticle}
                setActiveTab={handleTabChange}
                searchQuery={searchQuery}
              />
            )}

            {activeTab === 'produk' && (
              <ProductsPage
                onClickProduct={handleSelectProduct}
                searchQuery={searchQuery}
                onRequireLogin={() => {
                  showToast('Silakan masuk (login) terlebih dahulu untuk menambahkan ke favorit.');
                  setRedirectAfterLogin('favorit');
                  setActiveTab('login');
                }}
              />
            )}

            {activeTab === 'informasi' && (
              <ArticlesPage
                selectedArticle={selectedArticle}
                onClearSelectedArticle={() => setSelectedArticle(null)}
              />
            )}

            {activeTab === 'faq' && <FaqPage />}

            {activeTab === 'keranjang' && (
              <CartPage
                cart={cart}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveCartItem}
                onClearCart={handleClearCart}
                onNavigateProducts={() => handleTabChange('produk')}
                onNavigateCheckout={() => handleTabChange('checkout')}
                onSelectProduct={handleSelectProduct}
              />
            )}

            {activeTab === 'checkout' && (
              <CheckoutPage
                cart={cart}
                onNavigateCart={() => handleTabChange('keranjang')}
                onOrderComplete={handleOrderComplete}
                showToast={showToast}
              />
            )}

            {activeTab === 'qris-pembayaran' && (
              <QrisPaymentPage
                order={completedOrder}
                onCompleteOrder={() => handleTabChange('pesanan-berhasil')}
              />
            )}

            {activeTab === 'pesanan-berhasil' && (
              <OrderSuccessPage
                order={completedOrder}
                onNavigateHome={() => handleTabChange('beranda')}
              />
            )}

            {activeTab === 'admin' && (
              <AdminPage
                user={user}
                onNavigateHome={() => setActiveTab('beranda')}
                onLogout={handleLogout}
                showToast={showToast}
              />
            )}

            {['profil', 'pesanan', 'favorit', 'pengaturan'].includes(activeTab) && (
              <ProfilePage
                user={user}
                initialTab={activeTab as 'profil' | 'pesanan' | 'favorit' | 'pengaturan'}
                onLogout={handleLogout}
                onNavigateProducts={() => setActiveTab('produk')}
                onAddToCart={(p) => handleAddToCart(p, 1)}
                showToast={showToast}
                onNavigateAdmin={() => setActiveTab('admin')}
              />
            )}

            {activeTab === 'login' && (
              <LoginPage
                onLoginSuccess={handleAuthSuccess}
                onNavigateRegister={() => setActiveTab('register')}
                onNavigateHome={() => handleTabChange('beranda')}
                onNavigateForgot={() => setActiveTab('forgot-password')}
              />
            )}

            {activeTab === 'register' && (
              <RegisterPage
                onRegisterSuccess={handleAuthSuccess}
                onNavigateLogin={() => setActiveTab('login')}
                onNavigateHome={() => handleTabChange('beranda')}
                onNavigateProducts={() => handleTabChange('produk')}
              />
            )}

            {activeTab === 'forgot-password' && (
              <ForgotPasswordPage
                onBackToLogin={() => setActiveTab('login')}
                onNavigateHome={() => handleTabChange('beranda')}
                onNavigateRegister={() => setActiveTab('register')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      {activeTab !== 'login' && activeTab !== 'register' && activeTab !== 'forgot-password' && activeTab !== 'admin' && (
        <Footer setActiveTab={handleTabChange} />
      )}

      {/* Sticky Bottom Navigation for Mobile Devices */}
      {activeTab !== 'login' && activeTab !== 'register' && activeTab !== 'forgot-password' && activeTab !== 'admin' && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          cartCount={totalCartCount}
          onOpenCart={handleOpenCartPage}
          user={user}
        />
      )}

      {/* Floating WhatsApp Button — tampil di semua halaman (user & guest),
          kecuali halaman auth (login/register/forgot) & admin */}
      {activeTab !== 'login' && activeTab !== 'register' && activeTab !== 'forgot-password' && activeTab !== 'admin' && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-6 lg:bottom-6 z-40 transition-all hover:scale-110 flex items-center justify-center cursor-pointer group animate-wa-pulse rounded-full"
          title="Hubungi kami via WhatsApp"
        >
          <svg viewBox="0 0 90 90" className="w-14 h-14 drop-shadow-md">
            <path fill="#FFF" d="M45 0C20.1 0 0 20.1 0 45c0 8.6 2.4 16.6 6.6 23.5L1.5 88.5l20.8-5.5C29 87.4 36.8 89.8 45 89.8 69.9 89.8 90 69.7 90 45 90 20.1 69.9 0 45 0z" />
            <path fill="#25D366" d="M45 8C24.6 8 8 24.6 8 45c0 7.1 2 13.7 5.5 19.4L9.5 78.5l14.7-3.9c5.4 3.1 11.7 4.9 18.5 4.9 20.4 0 37-16.6 37-37S65.4 8 45 8z" />
            <path fill="#FFF" d="M59.3 50.8c-.8-.4-4.7-2.3-5.5-2.6-.8-.3-1.4-.4-2 .5-.6.9-2.3 2.9-2.8 3.5-.5.6-1 1.2-1.8.8-3.4-1.7-6-3-8.6-5.5-2-1.7-3.4-3.8-3.8-4.5-.4-.7-.1-1.1.2-1.4.3-.3.6-.7.9-1 .3-.3.4-.6.6-1 .2-.4.1-.7-.1-.9-.2-.2-1.4-3.4-2-4.7-.5-1.3-1.1-1.1-1.6-1.1h-1.3c-.5 0-1.2.2-1.9.9-2.3 2.5-3 6.1-1.6 9.6 2.9 7.4 8.7 13.5 15.6 17.2 2.6 1.4 5 2.1 7.5 2.1 3.5 0 6.6-1.5 8.7-4.1.8-1 1.5-2.2 1.5-3.5.1-.2 0-.4-.1-.5l-.8-.4z" />
          </svg>
          {/* Animated Call to Action Bubble */}
          <div className="absolute right-full mr-3 bottom-2 bg-white text-[#1B5E20] border border-emerald-400 text-[10px] font-extrabold px-3 py-1.5 rounded-2xl shadow-md whitespace-nowrap flex items-center gap-1.5 animate-bubble-slide shadow-emerald-500/10 pointer-events-none">
            <span className="w-2 h-2 bg-[#25d366] rounded-full animate-ping" />
            <span>Tanya Kami via WA 💬</span>
          </div>
        </a>
      )}

      {/* Cart Drawer Overlay */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckoutFromDrawer}
      />

      {/* Connection Error Modal — global pop-up saat backend tidak bisa dihubungi */}
      <ConnectionErrorModal />
    </div>
  );
}
export default App;

