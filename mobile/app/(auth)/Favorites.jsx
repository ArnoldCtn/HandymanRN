import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl, Animated, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { getFavorites, removeFavorite } from '@/services/favorites';
import Ionicons from '@expo/vector-icons/Ionicons';
import Sidebar from '@/components/Sidebar';
import useGlobal from '@/services/global';
import { useAppTheme } from '@/hooks/use-theme-color';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const router = useRouter();
  const user = useGlobal(state => state.user);
  const theme = useAppTheme();

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

  const avatarUrl = user?.thumbnail
    ? user.thumbnail.startsWith('http')
      ? user.thumbnail
      : user.thumbnail
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
        isHandyman={false}
        onLogout={() => {}}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerLeftBtn}>
            <Ionicons name="arrow-back" size={24} color="#202020" />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>My Favorites</Text>
          <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.headerLeftBtn}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user?.username?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchFavorites} />}
          ListEmptyComponent={<Text style={styles.empty}>No favorites yet</Text>}
          contentContainerStyle={styles.listContent}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeftBtn: { padding: 4, marginRight: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center'
  },
  avatarInitial: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  headerTitleText: { fontSize: 18, fontWeight: '700', color: '#1f2937', flex: 1, textAlign: 'center' },
  listContent: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: 'bold' },
  location: { color: '#666' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});
