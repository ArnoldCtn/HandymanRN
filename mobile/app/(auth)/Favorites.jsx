import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { getFavorites, removeFavorite } from '@/services/favorites';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await getFavorites();
      setFavorites(res.data);
    } catch (e) {
      console.error('Failed to fetch favorites', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemove = async (handymanId) => {
    try {
      await removeFavorite(handymanId);
      fetchFavorites();
    } catch (e) {
      console.error('Failed to remove favorite', e);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(auth)/handyman-Profile/${item.handyman.id}`)}
    >
      <Image source={{ uri: item.handyman.thumbnail }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.handyman.username}</Text>
        <Text style={styles.location}>{item.handyman.location}</Text>
      </View>
      <TouchableOpacity onPress={() => handleRemove(item.handyman.id)}>
        <Ionicons name="heart" size={24} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Favorites</Text>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchFavorites} />}
        ListEmptyComponent={<Text style={styles.empty}>No favorites yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1f2937' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: 'bold' },
  location: { color: '#666' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});
