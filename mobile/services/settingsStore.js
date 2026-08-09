import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './i18n';

const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'system', // 'light' | 'dark' | 'system'
      language: 'en', // 'en' | 'fr'

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
      },
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => AsyncStorage),

      // Keep only raw data in storage
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),

      // Corrected callback signature: (state, error)
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[SettingsStore] Real hydration error:', error);
        } else if (state?.language) {
          // Sync i18n with the persisted language on app launch
          i18n.changeLanguage(state.language);
        }
      },
    }
  )
);

export default useSettingsStore;