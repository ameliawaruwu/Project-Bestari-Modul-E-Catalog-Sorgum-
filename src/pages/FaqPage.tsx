import React from 'react';
import { FaqAccordion } from '../components/FaqAccordion';
import { useApp } from '../context/AppContext';

export const FaqPage: React.FC = () => {
  const { t, faqs } = useApp();

  // Only show active FAQs on the customer page
  const activeFaqs = faqs.filter((f) => f.status === 'AKTIF' || !f.status);

  return (
    <div className="pt-28 sm:pt-32 pb-20 animate-fadeIn min-h-screen">
      <FaqAccordion faqs={activeFaqs} />
    </div>
  );
};
