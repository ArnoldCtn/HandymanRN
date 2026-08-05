import Ionicons from '@expo/vector-icons/Ionicons'
import useHandymanGlobal from '@/services/handymanGlobal'
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { AppState, Image, StyleSheet, Text, View, TouchableOpacity, PanResponder, ScrollView } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import handymanApi from '@/services/handymanApi'
import api from '@/services/api' // Assuming this is the global api for all services
import HandymanDashboard from '@/app/handyman/Dashboard'
import ProfileScreen from '@/app/handyman/Profile'
import Myservices from '@/app/handyman/Myservices'
import BookingsScreen from '@/app/handyman/Bookings'
import NotificationsScreen from '@/app/handyman/Notifications'
import SupportChatScreen from '@/app/chat/support'
import Sidebar from '@/components/Sidebar'
import PulseView from '@/components/PulseView'
import ServiceCarousel from '@/components/ServiceCarousel'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/use-theme-color'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
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

// ... imports
import HandymanServiceCarousel from '@/components/HandymanServiceCarousel'
// ...

function DashboardWrapper({ theme, t, router }) {
    const [services, setServices] = useState([])
    
    const fetchServices = useCallback(() => {
        // Fetch all platform services
        api.get('/services/').then(res => setServices(res.data))
    }, [])

    useFocusEffect(fetchServices)
    
    const styles = createStyles(theme);
    
    return (
        <ThemedView style={{flex:1}}>
          <ScrollView contentContainerStyle={{paddingBottom: 20}}>
            <HandymanDashboard />
            <View style={styles.serviceHeader}>
                <ThemedText type="defaultSemiBold" style={{margin:16, marginBottom:0}}>{t('dashboard.all_services', 'All Services')}</ThemedText>
                <TouchableOpacity onPress={() => router.push('/handyman/AllServices')}>
                    <ThemedText type="link" style={{margin:16, marginBottom:0}}>{t('common.view_all', 'View All')}</ThemedText>
                </TouchableOpacity>
            </View>
            <HandymanServiceCarousel services={services} />
            <PulseView style={styles.securityNotice}>
                <Ionicons name="shield-alert-outline" size={20} color={theme.accent} />
                <Text style={styles.securityNoticeText}>{t('dashboard.handyman_security_notice')}</Text>
            </PulseView>
          </ScrollView>
        </ThemedView>
    )
}

export default function HandymanHomeLayout() {
  const { t } = useTranslation()
  const theme = useAppTheme()
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
        const res = await Promise.race([
          handymanApi.get('/notifications/unread-count/'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
        ])
        setUnreadCount(res.data?.unread_count || 0)
      } catch (e) {
        console.log('[HandymanHome] fetchUnread error:', e.message)
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [authenticated])

  useEffect(() => {
    if (!authenticated) return;
    const fetchChatUnread = async () => {
      try {
        const res = await Promise.race([
          handymanApi.get('/chats/my-chats/'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
        ])
        const newCount = res.data?.filter(chat => chat.has_unread_messages).length || 0
        setChatUnreadCount(newCount)
      } catch (e) {
        console.log('[HandymanHome] fetchChatUnread error:', e.message)
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

  function resolveAvatar(thumbnail) {
    if (!thumbnail) return null
    if (thumbnail.startsWith('http')) return thumbnail
    return thumbnail
  }
  const avatarUrl = resolveAvatar(handyman?.thumbnail)

  const styles = createStyles(theme)

  const DashboardScreen = useMemo(() => () => <DashboardWrapper theme={theme} t={t} router={router} />, [theme, t, router]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} {...panResponder.panHandlers}>
      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
        user={handyman} 
        isHandyman={true} 
        onLogout={handleLogout} 
      />
      <Tab.Navigator screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70
        },
        headerStyle: {
          backgroundColor: theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.text,
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
              <Ionicons name="help-circle-outline" size={28} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('ChatsList')}
              style={styles.notificationButton}
            >
              <Ionicons name="send-outline" size={24} color={theme.text} />
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
              <Ionicons name="notifications-outline" size={24} color={theme.text} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ), 
      }}>
        <Tab.Screen name="Dashboard" component={DashboardScreen}
          options={{ title: t('sidebar.dashboard'), tabBarIcon: ({color,size}) =>
            <Ionicons name="grid-outline" size={size} color={color} /> }} />
        <Tab.Screen name="Bookings" component={BookingsScreen}
          options={{ title: t('sidebar.bookings'), tabBarIcon: ({color,size}) =>
            <Ionicons name="calendar-outline" size={size} color={color} /> }} />
        <Tab.Screen name="Myservices" component={Myservices}
          options={{ title: t('sidebar.my_services'),  tabBarIcon: ({color,size}) =>
            <Ionicons name="briefcase-outline" size={size} color={color} /> }} />
        <Tab.Screen name="Profile" component={ProfileScreen}
          options={{ title: t('tabs.profile'),  tabBarIcon: ({color,size}) =>
            <Ionicons name="person-outline" size={size} color={color} /> }} />
      </Tab.Navigator>
    </View>
  )
}

const createStyles = (theme) => StyleSheet.create({
  headerLeftBtn: { marginLeft: 15 },
  headerRightContainer: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.primary,
    alignItems: 'center', justifyContent: 'center'
  },
  avatarInitial: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  notificationButton: { marginRight: 15, padding: 5 },
  badge: {
    position: 'absolute', right: -6, top: -3,
    backgroundColor: theme.error, borderRadius: 10,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center'
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  securityNotice: {
    backgroundColor: theme.accent + '22',
    padding: 12,
    margin: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.accent + '44'
  },
  securityNoticeText: { fontSize: 12, color: theme.text, flex: 1, fontWeight: '500' },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }
})
