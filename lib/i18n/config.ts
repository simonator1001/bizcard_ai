import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      scan: {
        title: "Scan Business Card",
        uploadButton: "Click or drag and drop to upload business card images",
        dragAndDrop: "Multiple files supported",
        processing: "Processing...",
        success: "Card processed successfully",
        error: "Failed to process card"
      },
      errors: {
        notLoggedIn: "Please log in to scan business cards"
      }
    }
  },
  zh: {
    translation: {
      scan: {
        title: "扫描名片",
        uploadButton: "点击或拖放上传名片图片",
        dragAndDrop: "支持多个文件",
        processing: "处理中...",
        success: "名片处理成功",
        error: "名片处理失败"
      },
      errors: {
        notLoggedIn: "请登录后扫描名片"
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
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });
}

export default i18n; 