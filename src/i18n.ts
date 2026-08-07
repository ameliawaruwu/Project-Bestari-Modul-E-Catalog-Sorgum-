import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Terjemahan dimuat dari src/locales/{id,en}.ts yang di-generate otomatis oleh
// tools/extract-i18n.mjs dari pasangan t('id','en') di komponen.
// Dipakai .ts (bukan .json) karena Vite 6 gagal resolve import JSON relatif.
// Bahasa default: id. Persistensi di localStorage key 'app-language' (sama dengan
// state lama AppContext supaya preferensi user tidak berubah).
import { idLocale } from './locales/id';
import { enLocale } from './locales/en';

const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('app-language') : null;

i18n.use(initReactI18next).init({
  resources: {
    id: { translation: idLocale },
    en: { translation: enLocale },
  },
  lng: saved === 'en' || saved === 'id' ? saved : 'id',
  fallbackLng: 'id',
  interpolation: { escapeValue: false },
});

export default i18n;
