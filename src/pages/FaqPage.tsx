import React, { useState, useEffect } from 'react';
import { FaqAccordion } from '../components/FaqAccordion';
import { FaqItem } from '../types';
import { faqApi } from '../api';

export const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const data = await faqApi.getFaqs();
        setFaqs(data);
      } catch (err) {
        console.error('Failed to load FAQs', err);
      }
    };
    fetchFaqs();
  }, []);

  return (
    <div className="pt-28 sm:pt-32 pb-20 animate-fadeIn min-h-screen">
      <FaqAccordion faqs={faqs} />
    </div>
  );
};
