import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      card: {
        details: {
          title: 'Business Card Details',
          description: 'View and edit business card information',
          nameEnglish: 'Name (English)',
          nameChinese: 'Name (Chinese)',
          companyEnglish: 'Company (English)',
          companyChinese: 'Company (Chinese)',
          titleEnglish: 'Title (English)',
          titleChinese: 'Title (Chinese)',
          email: 'Email',
          phone: 'Phone',
          addressEnglish: 'Address (English)',
          addressChinese: 'Address (Chinese)',
          remarks: 'Remarks'
        },
        noImage: 'No image available',
        download: {
          noImage: 'No image available to download',
          success: 'Business card image downloaded successfully',
          error: 'Failed to download business card image'
        },
        delete: {
          title: 'Delete Business Card',
          description: 'Are you sure you want to delete this business card? This action cannot be undone.',
          cancel: 'Cancel',
          confirm: 'Delete'
        }
      },
      actions: {
        save: 'Save',
        cancel: 'Cancel',
        copyLink: 'Copy Link'
      },
      errors: {
        chineseOnly: 'This field only accepts Chinese characters',
        englishOnly: 'This field only accepts English characters'
      }
    }
  }
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      defaultNS: 'translation',
      ns: ['translation'],
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });
}

export default i18n; 