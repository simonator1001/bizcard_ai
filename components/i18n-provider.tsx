'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Create a single i18n instance
const i18n = i18next.createInstance();

// Initialize with basic config and empty translations
i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: {
      en: { translation: {} },
      zh: { translation: {} },
      'zh-TW': { translation: {} },
      es: { translation: {} }
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    react: { useSuspense: false }
  });

// Export the initialized instance
export { i18n };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load translations after mount
    Promise.all([
      import('@/src/i18n/locales/en.json'),
      import('@/src/i18n/locales/zh.json'),
      import('@/src/i18n/locales/zh-TW.json'),
      import('@/src/i18n/locales/es.json')
    ]).then(([en, zh, zhTW, es]) => {
      // Add resources to existing instance
      i18n.addResourceBundle('en', 'translation', en, true, true);
      i18n.addResourceBundle('zh', 'translation', zh, true, true);
      i18n.addResourceBundle('zh-TW', 'translation', zhTW, true, true);
      i18n.addResourceBundle('es', 'translation', es, true, true);
      setLoaded(true);
    }).catch(error => {
      console.error('Failed to load translations:', error);
      setLoaded(true); // Still set loaded to prevent blocking
    });
  }, []);

  // Show nothing while loading initial translations
  if (!loaded) return null;

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
} 