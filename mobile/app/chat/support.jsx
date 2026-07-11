// app/chat/support.jsx — Support chat with Admin
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Image, Modal, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import api from '@/services/api';
import handymanApi from '@/services/handymanApi';
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

  useEffect(() => {
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
      if (ws.current) ws.current.close();
    };
  }, [source]);

  const connectWebSocket = async (room, isH) => {
    try {
      const token = await AsyncStorage.getItem(isH ? 'handyman_access_token' : 'access_token');
      if (!token) {
        console.log('[SupportChat WS] No token found');
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

      ws.current.onopen = () => console.log('[SupportChat WS] Connected');
      
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
      ws.current.onclose = (e) => console.log('[SupportChat WS] Closed:', e.reason);

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
      const token = await AsyncStorage.getItem(roleIsHandyman ? 'handyman_access_token' : 'access_token');
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
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        {item.image_url ? (
          <TouchableOpacity onPress={() => setFullScreenImage(item.image_url)}>
            <Image source={{ uri: item.image_url }} style={styles.messageImage} />
          </TouchableOpacity>
        ) : null}
        {item.message ? (
          <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>
            {item.message}
          </Text>
        ) : null}
        <Text style={styles.time}>{item.created_at}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={{ marginTop: 10, color: '#666' }}>Connecting to Support...</Text>
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
        isHandyman={roleIsHandyman}
        onLogout={() => {}}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerLeftBtn}>
              <Ionicons name="arrow-back" size={24} color="#202020" />
            </TouchableOpacity>
            <Image 
              source={ favicon } 
              style={styles.headerAvatar} 
            />
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>Support Admin</Text>
              <Text style={styles.headerSubtitle}>Online</Text>
            </View>
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
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.inputWrapper}>
              <TouchableOpacity onPress={handleImagePicker} style={styles.iconButton}>
                <Ionicons name="image" size={24} color="#6366F1" />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Describe your issue..."
                value={newMessage}
                onChangeText={handleTyping}
                multiline
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity style={styles.sendButton} onPress={() => sendMessage(newMessage)} disabled={!newMessage.trim()}>
                <Ionicons name="send" size={24} color={newMessage.trim() ? '#6366F1' : '#9ca3af'} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={!!fullScreenImage} transparent={true} onRequestClose={() => setFullScreenImage(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setFullScreenImage(null)}>
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>
          <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    ...Platform.select({ android: { paddingTop: 40 } })
  },
  backBtn: { padding: 8, marginRight: 4 },
  headerLeftBtn: { padding: 4, marginRight: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center'
  },
  avatarInitial: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerInfo: { marginLeft: 12, flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  headerSubtitle: { fontSize: 12, color: '#10B981' },
  messagesList: { padding: 16, paddingBottom: 20 },
  messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginVertical: 4 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#6366F1', borderBottomRightRadius: 2 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#e5e7eb', borderBottomLeftRadius: 2 },
  myMessageText: { color: 'white', fontSize: 15 },
  theirMessageText: { color: '#1f2937', fontSize: 15 },
  messageImage: { width: 200, height: 200, borderRadius: 10, marginBottom: 5 },
  time: { fontSize: 10, marginTop: 4, opacity: 0.7, alignSelf: 'flex-end' },
  inputContainer: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingBottom: Platform.OS === 'ios' ? 0 : 5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8 },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100, color: '#1f2937' },
  sendButton: { padding: 8 },
  iconButton: { padding: 8 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
  fullScreenImage: { width: '100%', height: '80%' },
});
