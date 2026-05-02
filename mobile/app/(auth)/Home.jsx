import { ActivityIndicator, Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Feather from '@expo/vector-icons/Feather';

import RequestScreen from '@/app/(auth)/Request';
import ProfileScreen from '@/app/(auth)/Profile';
// import VerifyEmail from '@/app/(auth)/verifyEmail';
import Mybookings from '@/app/(auth)/Mybookings';
import NotificationsScreen from '@/app/(auth)/Notifications';

import { IconSymbol } from '@/components/ui/icon-symbol';
import Ionicons from '@expo/vector-icons/Ionicons';
import useGlobal from '@/services/global'
import api from '@/services/api'

// import index from '@/app/(auth)/index';

export default function Home() {
  const Tab = createBottomTabNavigator()
  const navigation = useNavigation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [newMessagesCount, setNewMessagesCount] = useState(0)

  const user = useGlobal(state => state.user)
  const authenticated = useGlobal(state => state.authenticated)

  // Fetch unread notification count
  useEffect(() => {
    if (!authenticated) return

    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count/')
        setUnreadCount(res.data?.unread_count || 0)
      } catch (e) {}
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [authenticated])

  // Fetch new messages count
  useEffect(() => {
    if (!authenticated) return

    const fetchNewMessages = async () => {
      try {
        const res = await api.get('/chats/my-chats/')
        const newCount = res.data?.filter(chat => chat.has_unread_messages).length || 0
        setNewMessagesCount(newCount)
      } catch (e) {}
    }

    fetchNewMessages()
    const interval = setInterval(fetchNewMessages, 15000)
    return () => clearInterval(interval)
  }, [authenticated])

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
         <TouchableOpacity onPress={() => navigation.navigate('ChatsList')} style={styles.chatButton}>
           <Ionicons name='send-outline' size={35} color='#090808' style={styles.search} />
           {newMessagesCount > 0 && (
             <View style={styles.chatBadge}>
               <Text style={styles.chatBadgeText}>{newMessagesCount > 9 ? '9+' : newMessagesCount}</Text>
             </View>
           )}
         </TouchableOpacity>
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

      <Tab.Screen name='Notifications' component={NotificationsScreen}
                options={{
                  title: 'Notifications',
                  tabBarBadge: unreadCount > 0 ? '' : undefined,
                  tabBarBadgeStyle: { backgroundColor: '#ef4444', minWidth: 8, height: 8, borderRadius: 4 },
                  tabBarIcon: ({ color }) => <Ionicons name='notifications' size={25} color='#d0d0d0' />,
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
   container: { alignItems: 'center', justifyContent: 'center',flexDirection:'row' },
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
  chatButton: {
    position: 'relative',
    marginRight: 10,
  },
  chatBadge: {
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
  chatBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

})