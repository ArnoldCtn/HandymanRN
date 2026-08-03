import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../assets/locales/en.json';
import fr from '../assets/locales/fr.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

// Initialize synchronously with default language
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Then load saved language asynchronously
const loadSavedLanguage = async () => {
  try {
    const settingsStr = await AsyncStorage.getItem('app-settings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      const savedLanguage = settings.state?.language || 'en';
      i18n.changeLanguage(savedLanguage);
    } else {
      const deviceLanguage = Localization.getLocales()[0].languageCode;
      i18n.changeLanguage(deviceLanguage === 'fr' ? 'fr' : 'en');
    }
  } catch (e) {
    console.error('[i18n] Error loading settings:', e);
  }
};

loadSavedLanguage();

export default i18n;