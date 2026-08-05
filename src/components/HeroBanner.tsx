import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface HeroBannerProps {
  onShopNow: () => void;
  onReadMore?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onShopNow }) => {
  const { t, banners, landingContent } = useApp();
  const [currentIdx, setCurrentIdx] = useState(0);

  const activeBanners = banners.filter((b) => b.active);
  // Fallback: kalau tidak ada banner aktif, tampilkan gradient solid saja —
  // JANGAN hardcoded image (dulu memakai gambar banner lama → muncul "2 gambar").
  const slides = activeBanners.map(b => b.image);
  const hasSlides = slides.length > 0;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentTitle = activeBanners.length > 0 && activeBanners[currentIdx]
    ? activeBanners[currentIdx].title
    : t(landingContent.heroTitleId, landingContent.heroTitleEn);

  return (
    <section className="relative min-h-[75vh] md:min-h-[85vh] flex items-center overflow-hidden pt-20">
      {/* Background Image Carousel with Overlay */}
      <div className="absolute inset-0 overflow-hidden">
        {hasSlides ? (
          <>
            {slides.map((imgUrl, index) => {
              const isActive = currentIdx === index;
              return (
                <div
                  key={index}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 scale-100 animate-zoomSlow' : 'opacity-0 pointer-events-none'
                  }`}
                  style={{
                    backgroundImage: `url('${imgUrl}')`,
                  }}
                />
              );
            })}
          </>
        ) : (
          /* Fallback tanpa banner aktif: gradient solid + pattern halus */
          <div className="absolute inset-0 bg-gradient-to-br from-[#2b3e1d] via-[#162809] to-[#0d1406]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#162809]/75 via-[#162809]/40 to-black/35 backdrop-brightness-[0.85] z-10"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-20 max-w-[1280px] mx-auto w-full px-4 md:px-10 pt-10 pb-20 md:pt-14 md:pb-28 flex flex-col justify-center items-start text-white">
        <h1 className="font-['Roboto'] text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold max-w-2xl mb-4 leading-tight drop-shadow-md animate-slideUp">
          {currentTitle}
        </h1>

        <p className="font-['Roboto'] text-xs sm:text-sm md:text-base max-w-xl mb-6 text-white/90 leading-relaxed font-normal drop-shadow animate-slideUp animation-delay-400">
          {t(landingContent.heroDescId, landingContent.heroDescEn)}
        </p>

        <div className="flex flex-wrap gap-3 animate-slideUp animation-delay-600">
          <button
            onClick={onShopNow}
            className="bg-[#2b3e1d] text-white px-6 py-2.5 rounded-lg font-['Roboto'] font-bold text-xs sm:text-sm hover:bg-[#162809] hover:border-[#162809] border border-[#2b3e1d] transition-all active:scale-95 shadow-md btn-hover-effect cursor-pointer"
          >
            <span>{t(landingContent.heroBtnId, landingContent.heroBtnEn)}</span>
          </button>
        </div>
      </div>
    </section>
  );
};


