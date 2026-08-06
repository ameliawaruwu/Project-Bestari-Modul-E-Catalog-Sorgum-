import React from 'react';
import { useApp } from '../context/AppContext';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const { t, shopSettings } = useApp();

  return (
    <footer className="w-full py-16 lg:py-20 px-4 md:px-10 bg-[#1B5E20] text-white border-t border-[#A5D6A7]/20">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12 lg:gap-16">
        <div className="max-w-sm">
          <span className="font-['Playfair_Display'] text-2xl lg:text-3xl font-semibold text-white mb-4 block">
            {shopSettings.storeName || 'SORGUM'}
          </span>
          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-white/90 leading-relaxed mb-6">
            {t(
              'Pelopor produk sorgum berkualitas tinggi di Indonesia. Kami berdedikasi untuk kesehatan Anda dan keberlanjutan bumi melalui inovasi pangan lokal.',
              'Pioneer of high-quality sorghum products in Indonesia. We are dedicated to your health and the sustainability of the earth through local food innovation.'
            )}
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#2E7D32] hover:border-[#2E7D32] transition-all text-white cursor-pointer"
              aria-label="QR Code"
            >
              <span className="material-symbols-outlined text-xl">qr_code_2</span>
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#2E7D32] hover:border-[#2E7D32] transition-all text-white cursor-pointer"
              aria-label="Instagram Camera"
            >
              <span className="material-symbols-outlined text-xl">camera</span>
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#2E7D32] hover:border-[#2E7D32] transition-all text-white cursor-pointer"
              aria-label="YouTube Play"
            >
              <span className="material-symbols-outlined text-xl">play_circle</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12 flex-grow">
          <div>
            <h5 className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#C89B3C] mb-4 uppercase tracking-widest">
              {t('Navigasi', 'Navigation')}
            </h5>
            <ul className="space-y-3 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => setActiveTab('produk')}
                  className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer"
                >
                  {t('Katalog Produk', 'Product Catalog')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('informasi')}
                  className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer"
                >
                  {t('Informasi & Artikel', 'Info & Articles')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('beranda')}
                  className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer"
                >
                  {t('Tentang Kami', 'About Us')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('faq')}
                  className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer"
                >
                  {t('Karir', 'Careers')}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#C89B3C] mb-4 uppercase tracking-widest">
              {t('Bantuan', 'Support')}
            </h5>
            <ul className="space-y-3 font-['Plus_Jakarta_Sans'] text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => setActiveTab('faq')}
                  className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer"
                >
                  {t('Hubungi Kami', 'Contact Us')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('faq')}
                  className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer"
                >
                  {t('Kebijakan Pengiriman', 'Shipping Policy')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('faq')}
                  className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer"
                >
                  {t('Kebijakan Privasi', 'Privacy Policy')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('pesanan')}
                  className="hover:text-[#C89B3C] hover:underline transition-all text-white/90 text-left cursor-pointer"
                >
                  {t('Status Pesanan', 'Order Status')}
                </button>
              </li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <h5 className="font-['Plus_Jakarta_Sans'] text-xs font-bold text-[#C89B3C] mb-4 uppercase tracking-widest">
              {t('Layanan Pelanggan', 'Customer Service')}
            </h5>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm mb-2 text-white/90">WhatsApp: {shopSettings.whatsappNumber}</p>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm mb-4 text-white/90">Email: {shopSettings.storeEmail || 'halo@sorgum.id'}</p>
            <p className="font-['Plus_Jakarta_Sans'] text-xs text-white/70">
              {t('Senin - Jumat: 09:00 - 18:00 WIB', 'Monday - Friday: 09:00 - 18:00 WIB')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto mt-16 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="font-['Plus_Jakarta_Sans'] text-xs text-white/80">
          © 2024 SORGUM Sorghum. Crafted with Authenticity.
        </p>
        <div className="flex gap-6 items-center">
          <img
            alt="Visa"
            className="h-4 grayscale opacity-60 hover:opacity-100 transition-opacity"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBm5IEFsXUv1sZTqiqhIIlqwwVqzR7BjifnXKwnr2jVaKTRM13XQaQ0AC_luDdQf6HAGZE4GyOApU2AB9THfGf9pvnnPab86QcdopWCsq0ZeeXnMcc01MEnwB85jpecKS4lr6BX__c8Tm75eT8kFWL6aFMBbIpBHHP3M8jjX6luE0A5axBo_LfS-xeRwyPBbesw9_yrbx3-4ToHv-9pQLuP7BoV-hLQHritN1gA-ooMG_LVMhnrBMg"
          />
          <img
            alt="Mastercard"
            className="h-4 grayscale opacity-60 hover:opacity-100 transition-opacity"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBp57C2jb4qctSC1zZiHqhpQ9sQkLdwEYgQdcg4kXDo_uwhDJyRODw5E5UeC31iOisWuUa4gGuP_bH_rQmYZEh1PFUdGPglxW6I4F0Oz7cqkEKsK-uXP6z-FpyOH-6UCoBVTxEbWxphjkcSw7EDXvs2szVslchCi5fxNg8mLH9a40TBsI_y8wdpA1dSpzgOeX36xsSGI1HKu4J0jwMf3rikvXm01w-FbkI4NY1GFW4M5xx5vyhpRU"
          />
          <img
            alt="GPN"
            className="h-4 grayscale opacity-60 hover:opacity-100 transition-opacity"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7IW-Kjmmvq5s_NJDd1C6wqno0uyQHqyHMW1z8bj6hl8uNYOMiwS5DZr4-ZLdDFIHbJMVQL1qIYtHISQwUsSmuTwHf1aDb3FomhtYPUkqko49oCk7l4A92DuxpfqeSHs5VGQvNYlspf_7xvGaiOgMW8SXLYYihOxuC5G9Tyog6PlUoyN8AEwSEHFZk0t-7EnVemOGfFl96Bi8CZq3VaW6Tw5M19ArGBgnxEOVgN14myhHjXsxhW-I"
          />
        </div>
      </div>
    </footer>
  );
};

