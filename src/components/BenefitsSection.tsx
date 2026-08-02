import React from 'react';
import { useApp } from '../context/AppContext';

export const BenefitsSection: React.FC = () => {
  const { t } = useApp();

  return (
    <section className="py-20 md:py-24 bg-[#faf8f5] border-t border-b border-[#c4c8bc]/30">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="text-center mb-14 lg:mb-16">
          <h2 className="font-['Roboto'] text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-[#162809]">
            {t('Mengapa Memilih Sorgum?', 'Why Choose Sorghum?')}
          </h2>
          <p className="font-['Roboto'] text-sm sm:text-base text-[#44483f]/90 max-w-2xl mx-auto leading-relaxed font-medium">
            {t(
              'Kami berkomitmen menghadirkan produk pangan berkelanjutan yang sehat untuk tubuh dan ramah bagi bumi.',
              'We are committed to delivering sustainable food products that are healthy for the body and friendly to the planet.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          <div className="bg-white p-8 sm:p-10 rounded-xl border border-[#c4c8bc]/50 hover:shadow-md transition-all duration-300 text-center group cursor-pointer shadow-2xs">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#fade88] rounded-xl flex items-center justify-center mx-auto mb-6 sm:mb-8 transition-all duration-300 group-hover:scale-108 group-hover:rotate-6 group-hover:bg-[#dfb550] shadow-sm">
              <span className="material-symbols-outlined text-3xl sm:text-4xl text-[#162809]">
                eco
              </span>
            </div>
            <h3 className="font-['Roboto'] text-xl sm:text-2xl font-bold mb-3 text-[#162809]">
              {t('Bebas Gluten', 'Gluten Free')}
            </h3>
            <p className="font-['Roboto'] text-xs sm:text-sm text-[#44483f]/80 leading-relaxed font-normal">
              {t(
                'Alternatif gandum yang aman bagi penderita celiac dan mereka yang menjalani diet bebas gluten.',
                'A safe alternative to wheat for celiac disease and those on a gluten-free diet.'
              )}
            </p>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-xl border border-[#c4c8bc]/50 hover:shadow-md transition-all duration-300 text-center group cursor-pointer shadow-2xs">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#fade88] rounded-xl flex items-center justify-center mx-auto mb-6 sm:mb-8 transition-all duration-300 group-hover:scale-108 group-hover:rotate-6 group-hover:bg-[#dfb550] shadow-sm">
              <span className="material-symbols-outlined text-3xl sm:text-4xl text-[#162809]">
                verified
              </span>
            </div>
            <h3 className="font-['Roboto'] text-xl sm:text-2xl font-bold mb-3 text-[#162809]">
              {t('100% Organik Lokal', '100% Organic & Local')}
            </h3>
            <p className="font-['Roboto'] text-xs sm:text-sm text-[#44483f]/80 leading-relaxed font-normal">
              {t(
                'Ditanam secara alami tanpa pestisida kimia oleh petani mitra kami di tanah Nusantara.',
                'Grown naturally without chemical pesticides by our partner farmers across the archipelago.'
              )}
            </p>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-xl border border-[#c4c8bc]/50 hover:shadow-md transition-all duration-300 text-center group cursor-pointer shadow-2xs">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#fade88] rounded-xl flex items-center justify-center mx-auto mb-6 sm:mb-8 transition-all duration-300 group-hover:scale-108 group-hover:rotate-6 group-hover:bg-[#dfb550] shadow-sm">
              <span className="material-symbols-outlined text-3xl sm:text-4xl text-[#162809]">
                groups
              </span>
            </div>
            <h3 className="font-['Roboto'] text-xl sm:text-2xl font-bold mb-3 text-[#162809]">
              {t('Berdampak Sosial', 'Social Impact')}
            </h3>
            <p className="font-['Roboto'] text-xs sm:text-sm text-[#44483f]/80 leading-relaxed font-normal">
              {t(
                'Setiap pembelian Anda mendukung kesejahteraan komunitas petani sorgum di pelosok daerah.',
                'Your purchase supports the welfare of sorghum farming communities in remote regions.'
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

