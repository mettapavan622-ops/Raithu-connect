import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en.ts';
import { te } from './locales/te.ts';
import { hi } from './locales/hi.ts';

const resources = {
  en: { translation: en },
  te: { translation: te },
  hi: { translation: hi },
};

// Retrieve stored language or default to en
const getInitialLanguage = (): string => {
  try {
    const saved = localStorage.getItem('raithu_lang');
    if (saved && ['en', 'te', 'hi'].includes(saved)) {
      return saved;
    }
  } catch (_) {}
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Sync html lang attribute whenever language changes
const updateHtmlLang = (lang: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    if (lang === 'te') {
      document.body.classList.add('font-telugu');
    } else {
      document.body.classList.remove('font-telugu');
    }
  }
};

updateHtmlLang(i18n.language);

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('raithu_lang', lng);
  } catch (_) {}
  updateHtmlLang(lng);
});

export default i18n;
