import React, { Component } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import '@/services/i18n';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ToastProvider } from '@/hooks/useToast';
import { SupportListener } from '@/components/SupportListener';
import { AuthProvider } from '@/hooks/useAuth';
import useSettingsStore from '@/services/settingsStore';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const themePreference = useSettingsStore(s => s.theme);
  
  const colorScheme = themePreference === 'system' ? systemColorScheme : themePreference;

  return (
    <GestureHandlerRootView style={styles.flexOne}>
      <ErrorBoundary>
        <SafeAreaProvider style={styles.flexOne}>
          <AuthProvider>
            <ToastProvider>
              <SupportListener />
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <View style={styles.flexOne}>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="booking-detail" options={{ headerShown: false }} />
                    <Stack.Screen name="chat" options={{ headerShown: false }} />
                    <Stack.Screen name="(services)" options={{ headerShown: false }} />
                    <Stack.Screen name="handyman" options={{ headerShown: false }} />
                    <Stack.Screen name="wallet" options={{ headerShown: false }} />
                    <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                  </Stack>
                  <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                </View>
              </ThemeProvider>
            </ToastProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    paddingHorizontal: 20,
  },
});