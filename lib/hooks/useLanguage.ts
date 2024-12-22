import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import i18n from '../../src/i18n/config';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export function useLanguage() {
  const { t } = useTranslation();

  const changeLanguage = async (language: LanguageCode) => {
    try {
      await i18n.changeLanguage(language);
      localStorage.setItem('preferredLanguage', language);
      toast({
        title: t('toast.languageUpdated', { language: SUPPORTED_LANGUAGES.find(l => l.code === language)?.label }),
      });
    } catch (error) {
      console.error('Failed to change language:', error);
      toast({
        title: 'Failed to change language',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage') as LanguageCode | null;
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage).catch(console.error);
    }
  }, []);

  return {
    currentLanguage: i18n.language as LanguageCode,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
} 