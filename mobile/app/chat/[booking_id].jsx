// app/chat/[booking_id].jsx — SHARED chat for both user and handyman
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import handymanApi from '@/services/handymanApi';

export default function ChatScreen() {
  const { booking_id, source } = useLocalSearchParams();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [myUsername, setMyUsername] = useState('');

  // Explicit role from navigation — never guess from tokens
  const isHandyman = source === 'handyman';
  console.log('[Chat] source param:', source, '=> isHandyman:', isHandyman);

  const ws = useRef(null);
  const flatListRef = useRef(null);

  // Fetch booking + messages using explicit role
  useEffect(() => {
    if (!booking_id) return;

    const fetchData = async () => {
      console.log('[Chat] fetchData start, booking_id:', booking_id, 'role:', isHandyman ? 'HANDYMAN' : 'USER');
      try {
        const client = isHandyman ? handymanApi : api;
        console.log('[Chat] Using client:', isHandyman ? 'HANDYMAN' : 'USER');

        const [bookingRes, messagesRes] = await Promise.all([
          client.get(`/bookings/${booking_id}/`),
          client.get(`/chats/booking/${booking_id}/messages/`),
        ]);

        console.log('[Chat] Booking fetched:', JSON.stringify(bookingRes.data, null, 2));
        console.log('[Chat] Messages fetched count:', messagesRes.data?.length);
        setBooking(bookingRes.data);
        setMessages(messagesRes.data || []);

        // Set my username for bubble coloring based on explicit source
        if (isHandyman) {
          setMyUsername(bookingRes.data?.handyman?.username || 'Handyman');
        } else {
          setMyUsername(bookingRes.data?.user?.username || 'User');
        }
      } catch (err) {
        console.error('[Chat] fetchData ERROR:', err.response?.status, err.response?.data || err.message);
        Alert.alert('Error', 'Failed to load chat');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [booking_id]);

  // Connect WebSocket using explicit role's token
  useEffect(() => {
    if (!booking_id) return;

    const connectWebSocket = async () => {
      try {
        const token = await AsyncStorage.getItem(isHandyman ? 'handyman_access_token' : 'access_token');
        console.log('[Chat WS] Connecting with', isHandyman ? 'HANDYMAN' : 'USER', 'token');

        if (!token) {
          console.error('[Chat WS] No token found!');
          Alert.alert('Error', 'Authentication token missing');
          return;
        }

        const wsUrl = `ws://192.168.43.188:8000/ws/chat/booking/${booking_id}/?token=${token}`;
        console.log('[Chat WS] URL:', wsUrl.substring(0, 60) + '...');
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          console.log('[Chat WS] Connected to chat');
        };

        ws.current.onmessage = (event) => {
          console.log('[Chat WS] Message received:', event.data);
          const data = JSON.parse(event.data);
          setMessages((prev) => [...prev, data.message]);
          flatListRef.current?.scrollToEnd({ animated: true });
        };

        ws.current.onerror = (error) => {
          console.error('[Chat WS] Error:', error.message || error);
        };

        ws.current.onclose = (e) => {
          console.log('[Chat WS] Closed, code:', e.code, 'reason:', e.reason);
        };
      } catch (err) {
        console.error('[Chat WS] Failed to connect:', err);
      }
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        console.log('[Chat WS] Cleaning up WebSocket');
        ws.current.close();
      }
    };
  }, [booking_id]);

  const sendMessage = () => {
    const text = newMessage.trim();
    if (!text || !ws.current) {
      console.log('[Chat] Send blocked: empty or no ws');
      return;
    }
    if (ws.current.readyState !== WebSocket.OPEN) {
      console.log('[Chat] Send blocked: WS not open, state:', ws.current.readyState);
      Alert.alert('Error', 'Chat not connected yet. Please wait.');
      return;
    }

    console.log('[Chat] Sending message:', text);
    ws.current.send(JSON.stringify({ message: text }));
    setNewMessage('');
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_username === myUsername;
    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>
          {item.message}
        </Text>
        <Text style={styles.time}>{item.created_at}</Text>
      </View>
    );
  };

  // Determine OTHER person's info for header
  const otherPersonName = isHandyman
    ? booking?.user?.username
    : booking?.handyman?.username;
  const otherPersonThumbnail = isHandyman
    ? booking?.user?.thumbnail
    : booking?.handyman?.thumbnail;
  const avatarUrl = otherPersonThumbnail || `https://ui-avatars.com/api/?name=${otherPersonName}&background=random`;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header shows OTHER person */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{otherPersonName || '...'}</Text>
          <Text style={styles.headerSubtitle}>Booking #{booking_id}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
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
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerInfo: { marginLeft: 12 },
  headerName: { fontSize: 18, fontWeight: '600' },
  headerSubtitle: { fontSize: 13, color: '#64748b' },
  messagesList: { padding: 16, paddingBottom: 80 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 18, marginVertical: 4 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#6366F1', borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#e5e7eb', borderBottomLeftRadius: 4 },
  myMessageText: { color: 'white' },
  theirMessageText: { color: '#1f2937' },
  time: { fontSize: 10, marginTop: 4, opacity: 0.7, alignSelf: 'flex-end' },
  inputContainer: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100 },
  sendButton: { padding: 8 },
});