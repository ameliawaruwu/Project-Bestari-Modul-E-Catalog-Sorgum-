import React from 'react';
import { useApp } from '../context/AppContext';

export const BenefitsSection: React.FC = () => {
  const { t, landingContent } = useApp();

  const title = t(
    landingContent.benefitsTitleId || 'Kenapa Memilih Bestari?',
    landingContent.benefitsTitleEn || 'Why Choose Bestari?'
  );

  const desc = t(
    landingContent.benefitsDescId ||
      'Kami berkomitmen menghadirkan produk pangan berkelanjutan yang sehat bagi tubuh dan ramah bagi bumi.',
    landingContent.benefitsDescEn ||
      'We are committed to delivering sustainable food products that nourish your body and protect our planet.'
  );

  const benefits = [
    {
      icon: landingContent.benefit1Icon || 'eco',
      title: t(landingContent.benefit1TitleId || 'Bebas Gluten', landingContent.benefit1TitleEn || 'Gluten Free'),
      desc: t(
        landingContent.benefit1DescId || 'Alternatif gandum yang aman bagi penderita celiac dan mereka yang menjalani diet bebas gluten.',
        landingContent.benefit1DescEn || 'Safe wheat alternative for celiac disease and those pursuing a gluten-free lifestyle.'
      ),
    },
    {
      icon: landingContent.benefit2Icon || 'verified',
      title: t(landingContent.benefit2TitleId || '100% Organik Lokal', landingContent.benefit2TitleEn || '100% Local Organic'),
      desc: t(
        landingContent.benefit2DescId || 'Ditanam secara alami tanpa pestisida kimia oleh petani mitra kami di tanah Nusantara.',
        landingContent.benefit2DescEn || 'Grown naturally without chemical pesticides by our partner farmers across Indonesia.'
      ),
    },
    {
      icon: landingContent.benefit3Icon || 'groups',
      title: t(
        landingContent.benefit3TitleId || 'Berdampak Sosial',
        landingContent.benefit3TitleEn || 'Positive Social Impact'
      ),
      desc: t(
        landingContent.benefit3DescId || 'Setiap pembelian Anda mendukung kesejahteraan komunitas petani sorgum di pelosok daerah.',
        landingContent.benefit3DescEn || 'Every purchase directly empowers the livelihoods of local sorghum farming communities.'
      ),
    },
  ];

  return (
    <section id="benefits-section" className="py-14 sm:py-20 bg-[#FFFDF5] dark:bg-[#08100A] relative overflow-hidden transition-colors duration-300">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 max-w-2xl mx-auto space-y-3">
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1F5132] dark:text-[#F4F8F3] tracking-tight">
            {title}
          </h2>

          <p className="font-['Plus_Jakarta_Sans'] text-sm sm:text-base text-[#6B756E] dark:text-[#CBD5C8] leading-relaxed font-normal">
            {desc}
          </p>
        </div>

        {/* Benefits List (Format List Elegan & Rapi) */}
        <div className="space-y-3.5 sm:space-y-4 max-w-3xl mx-auto">
          {benefits.map((item, idx) => (
            <div
              key={idx}
              className="group bg-white dark:bg-[#0E1A11] p-5 sm:p-6 rounded-2xl sm:rounded-[22px] border border-[#E8F5E9] dark:border-[rgba(165,214,167,0.15)] hover:border-[#3A8F4B]/40 dark:hover:border-[#65B86B]/40 shadow-xs hover:shadow-md transition-all duration-300 flex items-start sm:items-center gap-4 sm:gap-5 cursor-default"
            >
              {/* Circular Green Icon Badge */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#E8F5E9] dark:bg-[#152718] text-[#3A8F4B] dark:text-[#65B86B] border border-[#3A8F4B]/20 dark:border-[rgba(165,214,167,0.25)] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#3A8F4B] group-hover:text-white dark:group-hover:bg-[#3A8F4B] dark:group-hover:text-white transition-all duration-300 shadow-2xs">
                <span className="material-symbols-outlined text-2xl sm:text-3xl">
                  {item.icon}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-extrabold text-[#1F5132] dark:text-[#F4F8F3] group-hover:text-[#3A8F4B] dark:group-hover:text-[#65B86B] transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#6B756E] dark:text-[#CBD5C8] leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default BenefitsSection;
