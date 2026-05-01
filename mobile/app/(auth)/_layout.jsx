import { Redirect, Stack } from 'expo-router'
import { useState } from 'react';
import useGlobal from '@/services/global'
import useOnlineStatus from '@/services/useOnlineStatus'    // ← import

export default function AuthRoutesLayout() {
  // const { isSignedIn } = useState();
  //chek is user is sign In

    const authenticated = useGlobal(state => state.authenticated)

  // ── Single line — handles everything automatically ──
  useOnlineStatus(authenticated)

  

  return <Stack screenOptions={{
    headerShown:false
  }}>
<Stack.Screen name='SignIn' />
<Stack.Screen name='SignUp' />
<Stack.Screen name='Home' />
  </Stack>

  
}