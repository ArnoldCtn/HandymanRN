// app/(tabs)/my-bookings.jsx
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
import Ionicons from '@expo/vector-icons/Ionicons';
import handymanApi from '@/services/handymanApi';

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const res = await handymanApi.get('/bookings/');
      console.log('res',res)
      console.log("✅ Bookings fetched successfully:", res.data);
      setBookings(res.data);
    } catch (err) {
      console.error("❌ Fetch bookings error:", err.response?.data || err.message);
      console.error('error:', err)
      
      Alert.alert("Error", "Failed to load your bookings. Please make sure you are logged in.");
      console.log("Error", "Failed to load your bookings. Please make sure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings().finally(() => setRefreshing(false));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#22c55e';
      case 'declined': return '#ef4444';
      case 'completed': return '#3b82f6';
      case 'paid': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const renderBooking = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookingCard}
      onPress={() => router.push(`/booking-detail/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: item.handyman?.thumbnail }} 
          style={styles.handymanAvatar}
        />
        <View style={styles.info}>
          <Text style={styles.handymanName}>{item.handyman?.username}</Text>
          <Text style={styles.date}>
            {new Date(item.scheduled_date).toLocaleDateString()} • 
            {new Date(item.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.jobDesc} numberOfLines={2}>
        {item.job_description || "No description provided"}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.amount}>
          {item.total_amount ? `${item.total_amount} FCFA` : "Price to be negotiated"}
        </Text>
        
        {item.status === 'accepted' && (
          <TouchableOpacity 
            style={styles.chatBtn}
            onPress={() => router.push(`/chat/${item.id}`)}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#6366F1" />
            <Text style={styles.chatBtnText}>Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>
      
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBooking}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>No bookings yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 50 },
  title: { fontSize: 24, fontWeight: '700', padding: 20, color: '#1f2937' },
  bookingCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  handymanAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  info: { flex: 1 },
  handymanName: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },
  jobDesc: { fontSize: 14, color: '#374151', marginBottom: 12, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  chatBtnText: { color: '#6366F1', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#9ca3af' },
});

