import { ActivityIndicator, Image, StyleSheet, Text, View, TouchableOpacity, PanResponder } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedView } from '@/components/themed-view';
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/use-theme-color'
import { ThemedText } from '@/components/themed-text'

import RequestScreen from '@/app/(auth)/Request';
import ProfileScreen from '@/app/(auth)/Profile';
import Mybookings from '@/app/(auth)/Mybookings';
import NotificationsScreen from '@/app/(auth)/Notifications';
import SupportChatScreen from '@/app/chat/support';

import { IconSymbol } from '@/components/ui/icon-symbol';
import useGlobal from '@/services/global'
import api from '@/services/api'
import { useRouter } from 'expo-router'
import Sidebar from '@/components/Sidebar'

const Tab = createBottomTabNavigator()

export default function Home() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const navigation = useNavigation()
  const router = useRouter()
  
  const [unreadCount, setUnreadCount] = useState(0)
  const [newMessagesCount, setNewMessagesCount] = useState(0)
  const [sidebarVisible, setSidebarVisible] = useState(false)

  const user = useGlobal(state => state.user)
  const authenticated = useGlobal(state => state.authenticated)
  const logout = useGlobal(state => state.logout)

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/SignIn');
  };

  // Swipe to open sidebar
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes starting from the left edge
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
        const res = await api.get('/notifications/unread-count/')
        setUnreadCount(res.data?.unread_count || 0)
      } catch (e) {}
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [authenticated])

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
    return thumbnail
  }
  const avatarUrl = resolveAvatar(user?.thumbnail)

  const styles = createStyles(theme)

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} {...panResponder.panHandlers}>
      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
        user={user} 
        isHandyman={false} 
        onLogout={handleLogout} 
      />
      <Tab.Navigator screenOptions={{
        tabBarActiveTintColor: theme.primary,
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
            {user?.thumbnail ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {user?.username?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ), 
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <TouchableOpacity onPress={() => router.push('(auth)/search') }>
              <Ionicons name='search-outline' size={28} color={theme.text} style={{ marginRight: 15 }} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => router.push('/chat/support')} style={{ marginRight: 15 }}>
              <Ionicons name="help-circle-outline" size={28} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ChatsList')} style={styles.chatButton}>
              <Ionicons name='send-outline' size={28} color={theme.text} />
              {newMessagesCount > 0 && (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatBadgeText}>{newMessagesCount > 9 ? '9+' : newMessagesCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ),
      }}>
        <Tab.Screen 
          name='Request' 
          component={RequestScreen}
          options={{
            title: t('tabs.home', 'Home'),
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }} 
        />
        <Tab.Screen 
          name='Mybookings' 
          component={Mybookings} 
          options={{
            title: t('tabs.bookings', 'My bookings'),
            tabBarIcon: ({ color }) => <Feather name="book-open" size={24} color={color} />,
          }} 
        />
        <Tab.Screen 
          name='Notifications' 
          component={NotificationsScreen}
          options={{
            title: t('tabs.notifications', 'Notifications'),
            tabBarBadge: unreadCount > 0 ? '' : undefined,
            tabBarBadgeStyle: { backgroundColor: theme.error, minWidth: 8, height: 8, borderRadius: 4 },
            tabBarIcon: ({ color }) => <Ionicons name='notifications' size={25} color={color} />,
          }} 
        />
        <Tab.Screen 
          name='Profile' 
          component={ProfileScreen} 
          options={{
            title: t('tabs.profile', 'Profile'),
            tabBarIcon: ({ color }) => <Ionicons name='person' size={25} color={color} />
          }} 
        />
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
  chatButton: { position: 'relative', marginRight: 15 },
  chatBadge: {
    position: 'absolute', right: -6, top: -3,
    backgroundColor: theme.error, borderRadius: 10,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center'
  },
  chatBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
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
  securityNoticeText: { fontSize: 12, color: theme.text, flex: 1, fontWeight: '500' }
})
