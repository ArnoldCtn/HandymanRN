import { useEffect, useState, useCallback } from 'react';
import {
  View, Dimensions, Text, FlatList, Image, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';   // Use authenticated api
import handymanApi from '@/services/handymanApi';   // Use authenticated api
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/use-theme-color';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = (SCREEN_WIDTH - 48) / 2;

export default function AllServicesScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();

  const [allData, setAllData] = useState([]);        // Combined services + handymen
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [minRating, setMinRating] = useState(0);

  // Fetch both Services, Categories and Handymen
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const ratingQuery = minRating > 0 ? `?min_rating=${minRating}` : '';
      const [servicesRes, categoriesRes, handymenRes] = await Promise.all([
        api.get('/services/'),
        api.get('/services/categories/'),
        handymanApi.get(`/handymen/search/${ratingQuery}`)
      ]);

      const services = servicesRes.data.map(item => ({
        ...item,
        type: 'service',
        searchKey: item.name.toLowerCase()
      }));

      const categories = categoriesRes.data.map(item => ({
        ...item,
        type: 'category',
        searchKey: item.name.toLowerCase(),
        service_id: item.service,
      }));

      const handymen = handymenRes.data.map(item => {
        const serviceNames = (item.services || []).map(s => (s.name || s).toLowerCase()).join(' ');
        const categoryNames = (item.categories || []).map(c => (c.name || c).toLowerCase()).join(' ');
        return {
          ...item,
          type: 'handyman',
          searchKey: `${item.username.toLowerCase() || ''} ${item.location?.toLowerCase() || ''} ${serviceNames} ${categoryNames}`
        };
      });

      const combined = [...services, ...categories, ...handymen];
      setAllData(combined);
      setFiltered([]); // Start empty
    } catch (e) {
      console.error('[AllServicesScreen] Fetch Error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch when minRating changes
  useEffect(() => {
    fetchAllData();
  }, [minRating]);

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // Live Search
  useEffect(() => {
    if (!search.trim() && minRating === 0) {
      setFiltered([]); // Show nothing when empty
    } else {
      const term = search.toLowerCase().trim();
      const isNumber = !isNaN(parseFloat(term)) && isFinite(term);
      const ratingThreshold = isNumber ? parseFloat(term) : minRating;

      const results = allData.filter(item => {
        const matchesTerm = !term || item.searchKey.includes(term) ||
          (item.description && item.description.toLowerCase().includes(term));

        if (item.type === 'handyman') {
          const rating = parseFloat(item.average_rating) || 0;
          const matchesRating = rating >= ratingThreshold;

          if (isNumber) {
            return matchesRating;
          }
          return matchesTerm && matchesRating;
        }
        return matchesTerm;
      });
      setFiltered(results);
    }
  }, [search, allData, minRating]);

  const renderCard = ({ item }) => {
    const isHandyman = item.type === 'handyman';
    const isCategory = item.type === 'category';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          if (isHandyman) {
            router.push(`/(auth)/handyman-Profile/${item.id}`);
          } else if (isCategory) {
            // Navigate to the service with the category pre-filtered
            router.push({
              pathname: '/(services)/ServiceHandymen',
              params: { 
                id: item.service_id, 
                name: item.name,
                description: item.description || '',
                categoryId: item.id
              }
            });
          } else {
            router.push({
              pathname: '/(services)/ServiceHandymen',
              params: { 
                id: item.id, 
                name: item.name,
                description: item.description || ''
              }
            });
          }
        }}
      >
        {(item.image || item.thumbnail) && !isCategory ? (
          <Image 
            source={{ uri: item.image || item.thumbnail }} 
            style={styles.cardImage} 
            resizeMode="cover" 
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons 
              name={isHandyman ? "person-outline" : isCategory ? "pricetag-outline" : "construct-outline"} 
              size={32} 
              color={theme.textSecondary} 
            />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>
            {isHandyman ? item.username : item.name}
          </Text>
          {isHandyman ? <Text style={{ color: theme.textSecondary }}>
            {item.location || ''}
          </Text> : null}

          {isHandyman ? (
            <Text style={styles.cardDesc} numberOfLines={1}>
              {item.average_rating ? `${item.average_rating} ` : t('search.no_ratings', 'No ratings')}
              {item.average_rating ? <Ionicons name="star" size={14} color={theme.accent} /> : null}
            </Text>
          ) : null}

          {isCategory && item.price ? (
            <Text style={styles.cardPrice}>{parseFloat(item.price).toLocaleString()} FCFA</Text>
          ) : null}

          <Text style={styles.cardDesc} numberOfLines={2}>
            {isHandyman ? (item.bio || t('search.type_handyman')) : (item.description || '')}
          </Text>
          <Text style={styles.typeBadge}>
            {isHandyman ? t('search.type_handyman') : isCategory ? t('search.type_category', 'Category') : t('search.type_service')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('search.discover')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color={theme.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          placeholder={t('search.placeholder')}
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => `${item.type}-${item.id}`}
        renderItem={renderCard}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchAllData();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={60} color={theme.border} />
            <Text style={styles.emptyText}>{t('search.no_results')}</Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 15,
    marginTop: 40,
    backgroundColor: theme.surface, 
    borderBottomWidth: 1, 
    borderColor: theme.border 
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.text },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: { flex: 1, fontSize: 16, color: theme.text },

  card: {
    width: CARD_W,
    backgroundColor: theme.card,
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: theme.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: theme.border
  },
  cardImage: { width: '100%', height: 120 },
  cardImagePlaceholder: {
    width: '100%', 
    height: 120, 
    backgroundColor: theme.border, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  cardBody: { padding: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: theme.text },
  cardDesc: { fontSize: 12, color: theme.textSecondary, marginTop: 4, lineHeight: 16 },
  cardPrice: { fontSize: 13, fontWeight: '700', color: theme.primary, marginTop: 4 },
  typeBadge: {
    fontSize: 11,
    color: theme.primary,
    fontWeight: '600',
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: theme.primary + '11',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  empty: { 
    alignItems: 'center', 
    marginTop: 100 
  },
  emptyText: { 
    color: theme.textSecondary, 
    marginTop: 12, 
    fontSize: 16 
  },
});