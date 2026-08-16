// app/handyman/Notifications.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import handymanApi from '@/services/handymanApi';

export default function HandymanNotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Debug: Check if we have a token
      const token = await AsyncStorage.getItem('handyman_access_token');
      console.log('🔑 Handyman notifications token exists:', !!token);
      console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'none');
      
      const res = await handymanApi.get('/notifications/');
      console.log('✅ Handyman notifications API call successful');
      console.log('📊 Response status:', res.status);
      console.log('📊 Response data length:', res.data?.length || 0);
      console.log('📊 Full response data:', JSON.stringify(res.data, null, 2));
      
      setNotifications(res.data || []);
    } catch (err) {
      console.error("❌ Fetch handyman notifications error:");
      console.error("❌ Error status:", err.response?.status);
      console.error("❌ Error data:", err.response?.data);
      console.error("❌ Error message:", err.message);
      console.error("❌ Full error:", err);
      
      Alert.alert("Error", `Failed to load notifications (${err.response?.status || 'Network'}). Please check your connection and login.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  };

  const markAsRead = async (id) => {
    try {
      await handymanApi.patch(`/notifications/${id}/read/`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error("❌ Mark as read error:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await handymanApi.post('/notifications/read-all/');
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error("❌ Mark all as read error:", err);
    }
  };

  const handleNotificationPress = (notification) => {
    console.log('[H-Notif] Pressed notification:', notification.id, 'type:', notification.notification_type);
    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    const bookingId = notification.booking?.id;
    if (!bookingId) {
      console.log('[H-Notif] No bookingId, returning');
      return;
    }

    if (notification.notification_type === 'new_message') {
      console.log('[H-Notif] Navigating to chat:', bookingId);
      router.push(`/chat/${bookingId}?source=handyman`);
    } else {
      console.log('[H-Notif] Navigating to handyman booking-detail:', bookingId);
      router.push(`/handyman/booking-detail/${bookingId}`);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_request': return 'calendar-outline';
      case 'booking_accepted': return 'checkmark-circle-outline';
      case 'booking_declined': return 'close-circle-outline';
      case 'booking_completed': return 'checkmark-done-outline';
      case 'new_message': return 'chatbubble-outline';
      case 'payment_success': return 'card-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking_request': return '#f59e0b';
      case 'booking_accepted': return '#22c55e';
      case 'booking_declined': return '#ef4444';
      case 'booking_completed': return '#3b82f6';
      case 'new_message': return '#6366F1';
      case 'payment_success': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.is_read && styles.unreadCard
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.notification_type) + '20' }]}>
          <Ionicons 
            name={getNotificationIcon(item.notification_type)} 
            size={20} 
            color={getNotificationColor(item.notification_type)} 
          />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, !item.is_read && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>
            {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!item.is_read && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;
//  <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={24} color="#202020" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Edit Profile</Text>
//         <View style={{ width:24 }} />
//       </View>
  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
           <Ionicons name="arrow-back" size={24} color="#202020" />
         </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {/* <Text style={styles.headerTitle}></Text> */}
        
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllReadBtn} onPress={markAllAsRead}>
            <Text style={styles.markAllReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotification}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 30 },
  header: {
    flexDirection: 'row',
    justifyContent: 'start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1f2937',padding:10 },
  markAllReadBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#e5e7eb', borderRadius: 12 },
  markAllReadText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  notificationCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  unreadTitle: { fontWeight: '700' },
  body: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 8 },
  time: { fontSize: 12, color: '#9ca3af' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    marginLeft: 8,
    marginTop: 4,
  },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#9ca3af' },
});
