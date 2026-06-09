import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  ActivityIndicator, SafeAreaView, TouchableOpacity
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import useHandymanGlobal from '@/services/handymanGlobal';
import handymanApi from '@/services/handymanApi';

export default function HandymanReviewsScreen() {
  const router = useRouter();
  const handyman = useHandymanGlobal(s => s.handyman);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchReviews() {
    if (!handyman?.id) return;
    try {
      const response = await handymanApi.get(`/ratings/handyman/${handyman.id}/?limit=15`);
      // DRF pagination returns { count, next, previous, results }
      setReviews(response.data.results || response.data);
    } catch (error) {
      console.error('[Reviews] Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, [handyman?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  function renderItem({ item }) {
    const userInfo = item.user_info || {};
    const avatarUrl = userInfo.thumbnail;
    const date = item.created_at ? new Date(item.created_at).toLocaleDateString() : '';

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.userAvatar} />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Text style={styles.userInitial}>{userInfo.username?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
          <View style={styles.userMeta}>
            <Text style={styles.username}>{userInfo.username || 'Anonymous'}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text style={styles.ratingValue}>{item.rating}/10</Text>
          </View>
        </View>
        {item.review ? (
          <Text style={styles.reviewText}>{item.review}</Text>
        ) : (
          <Text style={styles.noReviewText}>No written review</Text>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#202020" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={reviews}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="star-outline" size={60} color="#d1d5db" />
            <Text style={styles.emptyText}>No ratings yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#202020' },
  list: { padding: 16 },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: { width: 44, height: 44, borderRadius: 22 },
  userAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: { fontSize: 18, fontWeight: '700', color: '#6b7280' },
  userMeta: { flex: 1, marginLeft: 12 },
  username: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingValue: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  reviewText: { fontSize: 14, color: '#4b5563', lineHeight: 20 },
  noReviewText: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#9ca3af', fontWeight: '500' },
});
