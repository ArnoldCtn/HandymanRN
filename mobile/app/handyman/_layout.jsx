import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import useHandymanGlobal from '@/services/handymanGlobal'

export default function HandymanAuthLayout() {
  const initialized   = useHandymanGlobal(s => s.initialized)
  const authenticated = useHandymanGlobal(s => s.authenticated)
  const init          = useHandymanGlobal(s => s.init)

  useEffect(() => {
    init()
    global.__forceHandymanLogout = async () => {
      const logout = useHandymanGlobal.getState().logout
      await logout()
    }
  }, [])

  // ── Wait for AsyncStorage read before any routing ──
  if (!initialized) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    )
  }

  // ── If not authenticated, lock to auth screens ─────
  if (!authenticated) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignIn" />
        <Stack.Screen name="SignUp" />
      </Stack>
    )
  }

  // ── Authenticated — show full app ──────────────────
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" />
      <Stack.Screen name="PINSettings" />
    </Stack>
  )
}