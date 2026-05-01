import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  FlatList, Dimensions
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH  = SCREEN_WIDTH * 0.44   // ~44% of screen
const CARD_HEIGHT = 230
const MAX_PREVIEW = 8

export default function ServiceCarousel({ services }) {
  const router = useRouter()

  const preview    = services.slice(0, MAX_PREVIEW)
  const hasMore    = services.length > MAX_PREVIEW

  function onServicePress(item) {
    router.push({
      pathname: '/(services)/ServiceHandymen',
      params: { id: item.id, name: item.name,description: item.description }
    })
  }

  function renderCard({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => onServicePress(item)}
      >
        {/* Image — top 60% of card */}
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="construct-outline" size={36} color="#9ca3af" />
          </View>
        )}

        {/* Info — bottom 40% */}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  // "See All" card — appended after preview list
  function SeeAllCard() {
    return (
      <TouchableOpacity
        style={[styles.card, styles.seeAllCard]}
        activeOpacity={0.8}
        onPress={() => router.push('/(services)/AllServices')}
      >
        <View style={styles.seeAllInner}>
          <View style={styles.seeAllCircle}>
            <Ionicons name="grid-outline" size={28} color="#6366F1" />
          </View>
          <Text style={styles.seeAllText}>See All</Text>
          <Text style={styles.seeAllCount}>{services.length} services</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const dataWithSeeAll = hasMore
    ? [...preview, { id: 'see_all', __seeAll: true }]
    : preview

  return (
    <View>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        {hasMore && (
          <TouchableOpacity onPress={() => router.push('/(services)/AllServices')}>
            <Text style={styles.seeAllLink}>See all →</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={dataWithSeeAll}
        keyExtractor={item => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        snapToInterval={CARD_WIDTH + 12}   // snaps card by card
        decelerationRate="fast"
        renderItem={({ item }) =>
          item.__seeAll ? <SeeAllCard /> : renderCard({ item })
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: 16,
    marginBottom:   12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#202020' },
  seeAllLink:   { fontSize: 14, color: '#6366F1', fontWeight: '600' },

  list: { paddingHorizontal: 16, paddingBottom: 8 },

  card: {
    width:           CARD_WIDTH,
    height:          CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius:    16,
    marginRight:     12,
    overflow:        'hidden',
    elevation:       4,
    shadowColor:     '#000',
    shadowOpacity:   0.08,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 3 },
  },
  cardImage: {
    width:  '100%',
    height: CARD_HEIGHT * 0.6,   // top 60%
  },
  cardImagePlaceholder: {
    width:           '100%',
    height:          CARD_HEIGHT * 0.6,
    backgroundColor: '#f3f4f6',
    alignItems:      'center',
    justifyContent:  'center',
  },
  cardBody: {
    flex:    1,
    padding: 10,
    justifyContent: 'center',
  },
  cardName: { fontSize: 14, fontWeight: '700', color: '#202020' },
  cardDesc: { fontSize: 11, color: 'gray', marginTop: 3, lineHeight: 16 },

  // See All card
  seeAllCard: {
    backgroundColor: '#f0f0ff',
    borderWidth:     1.5,
    borderColor:     '#c7d2fe',
    borderStyle:     'dashed',
  },
  seeAllInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  seeAllCircle: {
    width:           60,
    height:          60,
    borderRadius:    30,
    backgroundColor: '#e0e7ff',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    10,
  },
  seeAllText:  { fontSize: 16, fontWeight: '700', color: '#6366F1' },
  seeAllCount: { fontSize: 12, color: '#818cf8', marginTop: 4 },
})