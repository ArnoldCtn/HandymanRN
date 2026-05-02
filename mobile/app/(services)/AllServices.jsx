import { useEffect, useState } from 'react'
import {
  View, Dimensions,Text, FlatList, Image, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl, TextInput
} from 'react-native'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import api from '@/services/api'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_W = (SCREEN_WIDTH - 48) / 2   // 2 columns

export default function AllServicesScreen() {
  const router = useRouter()
  const [services,   setServices]   = useState([])
  const [filtered,   setFiltered]   = useState([])
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchServices() {
    try {
      const res = await api.get('/services/')
      setServices(res.data)
      setFiltered(res.data)
    } catch (e) {
      console.log('[AllServices]', e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchServices() }, [])

  // Live search filter
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(services)
    } else {
      setFiltered(
        services.filter(s =>
          s.name.toLowerCase().includes(search.toLowerCase())
        )
      )
    }
  }, [search, services])

  function renderCard({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({
          pathname: '/(services)/ServiceHandymen',
          params: { id: item.id, name: item.name }
        })}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="construct-outline" size={32} color="#9ca3af" />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#202020" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Services</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search services..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={renderCard}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchServices() }}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No services found</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:34, backgroundColor:'#fff', borderBottomWidth:1, borderColor:'#f0f0f0' },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#202020' },

  searchBox: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical:  12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     '#e5e7eb',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#202020' },

  card: {
    width:           CARD_W,
    backgroundColor: '#fff',
    borderRadius:    14,
    marginBottom:    16,
    overflow:        'hidden',
    elevation:       3,
    shadowColor:     '#000',
    shadowOpacity:   0.07,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
  },
  cardImage:           { width: '100%', height: 110 },
  cardImagePlaceholder:{ width: '100%', height: 110, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  cardBody:    { padding: 10 },
  cardName:    { fontSize: 14, fontWeight: '700', color: '#202020' },
  cardDesc:    { fontSize: 11, color: 'gray', marginTop: 3, lineHeight: 16 },

  empty:     { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#9ca3af', marginTop: 12, fontSize: 15 },
})