import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import '@/services/i18n'; // Initialize i18n
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ToastProvider } from '@/hooks/useToast';
import { SupportListener } from '@/components/SupportListener';
import { AuthProvider } from '@/hooks/useAuth';
import useSettingsStore from '@/services/settingsStore';

export const unstable_settings = {
  anchor: '(auth)',
};

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const themePreference = useSettingsStore(s => s.theme);
  
  const colorScheme = themePreference === 'system' ? systemColorScheme : themePreference;

  return (
    <AuthProvider>
      <ToastProvider>
        <SupportListener />
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="booking-detail" options={{ headerShown: false }} />
            <Stack.Screen name="chat" options={{ headerShown: false }} />
            <Stack.Screen name="(services)" options={{ headerShown: false }} />
            <Stack.Screen name="handyman" options={{ headerShown: false }} />
            <Stack.Screen name="wallet" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </ThemeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
