import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  // If NOT authenticated, ONLY allow access to SignIn/SignUp
  if (!isAuthenticated) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignIn" />
        <Stack.Screen name="SignUp" />
        {/* Redirect any other attempt to SignIn */}
        {/* <Stack.Screen name="*" redirect /> */}
      </Stack>
    );
  }

  // If authenticated, allow access to all other pages
  return (
    <Stack screenOptions={{ headerShown: false }}>
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
      {/* <Stack.Screen name="handyman-Profile" /> */}
    </Stack>
  );
}
