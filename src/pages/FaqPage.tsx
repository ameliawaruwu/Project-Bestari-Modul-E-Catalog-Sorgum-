import React, { useState, useEffect } from 'react';
import { FaqAccordion } from '../components/FaqAccordion';
import { useApp } from '../context/AppContext';
import { FaqItem } from '../types';
import { faqApi } from '../api/faqApi';

export const FaqPage: React.FC = () => {
  const { t } = useApp();
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    faqApi
      .getFaqs()
      .then((list) => {
        if (!cancelled) setFaqs(list);
      })
      .catch(() => {
        if (!cancelled) setFaqs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Only show active FAQs on the customer page
  const activeFaqs = faqs.filter((f) => f.status === 'AKTIF' || !f.status);

  return (
    <div className="pt-28 sm:pt-32 pb-20 animate-fadeIn min-h-screen">
      <FaqAccordion faqs={activeFaqs} />
    </div>
  );
};
