import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Feather from '@expo/vector-icons/Feather';

import RequestScreen from '@/app/(auth)/Request';
import ProfileScreen from '@/app/(auth)/Profile';
// import VerifyEmail from '@/app/(auth)/verifyEmail';
import Mybookings from '@/app/(auth)/Mybookings';

import { IconSymbol } from '@/components/ui/icon-symbol';
import Ionicons from '@expo/vector-icons/Ionicons';
import useGlobal from '@/services/global'

// import index from '@/app/(auth)/index';

export default function Home() {
  const Tab = createBottomTabNavigator()

 
   const user   = useGlobal(state => state.user)   // ← Zustand only, no AsyncStorage
 
   function resolveAvatar(thumbnail) {
     if (!thumbnail) return null
     if (thumbnail.startsWith('http')) return thumbnail
     return `http://192.168.1.XXX:8000/media/${thumbnail}`
   }
   const avatarUrl = resolveAvatar(user?.thumbnail)
 
   
  return (
    <Tab.Navigator screenOptions={{
      tabBarActiveTintColor:"#0277BD",
      tabBarInactiveTintColor:"#4FC3F7",
      tabBarStyle:{
        backgroundColor:"#FFFFFF",
        borderTopColor:"#B3E5FC",
        borderTopWidth:2,
        paddingBottom:8,
        paddingTop:8,
        height:70
      },
      headerLeft: () => (
       <View style={styles.container}>
             {user?.thumbnail ? (
             <Image
                 source={{ uri: avatarUrl }}
                 style={styles.avatar}
                 onError={() => console.log('[Home] Avatar failed to load:', avatarUrl)}
               />      ) : (
               <View style={styles.avatarPlaceholder}>
                 <Text style={styles.avatarInitial}>
                   {user?.username?.[0]?.toUpperCase() ?? '?'}
                 </Text>
               </View>
             )}
             {/* <Text style={styles.username}>{user?.username}</Text> */}
             {/* <Text style={styles.email}>{user?.email}</Text> */}
           </View>
      ), 
       headerRight: () => (
       <View style={styles.container}>
         <Ionicons name='search-outline' size={35} color='#090808' style={styles.search} />
             </View>
      ),
      
    }}>
      <Tab.Screen name='Request' component={RequestScreen}
      options={{
                title: 'Home',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
              }} />

               <Tab.Screen name='Mybookings' component={Mybookings} 
                options={{
                title: 'My bookings',
                tabBarIcon: ({ color }) => <Feather name="book-open" size={24} color="#d0d0d0" />,
                 }} />

      <Tab.Screen name='Profile' component={ProfileScreen} 
      options={{
                title: 'Profile',
                tabBarIcon: ({ color }) => <Ionicons name='person' size={25} color='#d0d0d0' />
,
              }} />
      {/* <Tab.Screen name='index' component={index} /> */}
     
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
   container: { alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 45, marginBottom: 10,marginLeft:10,marginTop:5 },
  avatarPlaceholder: {
    width: 40, height: 40, borderRadius: 45,
    backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,marginLeft:10,marginTop:5
  },
  avatarInitial: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  username: { fontSize: 22, fontWeight: '700', color: '#202020' },
  email: { fontSize: 14, color: 'gray', marginTop: 4 },
  search: { width: 40, height: 40, borderRadius: 45, marginBottom: 10,marginRight:10,marginTop:5 },

})