import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English namespaces
import enCommon from './locales/en/common.json';
import enNav from './locales/en/navigation.json';
import enDashboard from './locales/en/dashboard.json';
import enDiary from './locales/en/diary.json';
import enNutrition from './locales/en/nutrition.json';
import enSettings from './locales/en/settings.json';
import enSafety from './locales/en/safety.json';

// Hindi namespaces
import hiCommon from './locales/hi/common.json';
import hiNav from './locales/hi/navigation.json';
import hiDashboard from './locales/hi/dashboard.json';
import hiSafety from './locales/hi/safety.json';
import hiSettings from './locales/hi/settings.json';

// Telugu namespaces
import teCommon from './locales/te/common.json';
import teNav from './locales/te/navigation.json';
import teDashboard from './locales/te/dashboard.json';
import teSafety from './locales/te/safety.json';
import teSettings from './locales/te/settings.json';

export const SUPPORTED_LOCALES = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు' },
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]['code'];

const savedLocale = (localStorage.getItem('poshancare_locale') as SupportedLocale) || 'en';
const initialLocale = ['en', 'hi', 'te'].includes(savedLocale) ? savedLocale : 'en';

export const resources = {
  en: {
    common: enCommon,
    navigation: enNav,
    dashboard: enDashboard,
    diary: enDiary,
    nutrition: enNutrition,
    settings: enSettings,
    safety: enSafety,
  },
  hi: {
    common: hiCommon,
    navigation: hiNav,
    dashboard: hiDashboard,
    safety: hiSafety,
    settings: hiSettings,
  },
  te: {
    common: teCommon,
    navigation: teNav,
    dashboard: teDashboard,
    safety: teSafety,
    settings: teSettings,
  },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLocale,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'navigation', 'dashboard', 'diary', 'nutrition', 'settings', 'safety'],
    interpolation: {
      escapeValue: false, // React already escapes values safely
    },
    react: {
      useSuspense: false,
    },
  });

// Synchronize HTML element lang attribute and localStorage
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLocale;
  document.documentElement.dir = 'ltr';
}

i18n.on('languageChanged', (lng: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
  try {
    localStorage.setItem('poshancare_locale', lng);
  } catch (err) {
    console.warn('Unable to persist locale preference to localStorage:', err);
  }
});

export default i18n;
