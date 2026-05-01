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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import handymanApi from '@/services/handymanApi';

export default function ServiceHandymenScreen() {
  const router = useRouter();
  const { id, name, description } = useLocalSearchParams();

  const [handymen, setHandymen] = useState([]);        // Fixed: removed <any[]>
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchHandymen() {
  if (!id) {
    console.log("No service ID received");
    setLoading(false);
    return;
  }

  console.log(`Fetching handymen for service ID: ${id}`);

  try {
    setLoading(true);
const res = await handymanApi.get(`/handymen/services/${id}/handymen/`);
    
    console.log("API Response:", res.data);   // ← Important for debugging
    setHandymen(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.log("Full Error:", error?.response?.data || error.message);
    Alert.alert('Error', 'Failed to load handymen');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}

  useEffect(() => {
    fetchHandymen();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHandymen();
  };

  function resolveAvatar(thumbnail) {
    if (!thumbnail) return null;
    if (thumbnail.startsWith('http')) return thumbnail;
    return `http://192.168.1.XXX:8000/media/${thumbnail}`; // ← Update your IP
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
      onPress={() => router.push(`/(auth)/handyman-Profile/${item.id}`)}   // ← Best way
    >
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {item.username?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{item.username}</Text>
          <Text style={styles.cardEmail}>{item.email}</Text>
          {item.phone && <Text style={styles.cardPhone}>{item.phone}</Text>}

          <Text style={[styles.handyStatus, { color: item.is_online ? '#22c55e' : '#9ca3af' }]}>
            {item.is_online ? '● Active now' : `○ ${item.last_seen || 'Offline'}`}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={24} color="#6366F1" />
      </TouchableOpacity>
    );
  }

  if (loading && handymen.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#202020" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}</Text>
      </View>

      {description && <Text style={styles.headerDescription}>{description}</Text>}

      <FlatList
        data={handymen}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderHandyman}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <Text style={styles.listHeader}>
            {handymen.length} Handyman{handymen.length !== 1 ? 's' : ''} Available
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#d1d5db" />
            <Text style={styles.emptyText}>No handymen available for this service yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop:8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerDescription: {
    padding: 16,
    fontSize: 15,
    color: '#64748b',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },

  listContent: { padding: 16 },
  listHeader: { fontSize: 16, color: '#64748b', marginBottom: 12, fontWeight: '600' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  avatar: { width: 58, height: 58, borderRadius: 29, marginRight: 14 },
  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: { color: 'white', fontSize: 24, fontWeight: 'bold' },

  cardBody: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '700', color: '#1e2937' },
  cardEmail: { fontSize: 14, color: '#64748b', marginTop: 2 },
  cardPhone: { fontSize: 13, color: '#94a3b8', marginTop: 2 },

  handyStatus: { fontSize: 13, marginTop: 4, fontWeight: '500' },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#9ca3af', marginTop: 16, fontSize: 16 },
});