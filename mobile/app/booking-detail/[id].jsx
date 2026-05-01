// app/booking-detail/[id].jsx
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
import api from '@/services/api';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHandyman, setIsHandyman] = useState(false); // You should get this from your auth context

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${id}/`);
        setBooking(res.data);

        // TODO: Replace with real auth logic
        // setIsHandyman(!!res.data.handyman?.is_current_user);
      } catch (err) {
        Alert.alert("Error", "Failed to load booking details");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleStatusAction = async (action, reason = '') => {
    try {
      await api.patch(`/bookings/${id}/action/`, {
        action,
        reason,
      });
      Alert.alert("Success", `Booking ${action}ed successfully`);
      // Refresh data
      const res = await api.get(`/bookings/${id}/`);
      setBooking(res.data);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.detail || "Action failed");
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
        <Text>Booking not found</Text>
      </View>
    );
  }

  const canChat = booking.status === 'accepted';
  const isPending = booking.status === 'pending';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
        </View>

        {/* Status */}
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
            {booking.status.toUpperCase()}
          </Text>
        </View>

        {/* Party Info */}
        <View style={styles.partyCard}>
          <Image
            source={{ uri: isHandyman ? booking.user?.avatar : booking.handyman?.thumbnail }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.partyName}>
              {isHandyman ? booking.user?.username : booking.handyman?.username}
            </Text>
            <Text style={styles.partyRole}>
              {isHandyman ? "Customer" : "Handyman"}
            </Text>
          </View>
        </View>

        {/* Booking Info */}
        <View style={styles.infoCard}>
          <InfoRow icon="calendar" label="Date & Time" value={new Date(booking.scheduled_date).toLocaleString()} />
          <InfoRow icon="cash" label="Amount" value={booking.total_amount ? `${booking.total_amount} FCFA` : "Negotiable"} />
          <InfoRow icon="location" label="Location" value={booking.location?.name || "Not specified"} />
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {booking.services && booking.services.length > 0 ? (
            booking.services.map((service) => (
              <View key={service.id} style={styles.serviceItem}>
                <Ionicons name="checkmark-circle" size={20} color="#6366F1" />
                <Text style={styles.serviceName}>{service.name}</Text>
              </View>
            ))
          ) : (
            <Text>No services selected</Text>
          )}
        </View>

        {/* Job Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>
            {booking.job_description || "No additional description provided."}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {canChat && (
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => router.push(`/chat/${booking.id}`)}
            >
              <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
              <Text style={styles.chatButtonText}>Open Chat</Text>
            </TouchableOpacity>
          )}

          {/* Handyman Actions */}
          {isHandyman && isPending && (
            <View style={styles.handymanActions}>
              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => handleStatusAction('accept')}
              >
                <Text style={styles.acceptText}>Accept Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.declineButton}
                onPress={() => {
                  Alert.prompt(
                    "Decline Booking",
                    "Please provide a reason:",
                    (reason) => handleStatusAction('decline', reason)
                  );
                }}
              >
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* User Actions - Modify / Cancel */}
          {!isHandyman && booking.can_be_modified && (
            <TouchableOpacity 
              style={styles.modifyButton}
              onPress={() => Alert.alert("Modify", "Modify price feature coming soon")}
            >
              <Text style={styles.modifyText}>Modify Price / Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper Component
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color="#6366F1" />
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', marginLeft: 12 },

  statusContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
  },

  partyCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  partyName: { fontSize: 18, fontWeight: '600' },
  partyRole: { color: '#64748b', marginTop: 2 },

  infoCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoContent: { marginLeft: 12, flex: 1 },
  infoLabel: { fontSize: 13, color: '#64748b' },
  infoValue: { fontSize: 15, fontWeight: '500', marginTop: 2 },

  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1f2937',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },

  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  serviceName: { marginLeft: 10, fontSize: 15 },

  actions: { padding: 16, gap: 12 },

  chatButton: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  chatButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },

  handymanActions: { flexDirection: 'row', gap: 12 },
  acceptButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  acceptText: { color: 'white', fontWeight: '700' },
  declineText: { color: 'white', fontWeight: '700' },

  modifyButton: {
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modifyText: { color: 'white', fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});