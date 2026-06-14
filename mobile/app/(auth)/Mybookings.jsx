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
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/use-theme-color';

export default function MyBookingsScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [modifyModal, setModifyModal] = useState({ visible: false, booking: null });
  const [newPrice, setNewPrice] = useState('');

  const STATUS_TABS = [
    { key: 'all', label: t('bookings.tab_all', 'All') },
    { key: 'pending', label: t('bookings.tab_pending', 'Pending') },
    { key: 'accepted', label: t('bookings.tab_accepted', 'Accepted') },
    { key: 'completed', label: t('bookings.tab_done', 'Done') },
    { key: 'declined', label: t('bookings.tab_declined', 'Declined') },
  ];

  const user = useGlobal(state => state.user);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/');
      console.log("✅ Bookings fetched:", res.data);
      setBookings(res.data);
    } catch (err) {
      console.error("❌ Fetch error:", err.response?.data || err.message);
      Alert.alert(t('common.error'), t('bookings.load_failed', "Failed to load bookings. Please login again."));
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
      Alert.alert(t('common.error'), t('bookings.invalid_price', "Enter a valid price"));
      return;
    }
    try {
      await api.patch(`/bookings/${modifyModal.booking.id}/modify-price/`, {
        total_amount: parseFloat(newPrice),
      });
      Alert.alert(t('common.success'), t('bookings.price_updated', "Price updated"));
      setModifyModal({ visible: false, booking: null });
      setNewPrice('');
      fetchBookings();
    } catch (err) {
      Alert.alert(t('common.error'), err.response?.data?.detail || t('bookings.modify_failed', "Failed to modify price"));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: theme.accent,
      accepted: theme.success,
      declined: theme.error,
      completed: theme.primary,
      paid: '#8b5cf6',
    };
    return colors[status] || theme.textSecondary;
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
        {item.job_description || t('bookings.no_description', "No description provided")}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.amount}>
          {item.total_amount ? `${item.total_amount} FCFA` : t('bookings.negotiable', "Negotiable")}
        </Text>
        <View style={styles.footerActions}>
          {item.status === 'accepted' && (
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => router.push(`/chat/${item.id}?source=user`)}
            >
              <Ionicons name="chatbubble-outline" size={18} color={theme.primary} />
              <Text style={styles.chatBtnText}>{t('bookings.chat', 'Chat')}</Text>
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
              <Ionicons name="create-outline" size={16} color={theme.accent} />
              <Text style={styles.modifyBtnText}>{t('bookings.modify_price', 'Modify Price')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('bookings.title', 'My Bookings')}</Text>

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
            <Ionicons name="calendar-outline" size={60} color={theme.border} />
            <Text style={styles.emptyText}>{t('bookings.no_bookings', 'No bookings yet')}</Text>
          </View>
        }
      />

      {/* Modify Price Modal */}
      <Modal visible={modifyModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('bookings.modify_modal_title', 'Modify Price')}</Text>
            <Text style={styles.modalSubtitle}>
              {t('bookings.modify_modal_subtitle', { username: modifyModal.booking?.handyman?.username }, `Booking with ${modifyModal.booking?.handyman?.username}`)}
            </Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="numeric"
              value={newPrice}
              onChangeText={setNewPrice}
              placeholder={t('bookings.price_placeholder', "Enter new price (FCFA)")}
              placeholderTextColor={theme.textSecondary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setModifyModal({ visible: false, booking: null }); setNewPrice(''); }}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleModifyPrice}>
                <Text style={styles.modalConfirmText}>{t('common.confirm', 'Confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingTop: 10 },
  title: { fontSize: 24, fontWeight: '700', padding: 20, color: theme.text },
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
    backgroundColor: theme.border,
  },
  tabActive: { backgroundColor: theme.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  tabTextActive: { color: '#fff' },
  bookingCard: {
    backgroundColor: theme.surface,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: theme.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: theme.border
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  handymanAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  info: { flex: 1 },
  handymanName: { fontSize: 16, fontWeight: '600', color: theme.text },
  phone: { fontSize: 12, color: theme.textSecondary, marginTop: 1 },
  date: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '700' },
  jobDesc: { fontSize: 14, color: theme.text, marginBottom: 12, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 15, fontWeight: '600', color: theme.text },
  footerActions: { flexDirection: 'row', gap: 10 },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary + '11',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  chatBtnText: { color: theme.primary, fontWeight: '600', fontSize: 13 },
  modifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accent + '11',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  modifyBtnText: { color: theme.accent, fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: theme.textSecondary },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  modalSubtitle: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  priceInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginTop: 16,
    color: theme.text,
    backgroundColor: theme.background
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  modalCancelText: { fontWeight: '600', color: theme.textSecondary },
  modalConfirm: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: 'center',
  },
  modalConfirmText: { color: 'white', fontWeight: '700' },
});