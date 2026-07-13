// app/handyman/booking-detail/[id].jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import handymanApi from '@/services/handymanApi';

export default function HandymanBookingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[H-BookingDetail] Mount, id:', id);
    if (!id) {
      console.log('[H-BookingDetail] No id, returning');
      return;
    }

    const fetchBooking = async () => {
      console.log('[H-BookingDetail] Fetching booking', id);
      try {
        const res = await handymanApi.get(`/bookings/${id}/`);
        console.log('[H-BookingDetail] Booking fetched OK:', JSON.stringify(res.data, null, 2));
        setBooking(res.data);
      } catch (err) {
        console.error('[H-BookingDetail] Fetch ERROR:', err.response?.status, err.response?.data || err.message);
        Alert.alert('Error', 'Failed to load booking details');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleStatusAction = async (action, reason = '') => {
    console.log(`[H-BookingDetail] Action: ${action}, id: ${id}`);
    try {
      await handymanApi.patch(`/bookings/${id}/action/`, { action, reason });
      console.log(`[H-BookingDetail] Action ${action} OK`);
      Alert.alert('Success', `Booking ${action}ed successfully`);

      // Refresh
      const res = await handymanApi.get(`/bookings/${id}/`);
      console.log('[H-BookingDetail] Refreshed booking:', JSON.stringify(res.data, null, 2));
      setBooking(res.data);
    } catch (err) {
      console.error('[H-BookingDetail] Action ERROR:', err.response?.status, err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.detail || 'Action failed');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#9ca3af' }}>Booking not found</Text>
      </View>
    );
  }

  const isPending = booking.status === 'pending';
  const isAccepted = booking.status === 'accepted';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Client</Text>
          <View style={styles.personRow}>
            <Image
              source={{
                uri: booking.user?.thumbnail || `https://ui-avatars.com/api/?name=${booking.user?.username}&background=random`
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.personName}>{booking.user?.username}</Text>
              <Text style={styles.personPhone}>{booking.user?.phone || 'No phone'}</Text>
            </View>
          </View>
        </View>

        {/* Booking Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service</Text>
            <Text style={styles.infoValue}>{booking.service_name}</Text>
          </View>
          {booking.category_name && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{booking.category_name}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{booking.location_name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {new Date(booking.scheduled_date).toLocaleString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Amount</Text>
            <Text style={styles.infoValue}>{booking.total_amount} FCFA</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.status, { color: getStatusColor(booking.status) }]}>
              {booking.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{booking.job_description || 'No description'}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {isPending && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={() => handleStatusAction('accept')}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.actionBtnText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.declineBtn]}
                onPress={() => {
                  Alert.alert(
                    'Decline Booking',
                    'Please provide a reason:',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Decline',
                        style: 'destructive',
                        onPress: () => handleStatusAction('decline', 'Declined by handyman'),
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="close" size={20} color="white" />
                <Text style={styles.actionBtnText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}

          {isAccepted && (
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => router.push(`/chat/${id}?source=handyman`)}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#6366F1" />
              <Text style={styles.chatBtnText}>Chat with Client</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusColor(status) {
  const colors = {
    pending: '#f59e0b',
    accepted: '#22c55e',
    declined: '#ef4444',
    completed: '#3b82f6',
    paid: '#8b5cf6',
  };
  return colors[status] || '#6b7280';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 15,
    marginVertical: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  content: { padding: 16 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  personRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  personName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  personPhone: { fontSize: 13, color: '#64748b', marginTop: 2 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#1f2937', flex: 1, textAlign: 'right' },
  status: { fontWeight: '700', fontSize: 14 },
  description: { fontSize: 14, color: '#374151', lineHeight: 20 },
  actionsContainer: { marginTop: 8, marginBottom: 24 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  acceptBtn: { backgroundColor: '#22c55e' },
  declineBtn: { backgroundColor: '#ef4444' },
  actionBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  chatBtnText: { color: '#6366F1', fontWeight: '600', fontSize: 15 },
});
