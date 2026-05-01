import { Redirect, Tabs } from 'expo-router';
import React, { useState } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import Ionicons from '@expo/vector-icons/Ionicons';


export default function TabLayout() {
  const colorScheme = useColorScheme();
const {isSignedIn} = useState()

    // if(!isSignedIn) return <Redirect href={"/(auth)/SignIn"} />;
  
  return (
    <Tabs
      screenOptions={{
         headerShown:false,
      tabBarActiveTintColor:"#0277BD",
      tabBarInactiveTintColor:"#4FC3F7",
      tabBarStyle:{
        backgroundColor:"#FFFFFF",
        borderTopColor:"#B3E5FC",
        borderTopWidth:1,
        paddingBottom:8,
        paddingTop:8,
        height:60
      },
      tabBarLabelStyle:{
        fontSize:20,
        fontWeight:"700",
      },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
