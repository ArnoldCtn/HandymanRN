import { Redirect, Stack, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGlobal from '@/services/global';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export const unstable_settings = {
  initialRouteName: 'index',
};

const PUBLIC_SCREENS = ['SignIn', 'SignUp', 'verifyEmail'];

export default function AuthLayout() {
  const initialized   = useGlobal(state => state.initialized);
  const authenticated = useGlobal(state => state.authenticated);
  const init          = useGlobal(state => state.init);
  const segments      = useSegments();
  const [isHandymanSession, setIsHandymanSession] = useState(false);

  useEffect(() => {
    init();
    global.__forceUserLogout = async () => {
      const logout = useGlobal.getState().logout;
      await logout();
    };
    AsyncStorage.getItem('handyman_access_token')
      .then(tok => setIsHandymanSession(!!tok))
      .catch(() => setIsHandymanSession(false));
  }, []);

  console.log('[AuthLayout] render', { initialized, authenticated, segments });

  // Only wait for persisted auth state. Do NOT gate on segments: rendering the
  // navigator as early as possible is what lets navigation state hydrate.
  // Gating on segments previously caused an infinite loader on reload.
  if (!initialized) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // A stored handyman session belongs to the handyman side; route it there so a
  // reload lands back on the handyman dashboard instead of a client SignIn.
  if (!authenticated && isHandymanSession) {
    return <Redirect href="/handyman" />;
  }

  const currentScreen = segments && segments.length ? segments[segments.length - 1] : null;
  const isPublicScreen = PUBLIC_SCREENS.includes(currentScreen);

  if (currentScreen && !authenticated && !isPublicScreen) {
    return <Redirect href="/(auth)/SignIn" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="SignIn" />
      <Stack.Screen name="SignUp" />
      <Stack.Screen name="Home" />
      <Stack.Screen name="Mybookings" />
      <Stack.Screen name="Favorites" />
      <Stack.Screen name="Notifications" />
      <Stack.Screen name="Profile" />
      <Stack.Screen name="ChatsList" />
      <Stack.Screen name="EditProfile" />
      <Stack.Screen name="Request" />
      <Stack.Screen name="PINSettings" />
      <Stack.Screen name="search" />
      <Stack.Screen name="verifyEmail" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
