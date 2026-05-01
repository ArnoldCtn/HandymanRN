import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import useGlobal from '@/services/global';
import useHandymanGlobal from '@/services/handymanGlobal';


function SplashScreen() {
  return (
    <View style={styles.splash}>
      {/* Replace with your own logo/image if you have one */}
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>RT</Text>
      </View>
      <Text style={styles.appName}>Handyman West</Text>
      <ActivityIndicator
        size="large"
        color="#6366F1"
        style={{ marginTop: 40 }}
      />
    </View>
  );
}

export default function HomeScreen() {
  const initialized = useGlobal(state => state.initialized)
  const authenticated = useGlobal(state => state.authenticated)
  const init = useGlobal(state => state.init)

  const clientInit          = useGlobal(s => s.init)
  const clientInitialized   = useGlobal(s => s.initialized)
  const clientAuthenticated = useGlobal(s => s.authenticated)

  const handymanInit          = useHandymanGlobal(s => s.init)
  const handymanInitialized   = useHandymanGlobal(s => s.initialized)
  const handymanAuthenticated = useHandymanGlobal(s => s.authenticated)

  // useEffect(() => {
  //   init()
  // }, [])

   useEffect(() => {
    clientInit()
    handymanInit()
  }, [])

  // ── Show inline splash while loading — no route, no back stack ──
  // if (!initialized) {
  //   return <SplashScreen />
  // }

  if (!clientInitialized || !handymanInitialized) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    )
  }

  if (!authenticated) {
    return <Redirect href="/(auth)/SignIn" />
  }

    // Already logged in as client
  if (clientAuthenticated)  return <Redirect href="/(auth)/Home"     />

  // Already logged in as handyman
  if (handymanAuthenticated) return <Redirect href="/handyman/Home" />

  return <Redirect href="/(auth)/Home" />
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#202020',
  },
})

