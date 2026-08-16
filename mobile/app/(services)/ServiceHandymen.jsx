// app/(services)/ServiceHandymen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import handymanApi from '@/services/handymanApi';
import { resolveMediaUrl } from '@/services/mediaUrl';

export default function ServiceHandymenScreen() {
  const router = useRouter();
  const { id, name, description, categoryId } = useLocalSearchParams();

  const [handymen, setHandymen] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(
    categoryId ? Number(categoryId) : null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchHandymen(categoryId = null) {
    if (!id) {
      console.log("No service ID received");
      setLoading(false);
      return;
    }

    console.log(`Fetching handymen for service ID: ${id}, category: ${categoryId || 'all'}`);

    try {
      setLoading(true);
      const params = categoryId ? `?category=${categoryId}` : '';
      const res = await handymanApi.get(`/handymen/services/${id}/handymen/${params}`);
      
      console.log("API Response:", res.data);
      setHandymen(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log("Full Error:", error?.response?.data || error.message);
      Alert.alert('Error', 'Failed to load handymen');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await handymanApi.get('/services/categories/');
      const serviceId = Number(id);
      const filtered = (res.data || []).filter(
        (c) => Number(c.service) === serviceId
      );
      setCategories(filtered);
    } catch (error) {
      console.log("Failed to fetch categories:", error);
    }
  }

  function handleCategoryPress(categoryId) {
    if (selectedCategory === categoryId) {
      // Deselect: show all
      setSelectedCategory(null);
      fetchHandymen(null);
    } else {
      setSelectedCategory(categoryId);
      fetchHandymen(categoryId);
    }
  }

  useEffect(() => {
    fetchHandymen(selectedCategory);
    fetchCategories();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHandymen(selectedCategory);
  };

  function resolveAvatar(thumbnail) {
    return resolveMediaUrl(thumbnail);
  }

  function renderHandyman({ item }) {
    const avatar = resolveAvatar(item.thumbnail);

    // function onPressHandyman(item){
    //   router.push({
    //     pathname:'(auth)/handymanProfile/[id]',
    //     params: {id : item.id}
    //   })
    // }


    return (
     <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/(auth)/handyman-Profile/${item.id}`)}   // ← Best way
    >
        <View style={styles.avatarWrap}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {item.username?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.is_online ? '#22C55E' : '#CBD5E1' },
            ]}
          />
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{item.username}</Text>
          <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
          {item.phone ? (
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={12} color="#94A3B8" />
              <Text style={styles.cardPhone}>{item.phone}</Text>
            </View>
          ) : null}

          <View style={styles.statusPill}>
            <View
              style={[
                styles.statusPillDot,
                { backgroundColor: item.is_online ? '#22C55E' : '#9CA3AF' },
              ]}
            />
            <Text
              style={[
                styles.handyStatus,
                { color: item.is_online ? '#16A34A' : '#6B7280' },
              ]}
              numberOfLines={1}
            >
              {item.is_online ? 'Active now' : (item.last_seen || 'Offline')}
            </Text>
          </View>
        </View>

        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={20} color="#6366F1" />
        </View>
      </TouchableOpacity>
    );
  }

  if (loading && handymen.length === 0) {
    return (
      <SafeAreaView style={styles.loaderScreen}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loaderText}>Loading handymen…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={styles.backBtnGhost} />
      </View>

      {description ? (
        <View style={styles.descriptionCard}>
          <Ionicons name="information-circle-outline" size={18} color="#6366F1" />
          <Text style={styles.headerDescription}>{description}</Text>
        </View>
      ) : null}

      {categories.length > 0 && (
        <View style={styles.categoryTabsContainer}>
          <Text style={styles.categoryTabsLabel}>Filter by category</Text>
          <View style={styles.categoryTabsWrap}>
            <TouchableOpacity
              style={[
                styles.categoryTab,
                !selectedCategory && styles.categoryTabActive,
              ]}
              onPress={() => handleCategoryPress(null)}
              activeOpacity={0.85}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.categoryTabText,
                  !selectedCategory && styles.categoryTabTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryTab,
                    isSelected && styles.categoryTabActive,
                  ]}
                  onPress={() => handleCategoryPress(category.id)}
                  activeOpacity={0.85}
                >
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="white"
                      style={styles.categoryTabIcon}
                    />
                  )}
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.categoryTabText,
                      isSelected && styles.categoryTabTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <FlatList
        data={handymen}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderHandyman}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeaderRow}>
            <Text style={styles.listHeader}>
              {handymen.length} Handyman{handymen.length !== 1 ? 's' : ''} Available
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={48} color="#C7D2FE" />
            </View>
            <Text style={styles.emptyText}>No handymen available yet</Text>
            <Text style={styles.emptySubtext}>
              Try a different category or check back later.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const COLORS = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#EEF1F6',
  primary: '#6366F1',
  primaryLight: '#EEF2FF',
  textPrimary: '#111827',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loaderScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  loaderText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 8,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnGhost: { width: 38, height: 38 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    color: COLORS.textPrimary,
    marginHorizontal: 8,
  },

  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerDescription: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },

  // ---- Category chips: flex-wrap so the row NEVER overflows or disperses,
  // no matter how many categories are added now or later. ----
  categoryTabsContainer: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  categoryTabsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  categoryTabsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    maxWidth: '100%',
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  categoryTabIcon: { marginRight: 5 },
  categoryTabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.primary,
    flexShrink: 1,
  },
  categoryTabTextActive: {
    color: 'white',
    fontWeight: '700',
  },

  listContent: { padding: 16, paddingTop: 14, flexGrow: 1 },
  listHeaderRow: { marginBottom: 12 },
  listHeader: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  avatarWrap: { position: 'relative', marginRight: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: 'white', fontSize: 22, fontWeight: '700' },
  statusDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.card,
  },

  cardBody: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  cardEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  cardPhone: { fontSize: 12.5, color: COLORS.textTertiary },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  statusPillDot: { width: 6, height: 6, borderRadius: 3 },
  handyStatus: { fontSize: 12.5, fontWeight: '600' },

  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  emptySubtext: {
    color: COLORS.textTertiary,
    marginTop: 6,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
  },
});