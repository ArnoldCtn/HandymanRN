import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';
import useGlobal from '@/services/global';
import Sidebar from '@/components/Sidebar';
import { useAppTheme } from '@/hooks/use-theme-color';

export default function ChatsListScreen() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const user = useGlobal(state => state.user);
  const theme = useAppTheme();

  const fetchChats = async () => {
    try {
      console.log('[ChatsList] Fetching chats...');
      const res = await api.get('/chats/my-chats/');
      console.log('[ChatsList] Chats fetched:', res.data?.length || 0);
      setChats(res.data || []);
      
      // Count unread messages
      const unread = res.data?.filter(chat => chat.has_unread_messages).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('[ChatsList] Error fetching chats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const renderChatItem = ({ item }) => {
    const avatarUrl = item.other_thumbnail 
      ? (item.other_thumbnail.startsWith('http') 
         ? item.other_thumbnail 
         : `${api.defaults.baseURL.replace(/^https?:/, 'http:')}/media/${item.other_thumbnail}`)
      : `https://ui-avatars.com/api/?name=${item.other_username}&background=random`;

    return (
      <TouchableOpacity 
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item.booking_id}?source=user`)}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.avatar}
            onError={() => console.log('[ChatsList] Avatar failed to load:', avatarUrl)}
          />
          {item.has_unread_messages && (
            <View style={styles.unreadDot} />
          )}
        </View>
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.name}>{item.other_username || 'Unknown'}</Text>
            <Text style={styles.time}>
              {item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) : ''}
            </Text>
          </View>
          
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message || 'No messages yet'}
          </Text>
        </View>
        
        {item.has_unread_messages && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>•</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#202020" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chats</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerTitleText}>Messages</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
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
          data={chats}
          keyExtractor={(item) => item.booking_id.toString()}
          renderItem={renderChatItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No chats yet</Text>
              <Text style={styles.emptySubText}>Start a conversation from your bookings</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginVertical: 20, 

    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerLeftBtn: { padding: 4, marginRight: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center'
  },
  avatarInitial: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  headerTitleText: { fontSize: 18, fontWeight: '700', color: '#1f2937', flex: 1, textAlign: 'center' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  unreadDot: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 12,
    height: 12,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  time: {
    fontSize: 12,
    color: '#9ca3af',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});
