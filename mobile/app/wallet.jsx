import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, RefreshControl, Dimensions, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';
import handymanApi from '@/services/handymanApi';

const { width } = Dimensions.get('window');

const WalletIcon = ({ color = "#6366F1", size = 24 }) => (
  <Ionicons name="wallet-outline" size={size} color={color} />
);

const TransactionIcon = ({ type, status, size = 20 }) => {
  const color = status === 'success' ? '#10B981' : (status === 'failed' ? '#EF4444' : '#F59E0B');
  return (
    <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
      {type === 'credit' ? (
        <Ionicons name="arrow-down-outline" size={size} color={color} />
      ) : (
        <Ionicons name="arrow-up-outline" size={size} color={color} />
      )}
    </View>
  );
};

export default function WalletScreen() {
  const router = useRouter();
  const { source } = useLocalSearchParams();
  const isHandyman = source === 'handyman';
  const client = isHandyman ? handymanApi : api;

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchWallet = async () => {
    try {
      const res = await client.get('/payments/wallet/');
      setWallet(res.data);
    } catch (e) {
      console.error('[Wallet] Error fetching wallet:', e);
    }
  };

  const fetchTransactions = async (pageNum = 1, shouldAppend = false) => {
    try {
      const res = await client.get(`/payments/transactions/?page=${pageNum}`);
      const newData = res.data.results || [];
      if (shouldAppend) {
        setTransactions(prev => [...prev, ...newData]);
      } else {
        setTransactions(newData);
      }
      setHasMore(!!res.data.next);
    } catch (e) {
      console.error('[Wallet] Error fetching transactions:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchWallet();
    fetchTransactions(1, false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage, true);
    }
  };

  const renderTransaction = ({ item }) => {
    const isCredit = item.transaction_type === 'credit';
    const relatedName = isHandyman ? item.related_user_info?.username : item.related_handyman_info?.username;

    return (
      <View style={styles.txCard}>
        <TransactionIcon type={item.transaction_type} status={item.status} />
        <View style={styles.txInfo}>
          <Text style={styles.txTitle} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.txSubtitle}>
            {relatedName ? `${isCredit ? 'From' : 'To'}: ${relatedName}` : 'System'} • {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.txAmountContainer}>
          <Text style={[styles.txAmount, { color: isCredit ? '#10B981' : '#EF4444' }]}>
            {isCredit ? '+' : '-'}{parseFloat(item.amount).toLocaleString()}
          </Text>
          <Text style={[styles.txStatus, { color: item.status === 'success' ? '#10B981' : (item.status === 'failed' ? '#EF4444' : '#F59E0B') }]}>
            {item.status}
          </Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={item => item.id.toString()}
        renderItem={renderTransaction}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <WalletIcon color="#fff" size={28} />
              <Text style={styles.balanceLabel}>Current Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>
              {parseFloat(wallet?.balance || 0).toLocaleString()} <Text style={styles.currency}>FCFA</Text>
            </Text>

            {isHandyman && (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Gross</Text>
                  <Text style={styles.statValue}>{parseFloat(wallet?.total_earned_gross || 0).toLocaleString()}</Text>
                </View>
                <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.statLabel}>App Fees</Text>
                  <Text style={styles.statValue}>{parseFloat(wallet?.total_app_commissions || 0).toLocaleString()}</Text>
                </View>
                <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.statLabel}>Net Earned</Text>
                  <Text style={styles.statValue}>{parseFloat(wallet?.total_earned_net || 0).toLocaleString()}</Text>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={60} color="#d1d5db" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    ...Platform.select({ android: { paddingTop: 40 } })
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  list: { padding: 16, paddingBottom: 40 },
  balanceCard: {
    backgroundColor: '#6366F1',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '500' },
  balanceAmount: { color: 'white', fontSize: 32, fontWeight: '800' },
  currency: { fontSize: 18, fontWeight: '600', opacity: 0.9 },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { color: 'white', fontSize: 14, fontWeight: '700', marginTop: 4 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  iconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, marginLeft: 16 },
  txTitle: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  txSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  txAmountContainer: { alignItems: 'flex-end' },
  txAmount: { fontSize: 16, fontWeight: '700' },
  txStatus: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize', marginTop: 2 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#9ca3af', fontWeight: '500' },
});
