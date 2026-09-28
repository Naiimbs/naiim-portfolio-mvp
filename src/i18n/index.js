import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import arCommon from './locales/ar/common.json';
import frCommon from './locales/fr/common.json';

const resources = {
  en: { common: enCommon },
  ar: { common: arCommon },
  fr: { common: frCommon },
};

const DIRECTIONS = {
  en: 'ltr',
  ar: 'rtl',
  fr: 'ltr',
};

export const setAppLanguage = (lang) => {
  const targetLang = resources[lang] ? lang : 'en';
  const dir = DIRECTIONS[targetLang] || 'ltr';

  document.documentElement.lang = targetLang;
  document.documentElement.dir = dir;

  i18n.changeLanguage(targetLang);
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

// Set initial HTML attributes
if (typeof document !== 'undefined') {
  document.documentElement.lang = 'en';
  document.documentElement.dir = 'ltr';
}

export default i18n;
