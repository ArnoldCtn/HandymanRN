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
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        style={[
          styles.chatItem, 
          item.has_unread_messages && styles.unreadChatItem
        ]}
        activeOpacity={0.7}
        onPress={() => router.push(`/chat/${item.booking_id}?source=user`)}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.chatAvatar}
            onError={() => console.log('[ChatsList] Avatar failed to load:', avatarUrl)}
          />
          {item.has_unread_messages && (
            <View style={styles.unreadDot} />
          )}
        </View>
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.name, item.has_unread_messages && styles.unreadText]} numberOfLines={1}>
              {item.other_username || 'Unknown'}
            </Text>
            <Text style={[styles.time, item.has_unread_messages && styles.unreadTime]}>
              {item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }) : ''}
            </Text>
          </View>
          
          <View style={styles.messageRow}>
            <Text 
              style={[styles.lastMessage, item.has_unread_messages && styles.unreadLastMessage]} 
              numberOfLines={1}
            >
              {item.last_message || 'No messages yet'}
            </Text>
            
            {item.has_unread_messages && (
              <View style={styles.unreadBadge}>
                <View style={styles.unreadBadgeInner} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const userAvatarUrl = user?.thumbnail
    ? user.thumbnail.startsWith('http')
      ? user.thumbnail
      : user.thumbnail
    : null;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background || '#f8fafc' }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background || '#f8fafc'} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.6}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Messages</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0277BD" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background || '#f8fafc' }}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background || '#f8fafc'} />
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
        isHandyman={false}
        onLogout={() => {}}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Main Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.6}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText}>Messages</Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.profileBtn} activeOpacity={0.7}>
            {userAvatarUrl ? (
              <Image source={{ uri: userAvatarUrl }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user?.username?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Chat List */}
        <FlatList
          data={chats}
          keyExtractor={(item) => item.booking_id.toString()}
          renderItem={renderChatItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#0277BD"
              colors={['#0277BD']}
            />
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbubbles-outline" size={48} color="#94a3b8" />
              </View>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubText}>
                When you initiate conversations from your bookings, they will appear here.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'center',
    gap: 8,
  },
  headerTitleText: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    justify: 'center',
    alignItems: 'center',
  },
  headerBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  iconBtn: { 
    padding: 8, 
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  profileBtn: {
    padding: 2,
  },
  headerAvatar: { 
    width: 38, 
    height: 38, 
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  avatarPlaceholder: {
    width: 38, 
    height: 38, 
    borderRadius: 19,
    backgroundColor: '#0277BD', 
    alignItems: 'center', 
    justify: 'center',
  },
  avatarInitial: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  loadingContainer: {
    flex: 1,
    justify: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  unreadChatItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  chatAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f1f5f9',
  },
  unreadDot: {
    position: 'absolute',
    right: 0,
    top: 2,
    width: 14,
    height: 14,
    backgroundColor: '#ef4444',
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  time: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  unreadTime: {
    color: '#0277BD',
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
    marginRight: 8,
  },
  unreadLastMessage: {
    color: '#1e293b',
    fontWeight: '600',
  },
  unreadBadge: {
    justify: 'center',
    alignItems: 'center',
  },
  unreadBadgeInner: {
    width: 8,
    height: 8,
    backgroundColor: '#0277BD',
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justify: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justify: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
});