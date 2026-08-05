import React from 'react';
import { useApp } from '../context/AppContext';

export const BenefitsSection: React.FC = () => {
  const { t, landingContent } = useApp();

  // Benefit data structure for rich visual presentation
  const benefits = [
    {
      id: 1,
      title: t(landingContent.benefit1TitleId || '100% Bebas Gluten', landingContent.benefit1TitleEn || '100% Gluten Free'),
      desc: t(landingContent.benefit1DescId || 'Alternatif sehat biji-bijian bebas gluten yang sangat aman untuk penderita Celiac, sensitivitas pencernaan, maupun diet sehat harian.', landingContent.benefit1DescId || 'A healthy gluten-free grain alternative that is perfectly safe for Celiac, digestive sensitivity, or daily healthy diets.'),
      icon: landingContent.benefit1Icon || 'eco',
      badge: t('0% Gluten', '0% Gluten'),
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
      highlights: [
        t('Aman untuk pencernaan sensitif', 'Safe for sensitive digestion'),
        t('Bebas protein alergen gandum', 'Free from wheat allergen proteins'),
      ],
    },
    {
      id: 2,
      title: t(landingContent.benefit2TitleId || 'Indeks Glikemik Rendah', landingContent.benefit2TitleEn || 'Low Glycemic Index'),
      desc: t(landingContent.benefit2DescId || 'Dicerna secara bertahap sehingga mencegah lonjakan gula darah mendadak. Sangat direkomendasikan untuk pencegahan dan penderita diabetes.', landingContent.benefit2DescId || 'Digested gradually to prevent sudden blood sugar spikes. Highly recommended for diabetes management and prevention.'),
      icon: landingContent.benefit2Icon || 'monitor_heart',
      badge: t('Gula Darah Stabil', 'Stable Blood Sugar'),
      badgeColor: 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
      highlights: [
        t('Kenyang lebih lama', 'Stays full longer'),
        t('Ideal untuk program diet & diabetes', 'Ideal for weight management & diabetes'),
      ],
    },
    {
      id: 3,
      title: t(landingContent.benefit3TitleId || 'Kaya Nutrisi & Antioksidan', landingContent.benefit3TitleEn || 'Nutrient & Antioxidant Rich'),
      desc: t(landingContent.benefit3DescId || 'Mengandung serat tinggi, protein nabati murni, zat besi, kalsium, serta senyawa polifenol pembasmi radikal bebas untuk imunitas tubuh.', landingContent.benefit3DescId || 'Contains high fiber, pure plant protein, iron, calcium, and polyphenol antioxidant compounds to boost immunity.'),
      icon: landingContent.benefit3Icon || 'verified',
      badge: t('Superfood Nutrisi', 'Nutrient Superfood'),
      badgeColor: 'bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
      highlights: [
        t('Tinggi serat & protein murni', 'High fiber & pure protein'),
        t('Kaya polifenol antioksidan', 'Rich in antioxidant polyphenols'),
      ],
    },
  ];

  return (
    <section className="py-20 md:py-24 bg-gradient-to-b from-[#faf8f5] via-[#f5f2eb] to-[#faf8f5] dark:from-[#14120e] dark:via-[#191713] dark:to-[#14120e] border-t border-b border-[#c4c8bc]/40 dark:border-white/10 relative overflow-hidden transition-colors duration-300">
      {/* Decorative ambient background blur lights */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#fade88]/20 dark:bg-[#fade88]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#2b3e1d]/5 dark:bg-[#fade88]/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="max-w-[1280px] mx-auto px-4 md:px-10 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#162809]/10 dark:bg-[#fade88]/10 border border-[#162809]/20 dark:border-[#fade88]/30 text-[#162809] dark:text-[#fde08b] text-xs font-bold uppercase tracking-widest mb-4 shadow-2xs">
            <span className="material-symbols-outlined text-sm text-[#715c13] dark:text-[#fde08b]">spa</span>
            <span>{t('Keunggulan Superfood Lokal', 'Local Superfood Advantages')}</span>
          </div>

          <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-[#162809] dark:text-[#fde08b] leading-tight">
            {t(landingContent.benefitsTitleId || 'Mengapa Memilih Sorgum?', landingContent.benefitsTitleEn || 'Why Choose Sorghum?')}
          </h2>

          <div className="w-16 h-1 bg-[#fade88] mx-auto rounded-full mb-4"></div>

          <p className="font-['Plus_Jakarta_Sans'] text-sm sm:text-base text-[#44483f]/90 dark:text-[#b8bcb4] leading-relaxed font-medium">
            {t(
              landingContent.benefitsDescId || 'Sorgum adalah biji-bijian superfood murni kaya nutrisi, bebas gluten, dan ramah lingkungan yang ideal untuk gaya hidup sehat keluarga Anda.',
              landingContent.benefitsDescEn || 'Sorghum is a pure, nutrient-dense, gluten-free, and eco-friendly superfood ideal for your family\'s healthy lifestyle.'
            )}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((item) => (
            <div
              key={item.id}
              className="bg-white/90 dark:bg-[#1c1a16]/90 backdrop-blur-xs p-8 rounded-2xl border border-[#c4c8bc]/60 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Card Header Tag */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#fade88] via-[#e5bd47] to-[#cba028] rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <span className="material-symbols-outlined text-3xl text-[#162809]">
                    {item.icon}
                  </span>
                </div>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-2xs ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div className="mb-6">
                <h3 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold mb-3 text-[#162809] dark:text-[#f5f3f0] group-hover:text-[#2b3e1d] dark:group-hover:text-[#fde08b] transition-colors">
                  {item.title}
                </h3>
                <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#44483f]/85 dark:text-[#b8bcb4] leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="pt-4 border-t border-[#c4c8bc]/30 dark:border-white/10 space-y-2">
                {item.highlights.map((hl, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-[#162809]/90 dark:text-[#e0dacb]">
                    <span className="material-symbols-outlined text-sm text-[#715c13] dark:text-[#fde08b]">check_circle</span>
                    <span>{hl}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Quick Feature Strip */}
        <div className="mt-14 p-6 bg-white/80 dark:bg-[#1c1a16]/80 backdrop-blur-md rounded-2xl border border-[#c4c8bc]/50 dark:border-white/10 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="flex justify-center mb-1 text-[#162809] dark:text-[#fde08b]">
              <span className="material-symbols-outlined text-2xl">eco</span>
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-[#162809] dark:text-[#f5f3f0]">{t('100% Organik', '100% Organic')}</h4>
            <p className="text-[11px] text-[#75786e] dark:text-[#8a8e86] font-medium">{t('Tanpa bahan kimia sintetis', 'No synthetic chemicals')}</p>
          </div>

          <div className="space-y-1 border-l border-[#c4c8bc]/30 dark:border-white/10 pl-2">
            <div className="flex justify-center mb-1 text-[#162809] dark:text-[#fde08b]">
              <span className="material-symbols-outlined text-2xl">health_and_safety</span>
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-[#162809] dark:text-[#f5f3f0]">{t('Aman Celiac & Diabetes', 'Celiac & Diabetic Safe')}</h4>
            <p className="text-[11px] text-[#75786e] dark:text-[#8a8e86] font-medium">{t('Bebas gluten & Low GI', 'Gluten free & Low GI')}</p>
          </div>

          <div className="space-y-1 border-l border-[#c4c8bc]/30 dark:border-white/10 pl-2">
            <div className="flex justify-center mb-1 text-[#162809] dark:text-[#fde08b]">
              <span className="material-symbols-outlined text-2xl">water_drop</span>
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-[#162809] dark:text-[#f5f3f0]">{t('Hemat Air & Ramah Bumi', 'Water Saving & Eco Grain')}</h4>
            <p className="text-[11px] text-[#75786e] dark:text-[#8a8e86] font-medium">{t('3x hemat konsumsi air', '3x less water usage')}</p>
          </div>

          <div className="space-y-1 border-l border-[#c4c8bc]/30 dark:border-white/10 pl-2">
            <div className="flex justify-center mb-1 text-[#162809] dark:text-[#fde08b]">
              <span className="material-symbols-outlined text-2xl">groups</span>
            </div>
            <h4 className="font-bold text-xs sm:text-sm text-[#162809] dark:text-[#f5f3f0]">{t('Mendukung Petani Lokal', 'Empowering Local Farmers')}</h4>
            <p className="text-[11px] text-[#75786e] dark:text-[#8a8e86] font-medium">{t('Hasil panen Nusantara', 'Archipelago harvest')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
