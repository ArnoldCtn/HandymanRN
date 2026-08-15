// app/chat/support.jsx — Support chat with Admin
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Image, Modal, Alert, Keyboard
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '@/services/api';
import handymanApi from '@/services/handymanApi';
import { getValidAccessToken, isWsAuthFailure } from '@/services/wsAuth';
import { useToast } from '@/hooks/useToast';
import favicon from '@/assets/images/FullLogo.jpg'
import Sidebar from '@/components/Sidebar';
import useGlobal from '@/services/global';
import { useAppTheme } from '@/hooks/use-theme-color';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function SupportChatScreen() {
  const { source } = useLocalSearchParams();
  const router = useRouter();
  const showToast = useToast();
  const insets = useSafeAreaInsets();
  const [typingUser, setTypingUser] = useState('');
  const typingTimeout = useRef(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [roleIsHandyman, setRoleIsHandyman] = useState(source === 'handyman');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const ws = useRef(null);
  const flatListRef = useRef(null);
  const user = useGlobal(state => state.user);
  const theme = useAppTheme();
  const mountedRef = useRef(true);
  const wsRetries = useRef(0);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const initChat = async () => {
      try {
        // Double check role if source is ambiguous
        let isH = source === 'handyman';
        if (!isH) {
          const hToken = await AsyncStorage.getItem('handyman_access_token');
          if (hToken) isH = true;
        }
        setRoleIsHandyman(isH);

        const client = isH ? handymanApi : api;
        
        // 1. Init conversation
        const initRes = await client.post('/chats/support/init/');
        const { conversation_id, room_name } = initRes.data;
        setConversationId(conversation_id);
        setRoomName(room_name);

        // 2. Fetch history
        const historyRes = await client.get(`/chats/support/history/${conversation_id}/`);
        setMessages(historyRes.data || []);
        
        // 3. Connect WebSocket
        connectWebSocket(room_name, isH);
      } catch (err) {
        console.error('[SupportChat] init error:', err.message);
        showToast('Failed to connect to support. Please sign in again.', 'error');
        // Don't router.back() immediately so they can see the error toast
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      mountedRef.current = false;
      if (ws.current) ws.current.close();
    };
  }, [source]);

  const connectWebSocket = async (room, isH) => {
    try {
      const token = await getValidAccessToken(isH);
      if (!token) {
        console.log('[SupportChat WS] No valid token found');
        return;
      }

      // Use the baseURL from the client to avoid hardcoded IPs
      const client = isH ? handymanApi : api;
      const baseUrl = client.defaults.baseURL; // e.g. "http://192.168.x.x:8000"
      
      if (!baseUrl) {
        console.error('[SupportChat WS] BaseURL not found');
        return;
      }

      const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
      const wsHost = baseUrl.replace(/^https?:\/\//, '').split('/')[0];
      const wsUrl = `${wsProtocol}://${wsHost}/ws/support/${room}/?token=${token}`;
      
      console.log('[SupportChat WS] Connecting to:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[SupportChat WS] Connected');
        wsRetries.current = 0;
      };
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'typing') {
          setTypingUser(data.username);
          if (typingTimeout.current) clearTimeout(typingTimeout.current);
          typingTimeout.current = setTimeout(() => setTypingUser(''), 3000);
          return;
        }
        setMessages((prev) => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      };

      ws.current.onerror = (e) => console.log('[SupportChat WS] Error:', e.message);
      ws.current.onclose = (e) => {
        console.log('[SupportChat WS] Closed:', e.reason);
        if (!mountedRef.current) return;
        if (isWsAuthFailure(e) && wsRetries.current < 2) {
          wsRetries.current += 1;
          setTimeout(() => {
            if (mountedRef.current) connectWebSocket(room, isH);
          }, wsRetries.current * 2000);
        }
      };

    } catch (err) {
      console.error('[SupportChat WS] setup error:', err);
    }
  };

  const sendMessage = (text = null, image_url = null) => {
    const msgText = (text || '').trim();
    if (!msgText && !image_url) return;

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
        showToast('Connection lost. Reconnecting...', 'error');
        connectWebSocket(roomName, roleIsHandyman);
      }
      return;
    }

    ws.current.send(JSON.stringify({ message: msgText, image_url: image_url }));
    setNewMessage('');
  };

  const uploadAndSendMessage = async (uri, filename, type) => {
    const formData = new FormData();
    formData.append('image', { uri, name: filename, type });
    formData.append('booking_id', '');
    formData.append('is_support', 'true');

    try {
      const token = await getValidAccessToken(roleIsHandyman);
      const client = roleIsHandyman ? handymanApi : api;
      const baseUrl = client.defaults.baseURL;
      const uploadUrl = `${baseUrl}/chats/upload-image/`;
      
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.detail || 'Upload failed');
      
      sendMessage('', resData.image_url);
    } catch (e) {
      console.error('[SupportChat] Upload failed:', e);
      showToast('Failed to upload image: ' + e.message, 'error');
    }
  };

  const handleImagePicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      
      Alert.alert(
        "Confirm Send",
        "Are you sure you want to send this image?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Send", onPress: () => uploadAndSendMessage(uri, filename, type) }
        ]
      );
    }
  };

  const handleTyping = useCallback((text) => {
    setNewMessage(text);
    if (ws.current && ws.current.readyState === WebSocket.OPEN && text.trim()) {
      ws.current.send(JSON.stringify({ type: 'typing', typing: true }));
    }
  }, []);

  const renderMessage = ({ item }) => {
    if (!item.message && !item.image_url) return null;
    const isMyMessage = !item.is_from_admin;
    return (
      <View style={[styles.bubbleRow, isMyMessage ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
          {item.image_url ? (
            <TouchableOpacity onPress={() => setFullScreenImage(item.image_url)} activeOpacity={0.9}>
              <Image source={{ uri: item.image_url }} style={styles.messageImage} />
            </TouchableOpacity>
          ) : null}
          {item.message ? (
            <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>
              {item.message}
            </Text>
          ) : null}
          <Text style={[styles.time, { color: isMyMessage ? 'rgba(255,255,255,0.75)' : '#94A3B8' }]}>
            {item.created_at}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loaderText}>Connecting to Support…</Text>
      </View>
    );
  }

  const avatarUrl = user?.thumbnail
    ? user.thumbnail.startsWith('http')
      ? user.thumbnail
      : user.thumbnail
    : null;

  const inputBarBaseHeight = 60;
  const inputHeight = inputBarBaseHeight + Math.max(insets.bottom, 12);

return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        user={user}
        isHandyman={roleIsHandyman}
        onLogout={() => {}}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0 }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
              <Ionicons name="arrow-back" size={22} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.headerAvatarWrap}>
              <Image
                source={favicon}
                style={styles.headerAvatar}
              />
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName} numberOfLines={1}>Support Admin</Text>
              <Text style={styles.headerSubtitle}>
                {typingUser ? 'typing…' : 'Online'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.headerRightBtn}>
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
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            renderItem={renderMessage}
            contentContainerStyle={[styles.messagesList, { paddingBottom: inputHeight + 16 }]}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            style={{ flex: 1 }}
          />

          <View style={styles.inputContainer}>
            {typingUser ? (
              <View style={styles.typingBar}>
                <View style={styles.typingDots}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
                <Text style={styles.typingText}>Support is typing…</Text>
              </View>
            ) : null}
            <View style={styles.inputWrapper}>
              <TouchableOpacity onPress={handleImagePicker} style={styles.iconButton}>
                <Ionicons name="image-outline" size={22} color="#6366F1" />
              </TouchableOpacity>
              <View style={styles.textInputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Describe your issue..."
                  value={newMessage}
                  onChangeText={handleTyping}
                  multiline={false}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <TouchableOpacity
                style={[styles.sendButton, newMessage.trim() && styles.sendButtonActive]}
                onPress={() => sendMessage(newMessage)}
                disabled={!newMessage.trim()}
              >
                <Ionicons name="send" size={18} color={newMessage.trim() ? 'white' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>
            <View style={{ height: Math.max(insets.bottom, 12) }} />
          </View>
        </View>
      </SafeAreaView>

      <Modal visible={!!fullScreenImage} transparent={true} onRequestClose={() => setFullScreenImage(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setFullScreenImage(null)}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
}

const COLORS = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E5E7EB',
  primary: '#6366F1',
  primaryLight: '#EEF2FF',
  textPrimary: '#111827',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  bubbleTheirs: '#EEF1F6',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  loaderText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10,
    backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    ...Platform.select({ android: { paddingTop: 34 } })
  },
  headerBackBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9',
  },
  headerAvatarWrap: { marginLeft: 10, position: 'relative' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22C55E', borderWidth: 2, borderColor: COLORS.card,
  },
  headerInfo: { marginLeft: 10, flex: 1, minWidth: 0 },
  headerName: { fontSize: 16.5, fontWeight: '700', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 12.5, color: '#10B981', fontWeight: '600', marginTop: 1 },
  headerRightBtn: { padding: 2, marginLeft: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center'
  },
  avatarInitial: { color: 'white', fontSize: 15, fontWeight: '700' },

  messagesList: { padding: 14, paddingTop: 16 },

  bubbleRow: { width: '100%', flexDirection: 'row', marginVertical: 3 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },

  messageBubble: {
    maxWidth: '82%', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 18,
    shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  myMessage: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  theirMessage: { backgroundColor: COLORS.bubbleTheirs, borderBottomLeftRadius: 4 },
  myMessageText: { color: 'white', fontSize: 15, lineHeight: 20 },
  theirMessageText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 20 },
  messageImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 5 },
  time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },

  // ---- Input container: docked at bottom, stable height whether the
  // typing indicator is showing or not, so the bar never shifts oddly. ----
  inputContainer: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 6,
  },
  typingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingTop: 8,
  },
  typingDots: { flexDirection: 'row', gap: 3 },
  typingDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.primary, opacity: 0.6 },
  typingText: { fontSize: 12, color: COLORS.primary, fontStyle: 'italic', fontWeight: '500' },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8, gap: 8, minHeight: 60,
  },
  iconButton: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryLight,
  },
  textInputWrap: {
    flex: 1, backgroundColor: '#F1F5F9', borderRadius: 22,
    borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center',
  },
  input: {
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 42, maxHeight: 100, color: COLORS.textPrimary, fontSize: 15,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF1F6',
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 8 },
  fullScreenImage: { width: '100%', height: '80%' },
});