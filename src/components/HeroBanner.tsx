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
    <section className="w-full max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4">
      {/* ── Contained Hero Card: Compact (~340px), 18px radius, balanced & natural ── */}
      <div className="relative w-full rounded-[18px] overflow-hidden bg-gradient-to-r from-[#EDF6EC] via-[#F3F9F1] to-[#F7FAF5] dark:from-[#060D07] dark:via-[#09150B] dark:to-[#0C1C0F] border border-[#DCE8DA] dark:border-white/10 shadow-xs min-h-[300px] lg:min-h-[340px] flex flex-col lg:flex-row items-stretch transition-colors duration-300">
        
        {/* ── 1. Desktop Right Product/Harvest Photo (Contained 48% inside the card) ── */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[48%] overflow-hidden z-0">
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

            {/* Subtle soft organic transition mask (no thick green strokes, low visual contrast) */}
            <div className="absolute left-0 top-0 bottom-0 w-16 xl:w-20 h-full pointer-events-none z-10">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full text-[#F7FAF5] dark:text-[#0C1C0F] fill-current"
              >
                <path d="M 0,0 L 25,0 C 65,30 65,70 25,100 L 0,100 Z" />
              </svg>
            </div>

            {/* Minimal subtle carousel dots positioned neatly at bottom-right */}
            {hasSlides && slides.length > 1 && (
              <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`transition-all duration-300 cursor-pointer rounded-full ${
                      currentIdx === idx
                        ? 'bg-[#E3B84B] w-4 h-1.5'
                        : 'bg-white/80 hover:bg-white w-1.5 h-1.5 shadow-2xs'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 2. Mobile / Tablet Photo Container (< lg) ── */}
        <div className="lg:hidden w-full h-[160px] sm:h-[210px] relative overflow-hidden shrink-0">
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

          {/* Minimal subtle carousel dots for mobile */}
          {hasSlides && slides.length > 1 && (
            <div className="absolute bottom-2.5 right-3 z-20 flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`transition-all duration-300 cursor-pointer rounded-full ${
                    currentIdx === idx
                      ? 'bg-[#FADE88] w-3.5 h-1.5'
                      : 'bg-white/70 hover:bg-white w-1.5 h-1.5 shadow-2xs'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── 3. Content Container (Balanced proportions & tighter typography) ── */}
        <div className="w-full lg:w-[52%] px-5 sm:px-7 lg:px-8 py-5 sm:py-6 lg:py-6.5 relative z-10 flex flex-col justify-center">
          <div className="space-y-2 sm:space-y-2.5 animate-fadeIn">

            {/* Headline: Slightly reduced font size & tighter line-height */}
            <div className="space-y-0.5">
              {line1 && (
                <h1 className="font-['Plus_Jakarta_Sans'] text-lg sm:text-xl lg:text-[22px] xl:text-[24px] font-extrabold text-[#162809] dark:text-[#F4F8F3] leading-[1.16] tracking-tight">
                  {line1}
                </h1>
              )}
              {line2 && (
                <h2 className="font-['Plus_Jakarta_Sans'] text-lg sm:text-xl lg:text-[22px] xl:text-[24px] font-extrabold text-[#162809] dark:text-[#F4F8F3] leading-[1.16] tracking-tight">
                  {line2}
                </h2>
              )}
              {accent && (
                <p className="font-['Plus_Jakarta_Sans'] italic font-extrabold text-xl sm:text-2xl lg:text-[25px] xl:text-[27px] text-[#2B3E1D] dark:text-[#65B86B] leading-[1.16] pt-0.5 select-none tracking-tight">
                  {accent}
                </p>
              )}
            </div>

            {/* Subtitle Description */}
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-[13px] text-[#556353] dark:text-[#CBD5C8] leading-relaxed max-w-md font-normal">
              {t(
                landingContent.heroDescId ||
                  'Ragam olahan pangan sorgum unggul bebas gluten dan kaya nutrisi dari petani nusantara untuk menemani hidup sehat Anda sekeluarga.',
                landingContent.heroDescEn ||
                  'Expert tips, quality resources, and local sorghum products to help your healthy lifestyle thrive all year round.'
              )}
            </p>

            {/* Action Buttons: Proportional size & spacing */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={onShopNow}
                className="inline-flex items-center justify-center bg-gradient-to-r from-[#1F5132] to-[#2B3E1D] hover:from-[#162809] hover:to-[#203116] text-white px-4 py-2 rounded-lg font-['Plus_Jakarta_Sans'] font-bold text-xs sm:text-[13px] shadow-xs hover:shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>{t(landingContent.heroBtnId || 'Belanja Sekarang', landingContent.heroBtnEn || 'Shop Now')}</span>
              </button>

              <button
                type="button"
                onClick={handleLearnMore}
                className="inline-flex items-center justify-center bg-white/95 dark:bg-[#122316] hover:bg-[#F0F8EF] dark:hover:bg-[#162B1C] text-[#162809] dark:text-[#65B86B] border border-[#2B3E1D]/20 dark:border-[rgba(165,214,167,0.25)] px-3.5 py-2 rounded-lg font-['Plus_Jakarta_Sans'] font-bold text-xs sm:text-[13px] transition-all duration-200 active:scale-95 cursor-pointer shadow-2xs"
              >
                <span>{t('Baca Artikel', 'Read Articles')}</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroBanner;
