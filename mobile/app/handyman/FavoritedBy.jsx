import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Image } from 'react-native';
import handymanApi from '@/services/handymanApi'; 
import Ionicons from '@expo/vector-icons/Ionicons';

export default function FavoritedByScreen() {
  const [data, setData] = useState({ total: 0, favorites: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavoritedBy = async () => {
    try {
      setLoading(true);
      const res = await handymanApi.get('/favorites/favorited-by/');
      setData(res.data);
    } catch (e) {
      console.error('Failed to fetch who favorited you', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavoritedBy();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.avatar} />
      ) : (
        <Ionicons name="person-circle-outline" size={50} color="#6366F1" />
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.user}</Text>
        <Text style={styles.date}>Favorited on: {new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Favorited By ({data.total})</Text>
      <FlatList
        data={data.favorites}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchFavoritedBy} />}
        ListEmptyComponent={<Text style={styles.empty}>No one has favorited you yet.</Text>}
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
  date: { color: '#666', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});
