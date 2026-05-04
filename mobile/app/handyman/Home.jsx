// import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import useHandymanGlobal from '@/services/handymanGlobal'
import { useEffect, useRef, useState } from 'react'
import { AppState, Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import handymanApi from '@/services/handymanApi'
import HandymanDashboard from '@/app/handyman/Dashboard'
import ProfileScreen from '@/app/handyman/Profile'
import Myservices from '@/app/handyman/Myservices'
import BookingsScreen from '@/app/handyman/Bookings'
import NotificationsScreen from '@/app/handyman/Notifications'
import SubscriptionScreen from '@/app/handyman/Subscription'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/core'


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
  const navigation = useNavigation();

  const [unreadCount, setUnreadCount] = useState(0)
  const [chatUnreadCount, setChatUnreadCount] = useState(0)

  const authenticated = useHandymanGlobal(s => s.authenticated)
  const appState      = useRef(AppState.currentState)

  // Fetch unread notification count
  useEffect(() => {
    if (!authenticated) return

    const fetchUnread = async () => {
      try {
        const res = await handymanApi.get('/notifications/unread-count/')
        setUnreadCount(res.data?.unread_count || 0)
      } catch (e) {}
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 15000) // poll every 15s
    return () => clearInterval(interval)
  }, [authenticated])

  // Fetch unread chat messages count
  useEffect(() => {
    if (!authenticated) return;

    const fetchChatUnread = async () => {
      try {
        const res = await handymanApi.get('/chats/my-chats/')
        const newCount = res.data?.filter(chat => chat.has_unread_messages).length || 0
        console.log('[Home] Chat unread count:', newCount)
        setChatUnreadCount(newCount)
      } catch (e) {
        console.error('[Home] Error fetching chat unread:', e.response?.status, e.message)
      }
    }

    fetchChatUnread()
    const interval = setInterval(fetchChatUnread, 15000)
    return () => clearInterval(interval)
  }, [authenticated])

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
       return `http://192.168.43.188:8000/media/${thumbnail}`
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
       headerRight: () => (
             <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <TouchableOpacity 
                 onPress={() => navigation.navigate('ChatsList')}
                 style={[styles.notificationButton, { marginRight: 10 }]}
               >
                 <Ionicons name="send-outline" size={24} color="#333" />
                 {chatUnreadCount > 0 && (
                   <View style={styles.badge}>
                     <Text style={styles.badgeText}>{chatUnreadCount > 9 ? '9+' : chatUnreadCount}</Text>
                   </View>
                 )}
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={() => navigation.navigate('Notifications')}
                 style={styles.notificationButton}
               >
                 <Ionicons name="notifications-outline" size={24} color="#333" />
                 {unreadCount > 0 && (
                   <View style={styles.badge}>
                     <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                   </View>
                 )}
               </TouchableOpacity>
             </View>
            ), 
    }}>
      <Tab.Screen name="Dashboard" component={HandymanDashboard}
        options={{ title:'Dashboard', tabBarIcon: ({color,size}) =>
          <Ionicons name="grid-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Bookings" component={BookingsScreen}
        options={{ title:'Bookings', tabBarIcon: ({color,size}) =>
          <Ionicons name="calendar-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Subscription" component={SubscriptionScreen}
        options={{ 
          title:'Subscription',  
          tabBarIcon: ({color,size}) =>
            <Ionicons name="card-outline" size={size} color={color} />
        }} />
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
  notificationButton: {
    marginRight: 15,
    marginTop: 5,
    padding: 5,
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

})