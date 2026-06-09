// app/chat/support.jsx — Support chat with Admin
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import handymanApi from '@/services/handymanApi';
import { useToast } from '@/hooks/useToast';
import favicon from '@/assets/images/FullLogo.jpg'


export default function SupportChatScreen() {
  const { source } = useLocalSearchParams();
  const router = useRouter();
  const showToast = useToast();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [roleIsHandyman, setRoleIsHandyman] = useState(source === 'handyman');

  const ws = useRef(null);
  const flatListRef = useRef(null);

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
        setMessages((prev) => [...prev, data.message]);
      };

      ws.current.onerror = (e) => console.log('[SupportChat WS] Error:', e.message);
      ws.current.onclose = (e) => console.log('[SupportChat WS] Closed:', e.reason);

    } catch (err) {
      console.error('[SupportChat WS] setup error:', err);
    }
  };

  const sendMessage = () => {
    const text = newMessage.trim();
    if (!text || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      if (ws.current && ws.current.readyState !== WebSocket.OPEN) {
        showToast('Connection lost. Reconnecting...', 'error');
        connectWebSocket(roomName, roleIsHandyman);
      }
      return;
    }

    ws.current.send(JSON.stringify({ message: text }));
    setNewMessage('');
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = !item.is_from_admin;
    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>
          {item.message}
        </Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Image 
          source={ favicon } 
          style={styles.headerAvatar} 
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Support Admin</Text>
          <Text style={styles.headerSubtitle}>Online</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Describe your issue..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={!newMessage.trim()}>
            <Ionicons name="send" size={24} color={newMessage.trim() ? '#6366F1' : '#9ca3af'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerInfo: { marginLeft: 12 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  headerSubtitle: { fontSize: 12, color: '#10B981' },
  messagesList: { padding: 16, paddingBottom: 20 },
  messageBubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginVertical: 4 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#6366F1', borderBottomRightRadius: 2 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#e5e7eb', borderBottomLeftRadius: 2 },
  myMessageText: { color: 'white', fontSize: 15 },
  theirMessageText: { color: '#1f2937', fontSize: 15 },
  time: { fontSize: 10, marginTop: 4, opacity: 0.7, alignSelf: 'flex-end' },
  inputContainer: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingBottom: Platform.OS === 'ios' ? 0 : 5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8 },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 100, color: '#1f2937' },
  sendButton: { padding: 8 },
});
