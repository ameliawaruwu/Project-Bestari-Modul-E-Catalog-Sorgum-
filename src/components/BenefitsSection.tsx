import React from 'react';
import { useApp } from '../context/AppContext';

export const BenefitsSection: React.FC = () => {
  const { t, landingContent } = useApp();

  return (
    <section className="py-20 md:py-24 bg-[#F7F8F6] border-t border-b border-[#E0E0E0]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="text-center mb-14 lg:mb-16">
          <h2 className="font-['Playfair_Display'] text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-[#1B5E20]">
            {t(landingContent.benefitsTitleId, landingContent.benefitsTitleEn)}
          </h2>
          <p className="font-['Plus_Jakarta_Sans'] text-sm sm:text-base text-[#555555] max-w-2xl mx-auto leading-relaxed font-medium">
            {t(landingContent.benefitsDescId, landingContent.benefitsDescEn)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          <div className="bg-[#FFFFFF] p-8 sm:p-10 rounded-2xl border border-[#E0E0E0] hover:border-[#2E7D32]/50 hover:shadow-md transition-all duration-300 text-center group cursor-pointer shadow-2xs">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#E8F5E9] border border-[#A5D6A7] rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 transition-all duration-300 group-hover:scale-105 group-hover:bg-[#2E7D32] group-hover:text-white text-[#1B5E20] shadow-2xs">
              <span className="material-symbols-outlined text-3xl sm:text-4xl">
                {landingContent.benefit1Icon || 'eco'}
              </span>
            </div>
            <h3 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold mb-3 text-[#1B5E20]">
              {t(landingContent.benefit1TitleId, landingContent.benefit1TitleEn)}
            </h3>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555] leading-relaxed font-normal">
              {t(landingContent.benefit1DescId, landingContent.benefit1DescEn)}
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-8 sm:p-10 rounded-2xl border border-[#E0E0E0] hover:border-[#2E7D32]/50 hover:shadow-md transition-all duration-300 text-center group cursor-pointer shadow-2xs">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#E8F5E9] border border-[#A5D6A7] rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 transition-all duration-300 group-hover:scale-105 group-hover:bg-[#2E7D32] group-hover:text-white text-[#1B5E20] shadow-2xs">
              <span className="material-symbols-outlined text-3xl sm:text-4xl">
                {landingContent.benefit2Icon || 'verified'}
              </span>
            </div>
            <h3 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold mb-3 text-[#1B5E20]">
              {t(landingContent.benefit2TitleId, landingContent.benefit2TitleEn)}
            </h3>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555] leading-relaxed font-normal">
              {t(landingContent.benefit2DescId, landingContent.benefit2DescEn)}
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-8 sm:p-10 rounded-2xl border border-[#E0E0E0] hover:border-[#2E7D32]/50 hover:shadow-md transition-all duration-300 text-center group cursor-pointer shadow-2xs">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#E8F5E9] border border-[#A5D6A7] rounded-2xl flex items-center justify-center mx-auto mb-6 sm:mb-8 transition-all duration-300 group-hover:scale-105 group-hover:bg-[#2E7D32] group-hover:text-white text-[#1B5E20] shadow-2xs">
              <span className="material-symbols-outlined text-3xl sm:text-4xl">
                {landingContent.benefit3Icon || 'groups'}
              </span>
            </div>
            <h3 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold mb-3 text-[#1B5E20]">
              {t(landingContent.benefit3TitleId, landingContent.benefit3TitleEn)}
            </h3>
            <p className="font-['Plus_Jakarta_Sans'] text-xs sm:text-sm text-[#555555] leading-relaxed font-normal">
              {t(landingContent.benefit3DescId, landingContent.benefit3DescEn)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

