import React, { useState, useEffect, Suspense, lazy } from 'react';
import { productApi } from './api/productApi';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { ConnectionErrorModal } from './components/ConnectionErrorModal';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { FaqPage } from './pages/FaqPage';
import { LoginPage } from './pages/LoginPage';
import { Product, Article } from './types';
import { useApp } from './context/AppContext';

const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const TrackingPage = lazy(() => import('./pages/TrackingPage').then(m => ({ default: m.TrackingPage })));

const Fallback = () => <div className="min-h-[50vh] flex items-center justify-center text-[#1B5E20] text-sm">Memuat...</div>;

export function App() {
  const [isAdminPath, setIsAdminPath] = useState(() => window.location.pathname.startsWith('/admin'));
  const [activeTab, setActiveTab] = useState('beranda');

  const { currentUser: user, shopSettings, logout } = useApp();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  useEffect(() => {
    const onPop = () => setIsAdminPath(window.location.pathname.startsWith('/admin'));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigateShop = () => {
    window.history.pushState({}, '', '/');
    setIsAdminPath(false);
    setActiveTab('beranda');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastType(type);
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectArticle = (art: Article) => {
    setSelectedArticle(art);
    setSelectedProduct(null);
    setActiveTab('informasi');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    if (product.id) {
      productApi.getProductById(String(product.id)).then((detail) => {
        if (detail) setSelectedProduct(detail);
      }).catch(() => {});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'tracking' || tab === 'pesanan') {
      setSelectedProduct(null);
      setActiveTab('tracking');
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

  const handleLogout = async () => {
    await logout();
    showToast('Anda telah keluar.');
    setTimeout(() => {
      window.history.pushState({}, '', '/');
      setIsAdminPath(false);
      window.location.reload();
    }, 600);
  };

  if (isAdminPath) {
    if (!user || user.role !== 'admin') {
      return (
        <div className="min-h-screen flex flex-col bg-[#EFECE6]">
          {toastMessage && (
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] text-white px-6 py-3 rounded-xl shadow-2xl border text-xs sm:text-sm font-medium flex items-center gap-2 ${toastType === 'error' ? 'bg-[#D32F2F]' : 'bg-[#2E7D32]'}`}>
              <span>{toastMessage}</span>
            </div>
          )}
          <LoginPage
            onLoginSuccess={(u) => {
              if (u.role === 'admin') {
                showToast('Login admin berhasil');
              } else {
                showToast('Hanya admin yang bisa login di /admin', 'error');
                logout();
              }
            }}
            onNavigateHome={navigateShop}
          />
          <ConnectionErrorModal />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col bg-[#EFECE6]">
        {toastMessage && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] text-white px-6 py-3 rounded-xl shadow-2xl border text-xs sm:text-sm font-medium flex items-center gap-2 ${toastType === 'error' ? 'bg-[#D32F2F]' : 'bg-[#2E7D32]'}`}>
            <span>{toastMessage}</span>
          </div>
        )}
        <Suspense fallback={<Fallback />}>
          <AdminPage user={user} onNavigateHome={navigateShop} onLogout={handleLogout} showToast={showToast} />
        </Suspense>
        <ConnectionErrorModal />
      </div>
    );
  }

  // Public shop
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFDF5] dark:bg-[#08100A] text-[#20352A] dark:text-[#F4F8F3] font-['Plus_Jakarta_Sans'] selection:bg-[#3A8F4B]/20 selection:text-[#3A8F4B] relative pb-16 md:pb-0 transition-colors duration-300">
      {toastMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] text-white px-6 py-3 rounded-full shadow-2xl border text-xs sm:text-sm font-semibold animate-fadeIn flex items-center gap-2 max-w-[90vw] ${toastType === 'error' ? 'bg-[#D32F2F] border-white/20' : toastType === 'info' ? 'bg-[#E3B84B] border-white/20' : 'bg-[#3A8F4B] border-white/20'}`}>
          <span className="material-symbols-outlined text-sm">{toastType === 'error' ? 'error' : toastType === 'info' ? 'info' : 'check_circle'}</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <Header
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        user={null}
        onNavigateAuth={() => {}}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onLogout={handleLogout}
        alwaysSolid={activeTab !== 'beranda' || !!selectedProduct}
      />

      <main className="flex-grow">
        {selectedProduct ? (
          <Suspense fallback={<Fallback />}>
            <ProductDetailPage product={selectedProduct} onSelectProduct={handleSelectProduct} setActiveTab={handleTabChange} />
          </Suspense>
        ) : (
          <Suspense fallback={<Fallback />}>
            {activeTab === 'beranda' && <HomePage onClickProduct={handleSelectProduct} onSelectArticle={handleSelectArticle} setActiveTab={handleTabChange} searchQuery={searchQuery} />}
            {activeTab === 'produk' && <ProductsPage onClickProduct={handleSelectProduct} searchQuery={searchQuery} />}
            {activeTab === 'informasi' && <ArticlesPage selectedArticle={selectedArticle} onClearSelectedArticle={() => setSelectedArticle(null)} />}
            {activeTab === 'faq' && <FaqPage />}
            {activeTab === 'tracking' && <TrackingPage />}
          </Suspense>
        )}
      </main>

      <Footer setActiveTab={handleTabChange} />

      <MobileBottomNav activeTab={activeTab} setActiveTab={handleTabChange} user={null} />

      <ConnectionErrorModal />
    </div>
  );
}
export default App;
