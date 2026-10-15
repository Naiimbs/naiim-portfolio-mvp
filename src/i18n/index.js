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

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'fr', label: 'FR', name: 'Français' },
  { code: 'ar', label: 'ع', name: 'العربية' },
];

const STORAGE_KEY = 'app_lang';

/** Read the visitor's saved language preference (falls back to 'en'). */
export const getSavedLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && resources[saved]) return saved;
  } catch (_) {
    /* localStorage unavailable (private mode, SSR) — ignore */
  }
  return 'en';
};

export const getDirection = (lang) => DIRECTIONS[lang] || 'ltr';

export const setAppLanguage = (lang) => {
  const targetLang = resources[lang] ? lang : 'en';
  const dir = getDirection(targetLang);

  document.documentElement.lang = targetLang;
  document.documentElement.dir = dir;
  // Expose on <body> too so CSS can target RTL without relying on <html>.
  document.body?.setAttribute('dir', dir);

  try {
    localStorage.setItem(STORAGE_KEY, targetLang);
  } catch (_) {
    /* ignore persistence failures */
  }

  i18n.changeLanguage(targetLang);
};

const initialLang = typeof window !== 'undefined' ? getSavedLanguage() : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

// Apply initial HTML attributes (lang + direction) from the saved preference.
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
  document.documentElement.dir = getDirection(initialLang);
}

export default i18n;
