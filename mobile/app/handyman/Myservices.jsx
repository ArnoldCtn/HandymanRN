// app/(handyman-tabs)/my-bookings.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import handymanApi from '@/services/handymanApi';
import useHandymanGlobal from '@/services/handymanGlobal'


export default function HandymanBookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

    const authenticated = useHandymanGlobal(s => s.authenticated)
  const [unreadCount, setUnreadCount] = useState(0)

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

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Debug: Check if we have a token
      const token = await AsyncStorage.getItem('handyman_access_token');
      console.log('🔑 Myservices token exists:', !!token);
      console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'none');
      
      const res = await handymanApi.get('/bookings/');
      console.log('✅ Myservices API call successful');
      console.log('📊 Response status:', res.status);
      console.log('📊 Response data length:', res.data?.length || 0);
      console.log('📊 Full response data:', JSON.stringify(res.data, null, 2));
      
      setBookings(res.data || []);
    } catch (err) {
      console.error("❌ Fetch myservices error:");
      console.error("❌ Error status:", err.response?.status);
      console.error("❌ Error data:", err.response?.data);
      console.error("❌ Error message:", err.message);
      console.error("❌ Full error:", err);
      
      Alert.alert("Error", `Failed to load bookings (${err.response?.status || 'Network'}). Please check your connection and login.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (bookingId, action, reason = '') => {
    try {
      await handymanApi.patch(`/bookings/${bookingId}/action/`, {
        action,
        reason
      });
      Alert.alert("Success", `Booking ${action}ed`);
      fetchBookings();
    } catch (err) {
      Alert.alert("Error", "Failed to update booking");
    }
  };

  const renderBooking = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: item.user?.thumbnail || 'https://via.placeholder.com/50' }} 
          style={styles.avatar}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{item.user?.username}</Text>
          <Text style={styles.date}>{new Date(item.scheduled_date).toLocaleDateString()}</Text>
        </View>
        <Text style={[styles.status, { color: item.status === 'pending' ? '#f59e0b' : '#22c55e' }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.description}>{item.job_description}</Text>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.acceptBtn}
            onPress={() => handleAction(item.id, 'accept')}
          >
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.declineBtn}
            onPress={() => {
              Alert.prompt("Decline Reason", "Why are you declining?", 
                (reason) => handleAction(item.id, 'decline', reason)
              );
            }}
          >
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'accepted' && (
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => router.push(`/chat/${item.id}?source=handyman`)}
        >
          <Ionicons name="chatbubble" size={20} color="#fff" />
          <Text style={styles.chatButtonText}>Open Chat</Text>
           {unreadCount > 0 && (
                           <View style={styles.badge}>
                             <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                           </View>
                         )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Bookings & Chats</Text>
      <FlatList
        data={bookings}
        keyExtractor={item => item.id.toString()}
        renderItem={renderBooking}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchBookings} />}
        ListEmptyComponent={
                  <View style={styles.empty}>
                    <Ionicons name="calendar-outline" size={60} color="#9ca3af" />
                    <Text style={styles.emptyText}>No bookings Request yet</Text>
                  </View>
                }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 24, fontWeight: '700', padding: 20 },
  bookingCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  info: { flex: 1 },
  name: { fontWeight: '600', fontSize: 16 },
  date: { color: '#666', fontSize: 13 },
  status: { fontWeight: '700', fontSize: 12 },
  description: { color: '#374151', marginVertical: 8 },
  actionButtons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  acceptBtn: { flex: 1, backgroundColor: '#22c55e', padding: 12, borderRadius: 12, alignItems: 'center' },
  declineBtn: { flex: 1, backgroundColor: '#ef4444', padding: 12, borderRadius: 12, alignItems: 'center' },
  acceptText: { color: 'white', fontWeight: '600' },
  declineText: { color: 'white', fontWeight: '600' },
  chatButton: {
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  chatButtonText: { color: 'white', fontWeight: '600' },

  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#9ca3af' },
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
});