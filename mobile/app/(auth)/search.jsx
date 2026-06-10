import { useEffect, useState, useCallback } from 'react';
import {
  View, Dimensions, Text, FlatList, Image, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';   // Use authenticated api
import handymanApi from '@/services/handymanApi';   // Use authenticated api

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = (SCREEN_WIDTH - 48) / 2;

export default function AllServicesScreen() {
  const router = useRouter();

  const [allData, setAllData] = useState([]);        // Combined services + handymen
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [minRating, setMinRating] = useState(0);

  // Fetch both Services and Handymen
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const ratingQuery = minRating > 0 ? `?min_rating=${minRating}` : '';
      const [servicesRes, handymenRes] = await Promise.all([
        api.get('/services/'),
        handymanApi.get(`/handymen/search/${ratingQuery}`)
      ]);

      const services = servicesRes.data.map(item => ({
        ...item,
        type: 'service',
        searchKey: item.name.toLowerCase()
      }));

      const handymen = handymenRes.data.map(item => {
        const serviceNames = (item.services || []).map(s => (s.name || s).toLowerCase()).join(' ');
        return {
          ...item,
          type: 'handyman',
          searchKey: `${item.username.toLowerCase() || ''} ${item.location?.toLowerCase() || ''} ${serviceNames}`
        };
      });

      const combined = [...services, ...handymen];
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

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => {
          if (isHandyman) {
            router.push(`/(auth)/handyman-Profile/${item.id}`);
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
        {item.image || item.thumbnail ? (
          <Image 
            source={{ uri: item.image || item.thumbnail }} 
            style={styles.cardImage} 
            resizeMode="cover" 
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons 
              name={isHandyman ? "person-outline" : "construct-outline"} 
              size={32} 
              color="#9ca3af" 
            />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>
            {isHandyman ? item.username : item.name}
          </Text>
          {isHandyman ? <Text>
            {(item.location && isHandyman) ? item.location : ''}
          </Text> : ''}

          {isHandyman ? <Text style={styles.cardDesc} numberOfLines={1}>
            {(item.average_rating && isHandyman)  ? item.average_rating : ( isHandyman ? 'no ratings yet' : '')}
        { (item.average_rating && isHandyman) ?  < Ionicons  name="star" size={18} color="#daea01" /> : ''}
          </Text> : ''}
          <Text style={styles.cardDesc} numberOfLines={2}>
            {isHandyman ? (item.bio || 'Handyman') : (item.description || '')}
          </Text>
          <Text style={styles.typeBadge}>
            {isHandyman ? 'Handyman' : 'Service'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#202020" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search services or handymen..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
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
            <Ionicons name="search-outline" size={60} color="#d1d5db" />
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 15,
    marginVertical: 20,
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderColor: '#f0f0f0' 
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#202020' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: { flex: 1, fontSize: 16, color: '#202020' },

  card: {
    width: CARD_W,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: { width: '100%', height: 120 },
  cardImagePlaceholder: {
    width: '100%', 
    height: 120, 
    backgroundColor: '#f3f4f6', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  cardBody: { padding: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#202020' },
  cardDesc: { fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 16 },
  typeBadge: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  empty: { 
    alignItems: 'center', 
    marginTop: 100 
  },
  emptyText: { 
    color: '#9ca3af', 
    marginTop: 12, 
    fontSize: 16 
  },
});