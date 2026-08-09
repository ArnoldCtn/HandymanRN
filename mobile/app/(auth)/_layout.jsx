import { Redirect, Stack, useSegments } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  // Wait until auth state and segments are fully hydrated
  if (isLoading || !segments || segments.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const currentScreen = segments[segments.length - 1];
  const publicScreens = ['SignIn', 'SignUp', 'verifyEmail', 'index'];
  const isPublicScreen = publicScreens.includes(currentScreen);

  if (!isAuthenticated && !isPublicScreen) {
    return <Redirect href="/(auth)/SignIn" />;
  }

  if (isAuthenticated && isPublicScreen && currentScreen !== 'index') {
    return <Redirect href="/(auth)/Home" />;
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