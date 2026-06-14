// app/(auth)/Notifications.jsx
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
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/use-theme-color';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error("❌ Fetch notifications error:", err.response?.data || err.message);
      Alert.alert(t('common.error'), t('notifications.load_failed', "Failed to load notifications"));
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
      await api.patch(`/notifications/${id}/read/`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error("❌ Mark as read error:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all/');
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (err) {
      console.error("❌ Mark all as read error:", err);
    }
  };

  const handleNotificationPress = (notification) => {
    console.log('[U-Notif] Pressed notification:', notification.id, 'type:', notification.notification_type);
    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    const bookingId = notification.booking?.id;
    if (!bookingId) {
      console.log('[U-Notif] No bookingId, returning');
      return;
    }

    if (notification.notification_type === 'new_message') {
      console.log('[U-Notif] Navigating to chat:', bookingId);
      router.push(`/chat/${bookingId}?source=user`);
    } else {
      console.log('[U-Notif] Navigating to booking-detail:', bookingId);
      router.push(`/booking-detail/${bookingId}`);
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
      case 'booking_request': return theme.accent;
      case 'booking_accepted': return theme.success;
      case 'booking_declined': return theme.error;
      case 'booking_completed': return theme.primary;
      case 'new_message': return theme.primary;
      case 'payment_success': return '#8b5cf6';
      default: return theme.textSecondary;
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

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('notifications.title', 'Notifications')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllReadBtn} onPress={markAllAsRead}>
            <Text style={styles.markAllReadText}>{t('notifications.mark_all_read', 'Mark all read')}</Text>
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
            <Ionicons name="notifications-off-outline" size={60} color={theme.border} />
            <Text style={styles.emptyText}>{t('notifications.no_notifications', 'No notifications')}</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingTop: 50 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: theme.text },
  markAllReadBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.border, borderRadius: 12 },
  markAllReadText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
  notificationCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: theme.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    borderWidth: 1,
    borderColor: theme.border
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
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
  title: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 },
  unreadTitle: { fontWeight: '700' },
  body: { fontSize: 14, color: theme.textSecondary, lineHeight: 20, marginBottom: 8 },
  time: { fontSize: 12, color: theme.textSecondary },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary,
    marginLeft: 8,
    marginTop: 4,
  },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: theme.textSecondary },
});
