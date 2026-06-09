import Ionicons from '@expo/vector-icons/Ionicons'
import useHandymanGlobal from '@/services/handymanGlobal'
import { useEffect, useRef, useState } from 'react'
import { AppState, Image, StyleSheet, Text, View, TouchableOpacity, PanResponder } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import handymanApi from '@/services/handymanApi'
import HandymanDashboard from '@/app/handyman/Dashboard'
import ProfileScreen from '@/app/handyman/Profile'
import Myservices from '@/app/handyman/Myservices'
import BookingsScreen from '@/app/handyman/Bookings'
import NotificationsScreen from '@/app/handyman/Notifications'
import SubscriptionScreen from '@/app/handyman/Subscription'
import SupportChatScreen from '@/app/chat/support'
import Sidebar from '@/components/Sidebar'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/core'
import { useRouter } from 'expo-router'

async function callStatus(endpoint) {
  try {
    const token = await AsyncStorage.getItem('handyman_access_token')
    if (!token) return
    await handymanApi.post(endpoint, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
  } catch (e) {}
}

const Tab = createBottomTabNavigator()

export default function HandymanHomeLayout() {
  const navigation = useNavigation();
  const router = useRouter();

  const [unreadCount, setUnreadCount] = useState(0)
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  const [sidebarVisible, setSidebarVisible] = useState(false)

  const authenticated = useHandymanGlobal(s => s.authenticated)
  const logout = useHandymanGlobal(s => s.logout)
  const handyman = useHandymanGlobal(s => s.handyman)
  const appState = useRef(AppState.currentState)

  const handleLogout = async () => {
    await logout();
    router.replace('/handyman/SignIn');
  };

  // Swipe to open sidebar
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && gestureState.dx > 0 && evt.nativeEvent.pageX < 50;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 50) {
          setSidebarVisible(true);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!authenticated) return
    const fetchUnread = async () => {
      try {
        const res = await handymanApi.get('/notifications/unread-count/')
        setUnreadCount(res.data?.unread_count || 0)
      } catch (e) {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [authenticated])

  useEffect(() => {
    if (!authenticated) return;
    const fetchChatUnread = async () => {
      try {
        const res = await handymanApi.get('/chats/my-chats/')
        const newCount = res.data?.filter(chat => chat.has_unread_messages).length || 0
        setChatUnreadCount(newCount)
      } catch (e) {}
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

  function resolveAvatar(thumbnail) {
    if (!thumbnail) return null
    if (thumbnail.startsWith('http')) return thumbnail
    return `http://192.168.43.188:8000/media/${thumbnail}`
  }
  const avatarUrl = resolveAvatar(handyman?.thumbnail)

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
        user={handyman} 
        isHandyman={true} 
        onLogout={handleLogout} 
      />
      <Tab.Navigator screenOptions={{
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#B3E5FC",
          borderTopWidth: 2,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70
        },
        headerLeft: () => (
          <TouchableOpacity style={styles.headerLeftBtn} onPress={() => setSidebarVisible(true)}>
            {handyman?.thumbnail ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {handyman?.username?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ), 
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <TouchableOpacity onPress={() => router.push('/chat/support?source=handyman')} style={{ marginRight: 15 }}>
              <Ionicons name="help-circle-outline" size={28} color="#333" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('ChatsList')}
              style={styles.notificationButton}
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
        {/* <Tab.Screen name="Support" component={SupportChatScreen}
          initialParams={{ source: 'handyman' }}
          options={{ title:'Support',  tabBarIcon: ({color,size}) =>
            <Ionicons name="help-circle-outline" size={size} color={color} /> }} /> */}
      </Tab.Navigator>
    </View>
  )
}

const styles = StyleSheet.create({
  headerLeftBtn: { marginLeft: 15 },
  headerRightContainer: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center'
  },
  avatarInitial: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  notificationButton: { marginRight: 15, padding: 5 },
  badge: {
    position: 'absolute', right: -6, top: -3,
    backgroundColor: '#ef4444', borderRadius: 10,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center'
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
})
