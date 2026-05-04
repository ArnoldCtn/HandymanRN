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
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';
import useGlobal from '@/services/global'

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Done' },
  { key: 'declined', label: 'Declined' },
];

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [modifyModal, setModifyModal] = useState({ visible: false, booking: null });
  const [newPrice, setNewPrice] = useState('');

  const user = useGlobal(state => state.user);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/');
      console.log("✅ Bookings fetched:", res.data);
      setBookings(res.data);
    } catch (err) {
      console.error("❌ Fetch error:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to load bookings. Please login again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings().finally(() => setRefreshing(false));
  };

  const filteredBookings = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  const handleModifyPrice = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      Alert.alert("Error", "Enter a valid price");
      return;
    }
    try {
      await api.patch(`/bookings/${modifyModal.booking.id}/modify-price/`, {
        total_amount: parseFloat(newPrice),
      });
      Alert.alert("Success", "Price updated");
      setModifyModal({ visible: false, booking: null });
      setNewPrice('');
      fetchBookings();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.detail || "Failed to modify price");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      accepted: '#22c55e',
      declined: '#ef4444',
      completed: '#3b82f6',
      paid: '#8b5cf6',
    };
    return colors[status] || '#6b7280';
  };

  const renderBooking = ({ item }) => (
    <TouchableOpacity
      style={styles.bookingCard}
      onPress={() => router.push(`/booking-detail/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.handyman?.thumbnail || `https://ui-avatars.com/api/?name=${item.handyman?.username}&background=random` }}
          style={styles.handymanAvatar}
        />
        <View style={styles.info}>
          <Text style={styles.handymanName}>{item.handyman?.username}</Text>
          <Text style={styles.phone}>{item.handyman?.phone}</Text>
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
          {item.total_amount ? `${item.total_amount} FCFA` : "Negotiable"}
        </Text>
        <View style={styles.footerActions}>
          {item.status === 'accepted' && (
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => router.push(`/chat/${item.id}?source=user`)}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#6366F1" />
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
          )}
          {(item.status === 'pending' || item.status === 'accepted') && (
            <TouchableOpacity
              style={styles.modifyBtn}
              onPress={() => {
                setNewPrice(String(item.total_amount || ''));
                setModifyModal({ visible: true, booking: item });
              }}
            >
              <Ionicons name="create-outline" size={16} color="#f59e0b" />
              <Text style={styles.modifyBtnText}>Modify Price</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>

      {/* Status Filter Tabs */}
      <View style={styles.tabBar}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBookings}
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

      {/* Modify Price Modal */}
      <Modal visible={modifyModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modify Price</Text>
            <Text style={styles.modalSubtitle}>
              Booking with {modifyModal.booking?.handyman?.username}
            </Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="numeric"
              value={newPrice}
              onChangeText={setNewPrice}
              placeholder="Enter new price (FCFA)"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setModifyModal({ visible: false, booking: null }); setNewPrice(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleModifyPrice}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 10 },
  title: { fontSize: 24, fontWeight: '700', padding: 20, color: '#1f2937' },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  tabActive: { backgroundColor: '#6366F1' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  tabTextActive: { color: '#fff' },
  bookingCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  handymanAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  info: { flex: 1 },
  handymanName: { fontSize: 16, fontWeight: '600' },
  phone: { fontSize: 12, color: '#64748b', marginTop: 1 },
  date: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },
  jobDesc: { fontSize: 14, color: '#374151', marginBottom: 12, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  footerActions: { flexDirection: 'row', gap: 10 },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  chatBtnText: { color: '#6366F1', fontWeight: '600', fontSize: 13 },
  modifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  modifyBtnText: { color: '#f59e0b', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#9ca3af' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  modalSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  priceInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginTop: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  modalCancelText: { fontWeight: '600', color: '#475569' },
  modalConfirm: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  modalConfirmText: { color: 'white', fontWeight: '700' },
});