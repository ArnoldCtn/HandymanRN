// app/booking-detail/[id].jsx — USER ONLY
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, TextInput, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';

export default function UserBookingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modifyModal, setModifyModal] = useState(false);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    console.log('[U-BookingDetail] Mount, id:', id);
    if (!id) { console.log('[U-BookingDetail] No id'); return; }

    const fetchBooking = async () => {
      console.log('[U-BookingDetail] Fetching booking', id);
      try {
        const res = await api.get(`/bookings/${id}/`);
        console.log('[U-BookingDetail] Fetched OK:', JSON.stringify(res.data, null, 2));
        setBooking(res.data);
      } catch (err) {
        console.error('[U-BookingDetail] Fetch ERROR:', err.response?.status, err.response?.data || err.message);
        Alert.alert('Error', 'Failed to load booking details');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleComplete = async () => {
    console.log('[U-BookingDetail] Mark complete, id:', id);
    try {
      await api.patch(`/bookings/${id}/action/`, { action: 'complete' });
      console.log('[U-BookingDetail] Complete OK');
      Alert.alert('Success', 'Booking marked as completed');
      const res = await api.get(`/bookings/${id}/`);
      setBooking(res.data);
    } catch (err) {
      console.error('[U-BookingDetail] Complete ERROR:', err.response?.status, err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.detail || 'Action failed');
    }
  };

  const handleModifyPrice = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      Alert.alert('Error', 'Enter a valid price');
      return;
    }
    console.log('[U-BookingDetail] Modify price to', newPrice);
    try {
      await api.patch(`/bookings/${id}/modify-price/`, { total_amount: parseFloat(newPrice) });
      console.log('[U-BookingDetail] Price modified OK');
      Alert.alert('Success', 'Price updated');
      setModifyModal(false);
      setNewPrice('');
      const res = await api.get(`/bookings/${id}/`);
      setBooking(res.data);
    } catch (err) {
      console.error('[U-BookingDetail] Modify ERROR:', err.response?.status, err.response?.data || err.message);
      Alert.alert('Error', err.response?.data?.detail || 'Failed to modify price');
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
        {/* Handyman Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Handyman</Text>
          <View style={styles.personRow}>
            <Image
              source={{
                uri: booking.handyman?.thumbnail || `https://ui-avatars.com/api/?name=${booking.handyman?.username}&background=random`
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.personName}>{booking.handyman?.username}</Text>
              <Text style={styles.personPhone}>{booking.handyman?.phone || 'No phone'}</Text>
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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{booking.location_name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{new Date(booking.scheduled_date).toLocaleString()}</Text>
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
          {isAccepted && (
            <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
              <Text style={styles.completeText}>Mark as Completed</Text>
            </TouchableOpacity>
          )}

          {isPending && (
            <TouchableOpacity
              style={styles.modifyButton}
              onPress={() => { setNewPrice(String(booking.total_amount || '')); setModifyModal(true); }}
            >
              <Text style={styles.modifyText}>Modify Price</Text>
            </TouchableOpacity>
          )}
        </View>

        {(isPending || isAccepted) && (
          <TouchableOpacity style={styles.chatButton} onPress={() => router.push(`/chat/${id}?source=user`)}>
            <Ionicons name="chatbubble-outline" size={20} color="#6366F1" />
            <Text style={styles.chatButtonText}>Chat with Handyman</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={modifyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modify Price</Text>
            <TextInput
              style={styles.priceInput} keyboardType="numeric" value={newPrice}
              onChangeText={setNewPrice} placeholder="Enter new price (FCFA)"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setModifyModal(false); setNewPrice(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleModifyPrice}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStatusColor(status) {
  const colors = { pending: '#f59e0b', accepted: '#22c55e', declined: '#ef4444', completed: '#3b82f6', paid: '#8b5cf6' };
  return colors[status] || '#6b7280';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  content: { padding: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  personRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  personName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  personPhone: { fontSize: 13, color: '#64748b', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#1f2937', flex: 1, textAlign: 'right' },
  status: { fontWeight: '700', fontSize: 14 },
  description: { fontSize: 14, color: '#374151', lineHeight: 20 },
  actionsContainer: { marginTop: 8, marginBottom: 12 },
  completeButton: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  completeText: { color: 'white', fontWeight: '600', fontSize: 15 },
  modifyButton: { backgroundColor: '#f59e0b', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  modifyText: { color: 'white', fontWeight: '600', fontSize: 15 },
  chatButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f0f9ff', paddingVertical: 14, borderRadius: 10, gap: 8, marginBottom: 24,
  },
  chatButtonText: { color: '#6366F1', fontWeight: '600', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  priceInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 16, marginTop: 16 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  modalCancelText: { fontWeight: '600', color: '#475569' },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6366F1', alignItems: 'center' },
  modalConfirmText: { color: 'white', fontWeight: '700' },
});