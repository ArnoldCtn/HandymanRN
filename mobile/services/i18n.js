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

const ZUSTAND_SETTINGS_KEY = 'app-settings';

const initI18n = async () => {
  let savedLanguage = 'en';
  
  try {
    const settingsStr = await AsyncStorage.getItem(ZUSTAND_SETTINGS_KEY);
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      savedLanguage = settings.state?.language || 'en';
    } else {
      const deviceLanguage = Localization.getLocales()[0].languageCode;
      savedLanguage = deviceLanguage === 'fr' ? 'fr' : 'en';
    }
  } catch (e) {
    console.error('[i18n] Error loading settings:', e);
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
};

initI18n();

export default i18n;
