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

export default function HandymanBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const res = await handymanApi.get('/handymen/me/bookings/');
      console.log('✅ Handyman bookings fetched successfully:', res.data);
      setBookings(res.data);
    } catch (err) {
      console.error("❌ Fetch handyman bookings error:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to load your booking requests. Please make sure you are logged in.");
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

  const handleBookingAction = async (bookingId, action) => {
    try {
      const res = await handymanApi.patch(`/bookings/${bookingId}/action/`, { action });
      console.log(`✅ Booking ${action} successfully:`, res.data);
      
      // Refresh bookings list
      fetchBookings();
      
      Alert.alert("Success", `Booking ${action}ed successfully!`);
    } catch (err) {
      console.error(`❌ Failed to ${action} booking:`, err.response?.data || err.message);
      Alert.alert("Error", `Failed to ${action} booking. Please try again.`);
    }
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
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Image 
          source={{ uri: item.user?.thumbnail || `https://ui-avatars.com/api/?name=${item.user?.username}&background=random` }} 
          style={styles.userAvatar}
        />
        <View style={styles.info}>
          <Text style={styles.userName}>{item.user?.username}</Text>
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

      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>Service: {item.service?.name}</Text>
        <Text style={styles.amount}>
          {item.total_amount ? `${item.total_amount} FCFA` : "Price to be negotiated"}
        </Text>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => handleBookingAction(item.id, 'accept')}
          >
            <Ionicons name="checkmark" size={16} color="white" />
            <Text style={styles.actionBtnText}>Accept</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={() => {
              Alert.alert(
                "Decline Booking",
                "Are you sure you want to decline this booking?",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Decline", 
                    style: "destructive",
                    onPress: () => handleBookingAction(item.id, 'decline')
                  }
                ]
              );
            }}
          >
            <Ionicons name="close" size={16} color="white" />
            <Text style={styles.actionBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'accepted' && (
        <TouchableOpacity 
          style={styles.chatBtn}
          onPress={() => router.push(`/chat/${item.id}`)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#6366F1" />
          <Text style={styles.chatBtnText}>Chat with Client</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking Requests</Text>
      
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBooking}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>No booking requests yet</Text>
            <Text style={styles.emptySubText}>You'll see requests here when clients book your services</Text>
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
  userAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  info: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },
  jobDesc: { fontSize: 14, color: '#374151', marginBottom: 12, lineHeight: 20 },
  serviceInfo: { marginBottom: 12 },
  serviceName: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  amount: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptBtn: { backgroundColor: '#22c55e' },
  declineBtn: { backgroundColor: '#ef4444' },
  actionBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start'
  },
  chatBtnText: { color: '#6366F1', fontWeight: '600', fontSize: 14 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#9ca3af', textAlign: 'center' },
  emptySubText: { marginTop: 8, fontSize: 14, color: '#d1d5db', textAlign: 'center' },
});
