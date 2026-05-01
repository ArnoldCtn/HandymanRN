import { Text } from '@react-navigation/elements';
import { Redirect, Stack } from 'expo-router'
import { useState } from 'react';

export default function AuthRoutesLayout() {
  const { isSignedIn } = useState();
  //chek is user is sign In

  if (isSignedIn) {
    // return <Redirect href={'/'} />
    // if(!isSignedIn) return <Redirect href={"/(auth)/SignIn"} />;

  }

  return <Stack screenOptions={{
    headerShown:false,
             
  }}>
<Stack.Screen name='AllServices' />
<Stack.Screen name='ServiceHandyman' />
  </Stack>

  
}