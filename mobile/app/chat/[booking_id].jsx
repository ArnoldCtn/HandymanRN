// app/chat/[booking_id].jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import handymanApi from '@/services/handymanApi';
import useGlobal from '@/services/global'
import useHandymanGlobal from '@/services/handymanGlobal'


export default function ChatScreen() {
  const { booking_id } = useLocalSearchParams();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  const user    = useGlobal(state => state.user) 
  const handyman    = useHandymanGlobal(state => state.user) 

  const ws = useRef(null);
  const flatListRef = useRef(null);

  // Fetch booking info + message history
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingRes, messagesRes] = await Promise.all([
          handymanApi.get(`/bookings/${booking_id}/`),
          handymanApi.get(`/chats/booking/${booking_id}/messages/`),
        ]);

        setBooking(bookingRes.data);
        setMessages(messagesRes.data);
      } catch (err) {
        Alert.alert("Error", "Failed to load chat");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [booking_id]);

  // Connect to WebSocket
  useEffect(() => {
    if (!booking_id) return;

    const token = "your_jwt_token_here"; // Get from AsyncStorage in real app

    ws.current = new WebSocket(
      `ws://192.168.43.188:8000/ws/chat/booking/${booking_id}/`
    );

    ws.current.onopen = () => {
      console.log("Connected to chat");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data.message]);
      flatListRef.current?.scrollToEnd({ animated: true });
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.current.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [booking_id]);

  const sendMessage = () => {
    if (!newMessage.trim() || !ws.current) return;

    ws.current.send(JSON.stringify({
      message: newMessage.trim()
    }));

    setNewMessage('');
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender_username === user?.username ? user?.username : handyman?.username; // Replace with real check

    return (
      <View style={[
        styles.messageBubble,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
        <Text style={isMyMessage ? styles.myMessageText : styles.theirMessageText}>
          {item.message}
        </Text>
        <Text style={styles.time}>
          {item.created_at}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {booking?.handyman?.username || booking?.user?.username}
          </Text>
          <Text style={styles.headerSubtitle}>Booking #{booking_id}</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={newMessage.trim() ? "#6366F1" : "#9ca3af"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerInfo: { marginLeft: 12 },
  headerName: { fontSize: 18, fontWeight: '600' },
  headerSubtitle: { fontSize: 13, color: '#64748b' },

  messagesList: { padding: 16, paddingBottom: 80 },

  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginVertical: 4,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
    borderBottomLeftRadius: 4,
  },
  myMessageText: { color: 'white' },
  theirMessageText: { color: '#1f2937' },
  time: { fontSize: 10, marginTop: 4, opacity: 0.7, alignSelf: 'flex-end' },

  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});