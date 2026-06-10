// app/chat/[booking_id].jsx — SHARED chat for both user and handyman
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView, Alert, ActivityIndicator, Image, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function ChatScreen() {
  const { booking_id, source } = useLocalSearchParams();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [myUsername, setMyUsername] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Explicit role from navigation — never guess from tokens
  const isHandyman = source === 'handyman';
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
  
  const ws = useRef(null);
  const flatListRef = useRef(null);

  // Fetch booking + messages using explicit role
  useEffect(() => {
    if (!booking_id) return;

    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem(isHandyman ? 'handyman_access_token' : 'access_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [bookingRes, messagesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/bookings/${booking_id}/`, { headers }),
          fetch(`${API_BASE_URL}/chats/booking/${booking_id}/messages/`, { headers }),
        ]);

        const bookingData = await bookingRes.json();
        const messagesData = await messagesRes.json();

        setBooking(bookingData);
        setMessages(messagesData || []);

        // Mark messages as read
        fetch(`${API_BASE_URL}/chats/booking/${booking_id}/mark-read/`, { 
            method: 'POST', 
            headers: { ...headers, 'Content-Type': 'application/json' } 
        }).catch(e => console.log('[Chat] Mark-read failed'));

        if (isHandyman) {
          setMyUsername(bookingData?.handyman?.username || 'Handyman');
        } else {
          setMyUsername(bookingData?.user?.username || 'User');
        }
      } catch (err) {
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
        if (!token) {
          Alert.alert('Error', 'Authentication token missing');
          return;
        }

        const wsUrl = `ws://192.168.43.188:8000/ws/chat/booking/${booking_id}/?token=${token}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          // Only add if not already in state to prevent duplicates
          setMessages((prev) => {
            if (prev.some(m => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        };
      } catch (err) {
        console.error('[Chat WS] Failed to connect:', err);
      }
    };

    connectWebSocket();
    return () => { if (ws.current) ws.current.close(); };
  }, [booking_id]);

  const sendMessage = (text, image_url = null) => {
    if ((!text.trim() && !image_url) || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(JSON.stringify({ message: text, image_url: image_url }));
    setNewMessage('');
  };

  const uploadAndSendMessage = async (uri, filename, type) => {
    const formData = new FormData();
    formData.append('image', { uri, name: filename, type });
    formData.append('booking_id', booking_id);
    formData.append('is_support', 'false');

    try {
      const token = await AsyncStorage.getItem(isHandyman ? 'handyman_access_token' : 'access_token');
      const uploadUrl = `${API_BASE_URL}/chats/upload-image/`;
      
      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.detail || 'Upload failed');
      
      sendMessage('', resData.image_url);
    } catch (e) {
      console.error('[Chat] Upload failed:', e);
      Alert.alert('Error', 'Failed to upload image: ' + e.message);
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

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollButton(false);
  };

  const renderMessage = ({ item }) => {
    // Prevent rendering empty bubbles
    if (!item.message && !item.image_url) return null;
    
    // Simple time formatter
    const formatTime = (timeString) => {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) return timeString; // Return original if parsing fails
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isMyMessage = item.sender_username === myUsername;
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
        <Text style={styles.time}>{formatTime(item.created_at)}</Text>
      </View>
    );
  };

  const otherPersonName = isHandyman ? booking?.user?.username : booking?.handyman?.username;
  const avatarUrl = (isHandyman ? booking?.user?.thumbnail : booking?.handyman?.thumbnail) || `https://ui-avatars.com/api/?name=${otherPersonName}&background=random`;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={28} color="#1F2937" /></TouchableOpacity>
        <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}><Text style={styles.headerName}>{otherPersonName || '...'}</Text></View>
      </View>

      <FlatList 
        ref={flatListRef} 
        data={messages} 
        keyExtractor={(item, index) => item.id?.toString() || index.toString()} 
        renderItem={renderMessage} 
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
        onScroll={({nativeEvent}) => {
            const isAtBottom = nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height >= nativeEvent.contentSize.height - 100;
            setShowScrollButton(!isAtBottom);
        }}
        scrollEventThrottle={400}
      />

      {showScrollButton && (
          <TouchableOpacity style={styles.scrollButton} onPress={scrollToBottom}>
              <Ionicons name="chevron-down" size={24} color="white" />
          </TouchableOpacity>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity onPress={handleImagePicker} style={styles.iconButton}><Ionicons name="image" size={24} color="#6366F1" /></TouchableOpacity>
          <TextInput style={styles.input} placeholder="Type a message..." value={newMessage} onChangeText={setNewMessage} multiline />
          <TouchableOpacity style={styles.sendButton} onPress={() => sendMessage(newMessage)} disabled={!newMessage.trim()}><Ionicons name="send" size={24} color={newMessage.trim() ? '#6366F1' : '#9ca3af'} /></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!fullScreenImage} transparent={true} onRequestClose={() => setFullScreenImage(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setFullScreenImage(null)}><Ionicons name="close" size={32} color="white" /></TouchableOpacity>
          <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImage} resizeMode="contain" />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginTop: Platform.OS === 'android' ? 25 : 0 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerInfo: { marginLeft: 12 },
  headerName: { fontSize: 18, fontWeight: '600' },
  messagesList: { padding: 16, paddingBottom: 80 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 18, marginVertical: 4 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#6366F1', borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#e5e7eb', borderBottomLeftRadius: 4 },
  myMessageText: { color: 'white' },
  theirMessageText: { color: '#1f2937' },
  messageImage: { width: 200, height: 200, borderRadius: 10, marginBottom: 5 },
  time: { fontSize: 10, marginTop: 4, opacity: 0.7, alignSelf: 'flex-end' },
  inputContainer: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100 },
  sendButton: { padding: 8 },
  iconButton: { padding: 8 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
  fullScreenImage: { width: '100%', height: '80%' },
  scrollButton: { position: 'absolute', bottom: 100, right: 20, backgroundColor: '#6366F1', borderRadius: 20, padding: 8, elevation: 5 },
});