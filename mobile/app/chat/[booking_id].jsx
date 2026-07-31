// app/chat/[booking_id].jsx — SHARED chat for both user and handyman
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image, Modal, Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio, Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Slider from '@react-native-community/slider';

export default function ChatScreen() {
  const { booking_id, source } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [myUsername, setMyUsername] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const typingTimeout = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recording, setRecording] = useState(null);
  const recordingInterval = useRef(null);

  const [sound, setSound] = useState(null);
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const playbackInterval = useRef(null);

  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [playingVideoUrl, setPlayingVideoUrl] = useState(null);
  const videoRef = useRef(null);

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

  const fmtDur = (s) => {
    const secs = parseInt(s) || 0;
    const m = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const inputBarBaseHeight = 60;
  const inputHeight = inputBarBaseHeight + Math.max(insets.bottom, 12);

  const isHandyman = source === 'handyman';
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

  const ws = useRef(null);
  const flatListRef = useRef(null);

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
        fetch(`${API_BASE_URL}/chats/booking/${booking_id}/mark-read/`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' } }).catch(() => {});
        setMyUsername(isHandyman ? (bookingData?.handyman?.username || 'Handyman') : (bookingData?.user?.username || 'User'));
      } catch (err) {
        Alert.alert('Error', 'Failed to load chat');
        router.back();
      } finally { setLoading(false); }
    };
    fetchData();
  }, [booking_id]);

  useEffect(() => {
    if (!booking_id) return;
    const connectWebSocket = async () => {
      try {
        const token = await AsyncStorage.getItem(isHandyman ? 'handyman_access_token' : 'access_token');
        if (!token) { Alert.alert('Error', 'Authentication token missing'); return; }
        const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/chat/booking/${booking_id}/?token=${token}`;
        ws.current = new WebSocket(wsUrl);
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
      } catch (err) { console.error('[Chat WS] Failed:', err); }
    };
    connectWebSocket();
    return () => { if (ws.current) ws.current.close(); if (typingTimeout.current) clearTimeout(typingTimeout.current); };
  }, [booking_id]);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
      if (playbackInterval.current) clearInterval(playbackInterval.current);
    };
  }, []);

  const sendMessage = (text, image_url, video_url, audio_url, duration, image_path, video_path, audio_path) => {
    if ((!text || !text.trim()) && !image_url && !video_url && !audio_url) return;
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    const msg = { message: text || '' };
    if (image_url) msg.image_url = image_url;
    if (video_url) msg.video_url = video_url;
    if (audio_url) { msg.audio_url = audio_url; msg.duration = duration || 0; }
    if (image_path) msg.image_path = image_path;
    if (video_path) msg.video_path = video_path;
    if (audio_path) msg.audio_path = audio_path;
    ws.current.send(JSON.stringify(msg));
    setNewMessage('');
  };

  const handleTyping = useCallback((text) => {
    setNewMessage(text);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      if (text.trim()) {
        ws.current.send(JSON.stringify({ type: 'typing', typing: true }));
        typingTimeout.current = setTimeout(() => {
          if (ws.current && ws.current.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify({ type: 'typing', typing: false }));
        }, 2000);
      } else {
        ws.current.send(JSON.stringify({ type: 'typing', typing: false }));
      }
    }
  }, []);

  const uploadAndSendMessage = async (uri, filename, fileType, mediaType, duration) => {
    const fd = new FormData();
    fd.append('media_type', mediaType);
    fd.append(mediaType, { uri, name: filename, type: fileType });
    fd.append('booking_id', booking_id);
    fd.append('is_support', 'false');
    if (duration > 0) fd.append('duration', String(duration));
    try {
      const token = await AsyncStorage.getItem(isHandyman ? 'handyman_access_token' : 'access_token');
      console.log(`[Upload] Sending ${mediaType}: ${filename} type=${fileType} dur=${duration}`);
      const res = await fetch(`${API_BASE_URL}/chats/upload-media/`, { method: 'POST', body: fd, headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.detail || `Upload failed (${res.status})`;
        Alert.alert('Upload Failed', errorMsg);
        return;
      }
      console.log(`[Upload] ${mediaType} OK:`, JSON.stringify(data).substring(0, 150));
      
      if (mediaType === 'image') sendMessage('', data.image_url, null, null, 0, data.relative_path, null, null);
      else if (mediaType === 'video') sendMessage('', null, data.video_url, null, Math.round(duration), null, data.relative_path, null);
      else sendMessage('', null, null, data.audio_url, Math.round(duration), null, null, data.relative_path);
    } catch (e) { 
      console.error('[Upload] Error:', e); 
      Alert.alert('Error', `Failed to upload: ${e.message}`); 
    }
  };

  const pickGallery = async () => {
    setShowMediaMenu(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
    if (!r.canceled && r.assets[0]) {
      const uri = r.assets[0].uri;
      const fn = uri.split('/').pop() || `img_${Date.now()}.jpg`;
      const mt = fn.match(/\.(\w+)$/);
      const t = mt ? `image/${mt[1]}` : 'image/jpeg';
      Alert.alert('Send Photo', 'Send this photo?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => uploadAndSendMessage(uri, fn, t, 'image', 0) }
      ]);
    }
  };

  const takeCamera = async () => {
    setShowMediaMenu(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission Required', 'Camera permission needed'); return; }
    const r = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.5 });
    if (!r.canceled && r.assets[0]) {
      const originalUri = r.assets[0].uri;
      const fn = `camera_${Date.now()}.jpg`;
      Alert.alert('Send Photo', 'Send this photo?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: async () => {
          try {
            const dest = `${FileSystem.cacheDirectory}${fn}`;
            await FileSystem.copyAsync({ from: originalUri, to: dest });
            await uploadAndSendMessage(dest, fn, 'image/jpeg', 'image', 0);
          } catch (e) {
            console.log('[Camera] Cache copy failed, trying original URI:', e.message);
            await uploadAndSendMessage(originalUri, fn, 'image/jpeg', 'image', 0);
          }
        }}
      ]);
    }
  };

  const pickVideo = async () => {
    setShowMediaMenu(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 0.7 });
    if (!r.canceled && r.assets[0]) {
      const uri = r.assets[0].uri;
      const fn = `video_${Date.now()}.mp4`;
      
      // Get duration - expo-image-picker returns it in MILLISECONDS for videos
      let durMs = r.assets[0].duration;
      console.log('[Video] Raw duration from picker:', durMs, 'Type:', typeof durMs);
      
      // Convert milliseconds to seconds
      let dur = 0;
      if (durMs && durMs > 0) {
        // If value is > 1000, it's likely in milliseconds
        if (durMs > 1000) {
          dur = Math.round(durMs / 1000);
        } else {
          dur = Math.round(durMs);
        }
      }
      
      console.log('[Video] Final duration (seconds):', dur);
      
      // Client-side validation - STRICTLY reject > 30 seconds
      if (dur > 30) {
        Alert.alert('Video Too Long', `This video is ${fmtDur(dur)}. Maximum allowed duration is 0:30. Please select a shorter video.`);
        return;
      }
      
      // Allow videos <= 30 seconds (including 0 duration if detection fails)
      Alert.alert('Send Video', `Send this video? (${fmtDur(dur)})`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => uploadAndSendMessage(uri, fn, 'video/mp4', 'video', dur) }
      ]);
    }
  };

  const recordVideo = async () => {
    setShowMediaMenu(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission Required', 'Camera permission needed'); return; }
    
    try {
      const r = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        quality: 0.7,
        videoMaxDuration: 30,
      });
      
      if (!r.canceled && r.assets[0]) {
        const originalUri = r.assets[0].uri;
        const fn = `record_${Date.now()}.mp4`;
        
        // Get duration - expo-image-picker returns it in MILLISECONDS for videos
        let durMs = r.assets[0].duration;
        console.log('[Video] Raw duration from camera:', durMs, 'Type:', typeof durMs);
        
        // Convert milliseconds to seconds
        let dur = 0;
        if (durMs && durMs > 0) {
          // If value is > 1000, it's likely in milliseconds
          if (durMs > 1000) {
            dur = Math.round(durMs / 1000);
          } else {
            dur = Math.round(durMs);
          }
        }
        
        console.log('[Video] Final duration (seconds):', dur);
        
        // Client-side validation - STRICTLY reject > 30 seconds
        if (dur > 30) {
          Alert.alert('Video Too Long', `This video is ${fmtDur(dur)}. Maximum allowed duration is 0:30. Please record a shorter video.`);
          return;
        }
        
        // Allow videos <= 30 seconds (including 0 duration if detection fails)
        Alert.alert('Send Video', `Send this video? (${fmtDur(dur)})`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send', onPress: async () => {
            try {
              const dest = `${FileSystem.cacheDirectory}${fn}`;
              await FileSystem.copyAsync({ from: originalUri, to: dest });
              await uploadAndSendMessage(dest, fn, 'video/mp4', 'video', dur);
            } catch (e) {
              await uploadAndSendMessage(originalUri, fn, 'video/mp4', 'video', dur);
            }
          }}
        ]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to record video: ' + err.message);
    }
  };

  const startVoice = async () => {
    setShowMediaMenu(false);
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission Required', 'Microphone permission needed'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      recordingInterval.current = setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } catch (err) { 
      console.error('[Voice] Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording: ' + err.message); 
    }
  };

  const stopVoice = async () => {
    if (!recording) return;
    clearInterval(recordingInterval.current);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const dur = recordingDuration;
      setRecording(null); setIsRecording(false); setRecordingDuration(0);
      if (uri) await uploadAndSendMessage(uri, `voice_${Date.now()}.m4a`, 'audio/m4a', 'audio', dur);
    } catch (err) { Alert.alert('Error', 'Failed to stop recording'); }
  };

  const cancelVoice = async () => {
    if (!recording) return;
    clearInterval(recordingInterval.current);
    try { await recording.stopAndUnloadAsync(); setRecording(null); setIsRecording(false); setRecordingDuration(0); } catch (err) {}
  };

  const playVoice = async (audioUrl, msgId) => {
    try {
      if (playingMessageId === msgId && sound) {
        const status = await sound.getStatusAsync();
        if (status.isPlaying) {
          await sound.pauseAsync();
          clearInterval(playbackInterval.current);
          return;
        }
        await sound.playAsync();
        playbackInterval.current = setInterval(async () => {
          try {
            const st = await sound.getStatusAsync();
            if (st.isLoaded) { setPlaybackPosition(st.positionMillis / 1000); setPlaybackDuration(st.durationMillis / 1000); }
          } catch (e) {}
        }, 250);
        return;
      }
      if (sound) { await sound.unloadAsync(); setSound(null); setPlayingMessageId(null); setPlaybackPosition(0); }
      if (playbackInterval.current) clearInterval(playbackInterval.current);
      const { sound: s } = await Audio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: true });
      setSound(s);
      setPlayingMessageId(msgId);
      setPlaybackPosition(0);
      const status = await s.getStatusAsync();
      if (status.isLoaded) setPlaybackDuration(status.durationMillis / 1000);
      playbackInterval.current = setInterval(async () => {
        try {
          const st = await s.getStatusAsync();
          if (st.isLoaded) {
            setPlaybackPosition(st.positionMillis / 1000);
            setPlaybackDuration(st.durationMillis / 1000);
            if (st.didJustFinish) { clearInterval(playbackInterval.current); setSound(null); setPlayingMessageId(null); setPlaybackPosition(0); }
          }
        } catch (e) {}
      }, 250);
    } catch (err) {}
  };

  const seekVoice = async (value) => {
    if (!sound) return;
    try { setPlaybackPosition(value); await sound.setPositionAsync(value * 1000); } catch (err) {}
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollButton(false);
  };

  const renderMessage = ({ item }) => {
    if (!item.message && !item.image_url && !item.video_url && !item.audio_url) return null;
    const fmtTime = (ts) => { const d = new Date(ts); return isNaN(d.getTime()) ? ts : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
    const mine = item.sender_username === myUsername;
    const isThisPlaying = playingMessageId === item.id;
    return (
      <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View style={[styles.bubble, mine ? styles.myMsg : styles.theirMsg]}>
          {!mine && <Text style={styles.sender}>{item.sender_username || 'Unknown'}</Text>}
          {item.image_url && !item.video_url && !item.audio_url ? (
            <TouchableOpacity onPress={() => setFullScreenImage(item.image_url)} activeOpacity={0.9}>
              <Image source={{ uri: item.image_url }} style={styles.msgImage} />
            </TouchableOpacity>
          ) : null}
          {item.video_url ? (
            <TouchableOpacity onPress={() => setPlayingVideoUrl(item.video_url)} style={styles.videoContainer} activeOpacity={0.9}>
              <Image 
                source={{ uri: item.video_url }} 
                style={styles.videoThumb}
                resizeMode="cover"
              />
              <View style={styles.playButton}>
                <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.95)" />
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{fmtDur(item.duration || 0)}</Text>
              </View>
            </TouchableOpacity>
          ) : null}
          {item.audio_url ? (
            <View style={styles.voiceBlock}>
              <TouchableOpacity onPress={() => playVoice(item.audio_url, item.id)} style={styles.voiceRow} activeOpacity={0.8}>
                <Ionicons name={isThisPlaying && sound ? 'pause-circle' : 'play-circle'} size={34} color={mine ? 'white' : '#6366F1'} />
                <View style={styles.voiceContent}>
                  <View style={styles.seekRow}>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={playbackDuration || (item.duration || 1)}
                      value={isThisPlaying ? playbackPosition : 0}
                      onSlidingComplete={seekVoice}
                      minimumTrackTintColor={mine ? 'rgba(255,255,255,0.9)' : '#6366F1'}
                      maximumTrackTintColor={mine ? 'rgba(255,255,255,0.3)' : '#CBD5E1'}
                      thumbTintColor={mine ? 'white' : '#6366F1'}
                    />
                  </View>
                  <View style={styles.timeRow}>
                    <Text style={[styles.seekTime, { color: mine ? 'rgba(255,255,255,0.85)' : '#64748B' }]}>
                      {isThisPlaying ? fmtDur(Math.round(playbackPosition)) : '0:00'} / {fmtDur(item.duration)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ) : null}
          {item.message ? <Text style={mine ? styles.myText : styles.theirText}>{item.message}</Text> : null}
          <Text style={[styles.time, { color: mine ? 'rgba(255,255,255,0.75)' : '#94A3B8' }]}>{fmtTime(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  const otherName = isHandyman ? booking?.user?.username : booking?.handyman?.username;
  const avatar = (isHandyman ? booking?.user?.thumbnail : booking?.handyman?.thumbnail) || `https://ui-avatars.com/api/?name=${otherName}&background=6366F1&color=fff`;

  if (loading) return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator size="large" color="#6366F1" />
    </SafeAreaView>
  );

return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1, paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerAvatarWrap}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
          </View>
          <View style={styles.hInfo}>
            <Text style={styles.hName} numberOfLines={1}>{otherName || '...'}</Text>
            {typingUser ? (
              <Text style={styles.hSubStatus} numberOfLines={1}>typing…</Text>
            ) : (
              <Text style={styles.hSubStatusMuted} numberOfLines={1}>Tap for booking details</Text>
            )}
          </View>
        </View>

        <View style={styles.listWrap}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, i) => item.id?.toString() || i.toString()}
            renderItem={renderMessage}
            contentContainerStyle={[styles.list, { paddingBottom: inputHeight + 16 }]}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            onScroll={({ nativeEvent: e }) => setShowScrollButton(e.contentOffset.y + e.layoutMeasurement.height < e.contentSize.height - 100)}
            scrollEventThrottle={400}
            style={{ flex: 1 }}
          />

          {showScrollButton && (
            <TouchableOpacity
              style={[styles.scrollBtn, { bottom: inputHeight + 14 }]}
              onPress={scrollToBottom}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-down" size={22} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputArea}>
          {typingUser ? (
            <View style={styles.typingBar}>
              <View style={styles.typingDots}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
              <Text style={styles.typingText}>{typingUser} is typing…</Text>
            </View>
          ) : null}

          {isRecording ? (
            <View style={styles.recBar}>
              <View style={styles.recInfo}>
                <View style={styles.recDot} />
                <Text style={styles.recLabel}>Recording {fmtDur(recordingDuration)}</Text>
              </View>
              <View style={styles.recActions}>
                <TouchableOpacity onPress={cancelVoice} style={styles.recCancel}><Ionicons name="close" size={22} color="white" /></TouchableOpacity>
                <TouchableOpacity onPress={stopVoice} style={styles.recOk}><Ionicons name="checkmark" size={22} color="white" /></TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              {showMediaMenu && (
                <View style={styles.mediaRow}>
                  {[
                    { icon: 'image', color: '#3B82F6', label: 'Gallery', onPress: pickGallery },
                    { icon: 'camera', color: '#8B5CF6', label: 'Camera', onPress: takeCamera },
                    { icon: 'videocam', color: '#F59E0B', label: 'Video', onPress: pickVideo },
                    { icon: 'videocam-outline', color: '#EF4444', label: 'Record', onPress: recordVideo },
                    { icon: 'mic', color: '#22C55E', label: 'Voice', onPress: startVoice },
                  ].map((btn, i) => (
                    <TouchableOpacity key={i} onPress={btn.onPress} style={styles.mediaBtn} activeOpacity={0.8}>
                      <View style={[styles.mediaIcon, { backgroundColor: btn.color }]}><Ionicons name={btn.icon} size={21} color="white" /></View>
                      <Text style={styles.mediaLabel}>{btn.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.inputRow}>
                <TouchableOpacity onPress={() => setShowMediaMenu(!showMediaMenu)} style={styles.addBtn}>
                  <Ionicons name={showMediaMenu ? 'close' : 'add'} size={24} color="#6366F1" />
                </TouchableOpacity>
                <View style={styles.textInputWrap}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type a message..."
                    placeholderTextColor="#9CA3AF"
                    value={newMessage}
                    onChangeText={handleTyping}
                    multiline={false}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => sendMessage(newMessage)}
                  disabled={!newMessage.trim()}
                  style={[styles.sendBtn, newMessage.trim() && styles.sendBtnActive]}
                >
                  <Ionicons name="send" size={19} color={newMessage.trim() ? 'white' : '#9CA3AF'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={{ height: Math.max(insets.bottom, 12) }} />
        </View>
      </View>

      <Modal visible={!!fullScreenImage} transparent onRequestClose={() => setFullScreenImage(null)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setFullScreenImage(null)}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <Image source={{ uri: fullScreenImage }} style={styles.modalImg} resizeMode="contain" />
        </View>
      </Modal>
      <Modal visible={!!playingVideoUrl} transparent={false} onRequestClose={() => setPlayingVideoUrl(null)}>
        <View style={styles.fullscreenVideoContainer}>
          <TouchableOpacity style={styles.fullscreenClose} onPress={() => { setPlayingVideoUrl(null); if (videoRef.current) { videoRef.current.stopAsync(); videoRef.current.unloadAsync(); } }}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <Video
            ref={videoRef}
            source={{ uri: playingVideoUrl }}
            style={styles.fullscreenVideo}
            useNativeControls
            resizeMode="contain"
            shouldPlay
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                setPlayingVideoUrl(null);
                if (videoRef.current) {
                  videoRef.current.stopAsync();
                  videoRef.current.unloadAsync();
                }
              }
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: Platform.OS === 'android' ? 25 : 0,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerBackBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerAvatarWrap: { marginLeft: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  hInfo: { marginLeft: 10, flex: 1, minWidth: 0 },
  hName: { fontSize: 16.5, fontWeight: '700', color: COLORS.textPrimary },
  hSubStatus: { fontSize: 12.5, color: COLORS.primary, fontWeight: '600', marginTop: 1 },
  hSubStatusMuted: { fontSize: 12, color: COLORS.textTertiary, marginTop: 1 },

  listWrap: { flex: 1, position: 'relative' },
  list: { padding: 14, paddingTop: 16 },

  bubbleRow: { width: '100%', flexDirection: 'row', marginVertical: 3 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  myMsg: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  theirMsg: { backgroundColor: COLORS.bubbleTheirs, borderBottomLeftRadius: 4 },
  myText: { color: 'white', fontSize: 15, lineHeight: 20 },
  theirText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 20 },
  sender: { fontSize: 11.5, fontWeight: '700', color: COLORS.primary, marginBottom: 3 },
  time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },

  msgImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 4 },
  videoContainer: { width: 200, height: 150, borderRadius: 12, overflow: 'hidden', marginBottom: 4, position: 'relative' },
  videoThumb: { width: '100%', height: '100%', backgroundColor: '#000' },
  playButton: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  durationBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  durationText: { color: 'white', fontSize: 12, fontWeight: '600' },

  voiceBlock: { minWidth: 210, marginBottom: 4 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceContent: { flex: 1 },
  seekRow: { height: 24, justifyContent: 'center' },
  slider: { width: '100%', height: 24 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  seekTime: { fontSize: 10.5, fontWeight: '500' },

  // ---- Input area: always docked to the bottom, consistent height/spacing
  // across typing, media-menu, and recording states so it never jumps. ----
  inputArea: {
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  typingDots: { flexDirection: 'row', gap: 3 },
  typingDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.primary, opacity: 0.6 },
  typingText: { fontSize: 12, color: COLORS.primary, fontStyle: 'italic', fontWeight: '500' },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    minHeight: 60,
  },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  textInputWrap: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 42,
    maxHeight: 90,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EEF1F6',
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  mediaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  mediaBtn: { alignItems: 'center', gap: 5 },
  mediaIcon: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F172A', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  mediaLabel: { fontSize: 10.5, fontWeight: '600', color: '#475569' },

  recBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, backgroundColor: '#FEF2F2', borderRadius: 14,
    marginHorizontal: 12, marginTop: 10, marginBottom: 4,
  },
  recInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  recLabel: { fontSize: 14, fontWeight: '600', color: '#991B1B' },
  recActions: { flexDirection: 'row', gap: 10 },
  recCancel: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  recOk: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 8 },
  modalImg: { width: '100%', height: '80%' },
  fullscreenVideoContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fullscreenVideo: { width: '100%', height: '100%' },
  fullscreenClose: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 10 },

  scrollBtn: {
    position: 'absolute',
    right: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
});