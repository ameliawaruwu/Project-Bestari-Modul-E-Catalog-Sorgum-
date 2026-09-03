import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface HeroBannerProps {
  onShopNow: () => void;
  onReadMore?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow, onReadMore }) => {
  const { t, banners, landingContent } = useApp();
  const [currentIdx, setCurrentIdx] = useState(0);

  const activeBanners = banners.filter((b) => b.active);
  const slides = activeBanners.map((b) => b.image);
  const hasSlides = slides.length > 0;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleLearnMore = () => {
    if (onReadMore) {
      onReadMore();
    } else {
      const target = document.getElementById('product-catalog-section');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Process title: split into two lines and an accent if needed
  const rawTitle = t(
    landingContent.heroTitleId || 'Kemurnian Alam dalam Tiap Butir SORGUM',
    landingContent.heroTitleEn || 'Pure Nature in Every Sorghum Grain'
  );

  let line1 = rawTitle;
  let line2 = '';
  let accent = '';

  const words = rawTitle.split(' ');
  const sorgumIdx = words.findIndex((w) => w.toUpperCase().includes('SORGUM'));

  if (sorgumIdx !== -1) {
    line1 = words.slice(0, Math.min(sorgumIdx, 4)).join(' ');
    line2 = words.slice(Math.min(sorgumIdx, 4), sorgumIdx).join(' ');
    accent = words.slice(sorgumIdx).join(' ');
  } else if (words.length > 5) {
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(' ');
    line2 = words.slice(mid).join(' ');
  }

  return (
    <section className="relative w-full bg-gradient-to-r from-[#EDF6EC] via-[#F3F9F1] to-[#F7FAF5] dark:from-[#060D07] dark:via-[#09150B] dark:to-[#0C1C0F] transition-colors duration-300 overflow-hidden">
      
      {/* ── 1. Desktop Full-Bleed Right Photo (Memenuhi sisi kanan tanpa terpotong) ── */}
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[50%] xl:w-[53%] overflow-hidden z-0">
        <div className="relative w-full h-full">
          {hasSlides ? (
            slides.map((imgUrl, index) => {
              const isActive = currentIdx === index;
              return (
                <div
                  key={index}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 pointer-events-none'
                  }`}
                  style={{ backgroundImage: `url('${imgUrl}')` }}
                />
              );
            })
          ) : (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1400&q=80')`,
              }}
            />
          )}

          {/* Natural sunlight vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

          {/* Desktop S-Curve Organic Wave Mask (Warna transisi hijau segar alami ke foto) */}
          <div className="absolute left-0 top-0 bottom-0 w-44 xl:w-56 h-full pointer-events-none z-10">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-full text-[#F7FAF5] dark:text-[#0C1C0F] fill-current drop-shadow-xs"
            >
              {/* Organic multi-frequency wave cutting smoothly into the image */}
              <path
                d="M 0,0 L 46,0 C 58,10 66,22 54,34 C 42,46 34,58 46,70 C 58,82 66,92 52,100 L 0,100 Z"
              />
              {/* Soft secondary accent wave */}
              <path
                d="M 44,0 C 56,10 64,22 52,34 C 40,46 32,58 44,70 C 56,82 64,92 50,100"
                fill="none"
                stroke="#65B86B"
                strokeOpacity="0.25"
                strokeWidth="6"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
              />
              {/* Fresh Leaf Olive Green Contour Line */}
              <path
                d="M 46,0 C 58,10 66,22 54,34 C 42,46 34,58 46,70 C 58,82 66,92 52,100"
                fill="none"
                stroke="#48A856"
                strokeWidth="3.2"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Carousel Slide Indicators */}
          {hasSlides && slides.length > 1 && (
            <div className="absolute bottom-6 right-8 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentIdx === idx ? 'bg-[#E3B84B] w-6' : 'bg-white/60 w-2 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Left Content Container (Jarak lega & proporsional dari navbar sticky) ── */}
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10 pt-8 sm:pt-12 lg:pt-14 pb-14 sm:pb-18 lg:pb-20">
        
        <div className="w-full lg:w-[48%] space-y-4 sm:space-y-5 animate-fadeIn lg:pl-4 xl:pl-6">
          
          {/* Dynamic Title connected to Admin "Kelola Landing Page" */}
          <div className="space-y-0.5">
            {line1 && (
              <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl lg:text-[36px] xl:text-[40px] font-extrabold text-[#1F5132] dark:text-[#F4F8F3] leading-[1.15] tracking-tight">
                {line1}
              </h1>
            )}
            {line2 && (
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl lg:text-[36px] xl:text-[40px] font-extrabold text-[#1F5132] dark:text-[#F4F8F3] leading-[1.15] tracking-tight">
                {line2}
              </h2>
            )}
            {accent && (
              <p className="font-serif italic font-normal text-3xl sm:text-4xl lg:text-[44px] xl:text-[48px] text-[#3A8F4B] dark:text-[#65B86B] leading-[1.18] pt-1 select-none">
                {accent}
              </p>
            )}
          </div>

          {/* Subtitle Description from Admin Panel */}
          <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#6B756E] dark:text-[#CBD5C8] leading-relaxed max-w-md font-normal">
            {t(
              landingContent.heroDescId ||
                'Ragam olahan pangan sorgum unggul bebas gluten dan kaya nutrisi dari petani nusantara untuk menemani hidup sehat Anda sekeluarga.',
              landingContent.heroDescEn ||
                'Expert tips, quality resources, and local sorghum products to help your healthy lifestyle thrive all year round.'
            )}
          </p>

          {/* Dual Action Buttons (Primary button text from Admin Panel) */}
          <div className="flex flex-wrap items-center gap-3 pt-1.5">
            {/* Primary Green Gradient CTA Button */}
            <button
              type="button"
              onClick={onShopNow}
              className="inline-flex items-center justify-center bg-gradient-to-r from-[#3A8F4B] to-[#65B86B] hover:from-[#2F773E] hover:to-[#559E5B] text-white px-5.5 py-2.5 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>{t(landingContent.heroBtnId || 'Belanja Sekarang', landingContent.heroBtnEn || 'Shop Now')}</span>
            </button>

            {/* Secondary Cream/White Pill for Articles */}
            <button
              type="button"
              onClick={handleLearnMore}
              className="inline-flex items-center justify-center bg-white/90 dark:bg-[#122316] hover:bg-[#F0F8EF] dark:hover:bg-[#162B1C] text-[#1F5132] dark:text-[#65B86B] border border-[#3A8F4B]/30 px-5 py-2.5 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs"
            >
              <span>{t('Baca Artikel', 'Read Articles')}</span>
            </button>
          </div>

        </div>

        {/* ── 3. Mobile / Tablet Photo Container (Only shown when screen < lg) ── */}
        <div className="lg:hidden mt-6 w-full h-[260px] sm:h-[320px] rounded-xl overflow-hidden relative shadow-md">
          {hasSlides ? (
            slides.map((imgUrl, index) => {
              const isActive = currentIdx === index;
              return (
                <div
                  key={index}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 pointer-events-none'
                  }`}
                  style={{ backgroundImage: `url('${imgUrl}')` }}
                />
              );
            })
          ) : (
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1400&q=80')`,
              }}
            />
          )}

          {/* Carousel Slide Indicators for Mobile */}
          {hasSlides && slides.length > 1 && (
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentIdx === idx ? 'bg-[#FADE88] w-5' : 'bg-white/60 w-2'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

      </div>

    </section>
  );
};

export default HeroBanner;
