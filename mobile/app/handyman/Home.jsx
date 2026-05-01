// import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import useHandymanGlobal from '@/services/handymanGlobal'
import { useEffect, useRef } from 'react'
import { AppState, Image, StyleSheet, Text, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import handymanApi from '@/services/handymanApi'
import HandymanDashboard from '@/app/handyman/Dashboard'
import ProfileScreen from '@/app/handyman/Profile'
import Myservices from '@/app/handyman/Myservices'
import BookingsScreen from '@/app/handyman/Bookings'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'


async function callStatus(endpoint) {
  try {
    const token = await AsyncStorage.getItem('handyman_access_token')
    if (!token) return
    await handymanApi.post(endpoint, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch (e) {}
}

export default function HandymanHomeLayout() {
      const Tab = createBottomTabNavigator()
    
  const authenticated = useHandymanGlobal(s => s.authenticated)
  const appState      = useRef(AppState.currentState)

  useEffect(() => {
    if (!authenticated) return
    callStatus('/handymen/me/online/')
    const sub = AppState.addEventListener('change', next => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        callStatus('/handymen/me/online/')
      } else if (appState.current === 'active' && next.match(/inactive|background/)) {
        callStatus('/handymen/me/offline/')
      }
      appState.current = next
    })
    return () => sub.remove()
  }, [authenticated])


  const user   = useHandymanGlobal(state => state.handyman)   // ← Zustand only, no AsyncStorage
   
     function resolveAvatar(thumbnail) {
       if (!thumbnail) return null
       if (thumbnail.startsWith('http')) return thumbnail
       return `http://192.168.1.XXX:8000/media/${thumbnail}`
     }
     const avatarUrl = resolveAvatar(user?.thumbnail)
   

  return (
    <Tab.Navigator screenOptions={{
      
      tabBarActiveTintColor:   '#f59e0b',  // amber — different from client
      tabBarInactiveTintColor: '#9ca3af',
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
    }}>
      <Tab.Screen name="Dashboard" component={HandymanDashboard}
        options={{ title:'Dashboard', tabBarIcon: ({color,size}) =>
          <Ionicons name="grid-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Bookings" component={BookingsScreen}
        options={{ title:'Bookings', tabBarIcon: ({color,size}) =>
          <Ionicons name="calendar-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Myservices" component={Myservices}
        options={{ title:'My Services',  tabBarIcon: ({color,size}) =>
          <Ionicons name="briefcase-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ title:'Profile',  tabBarIcon: ({color,size}) =>
          <Ionicons name="person-outline" size={size} color={color} /> }} />
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