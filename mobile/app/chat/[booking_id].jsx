// app/chat/[booking_id].jsx — SHARED chat for both user and handyman
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView, Alert, ActivityIndicator, Image, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  const fmtDur = (s) => {
    const secs = parseInt(s) || 0;
    const m = Math.floor(secs / 60);
    const sec = secs % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

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
      <View style={[styles.bubble, mine ? styles.myMsg : styles.theirMsg]}>
        {!mine && <Text style={styles.sender}>{item.sender_username || 'Unknown'}</Text>}
        {item.image_url && !item.video_url && !item.audio_url ? (
          <TouchableOpacity onPress={() => setFullScreenImage(item.image_url)}>
            <Image source={{ uri: item.image_url }} style={styles.msgImage} />
          </TouchableOpacity>
        ) : null}
        {item.video_url ? (
          <TouchableOpacity onPress={() => setPlayingVideoUrl(item.video_url)} style={styles.videoContainer}>
            <Image 
              source={{ uri: item.video_url }} 
              style={styles.videoThumb}
              resizeMode="cover"
            />
            <View style={styles.playButton}>
              <Ionicons name="play-circle" size={50} color="white" />
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{fmtDur(item.duration || 0)}</Text>
            </View>
          </TouchableOpacity>
        ) : null}
        {item.audio_url ? (
          <View style={styles.voiceBlock}>
            <TouchableOpacity onPress={() => playVoice(item.audio_url, item.id)} style={styles.voiceRow}>
              <Ionicons name={isThisPlaying && sound ? 'pause-circle' : 'play-circle'} size={36} color={mine ? 'white' : '#6366F1'} />
              <View style={styles.voiceContent}>
                <View style={styles.seekRow}>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={playbackDuration || (item.duration || 1)}
                    value={isThisPlaying ? playbackPosition : 0}
                    onSlidingComplete={seekVoice}
                    minimumTrackTintColor={mine ? 'rgba(255,255,255,0.8)' : '#6366F1'}
                    maximumTrackTintColor={mine ? 'rgba(255,255,255,0.3)' : '#cbd5e1'}
                    thumbTintColor={mine ? 'white' : '#6366F1'}
                  />
                </View>
                <View style={styles.timeRow}>
                  <Text style={[styles.seekTime, { color: mine ? 'rgba(255,255,255,0.8)' : '#64748b' }]}>
                    {isThisPlaying ? fmtDur(Math.round(playbackPosition)) : '0:00'} / {fmtDur(item.duration)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}
        {item.message ? <Text style={mine ? styles.myText : styles.theirText}>{item.message}</Text> : null}
        <Text style={styles.time}>{fmtTime(item.created_at)}</Text>
      </View>
    );
  };

  const VideoThumbnail = ({ uri }) => (
    <Image 
      source={{ uri: uri }} 
      style={styles.videoThumb}
      resizeMode="cover"
    />
  );

  const otherName = isHandyman ? booking?.user?.username : booking?.handyman?.username;
  const avatar = (isHandyman ? booking?.user?.thumbnail : booking?.handyman?.thumbnail) || `https://ui-avatars.com/api/?name=${otherName}&background=random`;

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={28} color="#1F2937" /></TouchableOpacity>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={styles.hInfo}><Text style={styles.hName}>{otherName || '...'}</Text></View>
        </View>
        <FlatList ref={flatListRef} data={messages} keyExtractor={(item, i) => item.id?.toString() || i.toString()} renderItem={renderMessage} contentContainerStyle={styles.list} onContentSizeChange={scrollToBottom} onLayout={scrollToBottom} onScroll={({ nativeEvent: e }) => setShowScrollButton(e.contentOffset.y + e.layoutMeasurement.height < e.contentSize.height - 100)} scrollEventThrottle={400} />
        {showScrollButton && <TouchableOpacity style={styles.scrollBtn} onPress={scrollToBottom}><Ionicons name="chevron-down" size={24} color="white" /></TouchableOpacity>}
        {typingUser ? <View style={styles.typingBar}><Text style={styles.typingText}>{typingUser} is typing...</Text></View> : null}
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {isRecording ? (
            <View style={styles.recBar}>
              <View style={styles.recInfo}><View style={styles.recDot} /><Text style={styles.recLabel}>Recording {fmtDur(recordingDuration)}</Text></View>
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
                    { icon: 'image', color: '#3b82f6', label: 'Gallery', onPress: pickGallery },
                    { icon: 'camera', color: '#8b5cf6', label: 'Camera', onPress: takeCamera },
                    { icon: 'videocam', color: '#f59e0b', label: 'Video', onPress: pickVideo },
                    { icon: 'videocam-outline', color: '#ef4444', label: 'Record', onPress: recordVideo },
                    { icon: 'mic', color: '#22c55e', label: 'Voice', onPress: startVoice },
                  ].map((btn, i) => (
                    <TouchableOpacity key={i} onPress={btn.onPress} style={styles.mediaBtn}>
                      <View style={[styles.mediaIcon, { backgroundColor: btn.color }]}><Ionicons name={btn.icon} size={22} color="white" /></View>
                      <Text style={styles.mediaLabel}>{btn.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.inputRow}>
                <TouchableOpacity onPress={() => setShowMediaMenu(!showMediaMenu)} style={styles.addBtn}><Ionicons name={showMediaMenu ? 'close-circle' : 'add-circle'} size={26} color="#6366F1" /></TouchableOpacity>
                <TextInput style={styles.textInput} placeholder="Type a message..." value={newMessage} onChangeText={handleTyping} multiline />
                <TouchableOpacity onPress={() => sendMessage(newMessage)} disabled={!newMessage.trim()} style={styles.sendBtn}><Ionicons name="send" size={24} color={newMessage.trim() ? '#6366F1' : '#9ca3af'} /></TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      <Modal visible={!!fullScreenImage} transparent onRequestClose={() => setFullScreenImage(null)}>
        <View style={styles.modalBg}><TouchableOpacity style={styles.modalClose} onPress={() => setFullScreenImage(null)}><Ionicons name="close" size={32} color="white" /></TouchableOpacity><Image source={{ uri: fullScreenImage }} style={styles.modalImg} resizeMode="contain" /></View>
      </Modal>
      <Modal visible={!!playingVideoUrl} transparent={false} onRequestClose={() => setPlayingVideoUrl(null)}>
        <View style={styles.fullscreenVideoContainer}>
          <TouchableOpacity style={styles.fullscreenClose} onPress={() => { setPlayingVideoUrl(null); if (videoRef.current) { videoRef.current.stopAsync(); videoRef.current.unloadAsync(); } }}>
            <Ionicons name="close" size={32} color="white" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginTop: Platform.OS === 'android' ? 25 : 0 },
  avatar: { width: 38, height: 38, borderRadius: 19, marginLeft: 12 },
  hInfo: { marginLeft: 10, flex: 1 },
  hName: { fontSize: 17, fontWeight: '600' },
  list: { padding: 14, paddingBottom: 70 },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 16, marginVertical: 3 },
  myMsg: { alignSelf: 'flex-end', backgroundColor: '#6366F1', borderBottomRightRadius: 4 },
  theirMsg: { alignSelf: 'flex-start', backgroundColor: '#e5e7eb', borderBottomLeftRadius: 4 },
  myText: { color: 'white', fontSize: 15 },
  theirText: { color: '#1f2937', fontSize: 15 },
  sender: { fontSize: 11, fontWeight: '700', color: '#6366F1', marginBottom: 2 },
  time: { fontSize: 9, marginTop: 4, opacity: 0.7, alignSelf: 'flex-end' },
  msgImage: { width: 200, height: 200, borderRadius: 10, marginBottom: 4 },
  videoContainer: { width: 200, height: 150, borderRadius: 10, overflow: 'hidden', marginBottom: 4, position: 'relative' },
  videoThumb: { width: '100%', height: '100%', backgroundColor: '#000' },
  playButton: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  durationBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  durationText: { color: 'white', fontSize: 12, fontWeight: '600' },
  voiceBlock: { minWidth: 200, marginBottom: 4 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  voiceContent: { flex: 1 },
  seekRow: { height: 24, justifyContent: 'center' },
  slider: { width: '100%', height: 24 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  seekTime: { fontSize: 10, fontWeight: '500' },
  inputArea: { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 6 },
  addBtn: { padding: 6 },
  textInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, maxHeight: 80, fontSize: 15 },
  sendBtn: { padding: 6 },
  mediaRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  mediaBtn: { alignItems: 'center', gap: 3 },
  mediaIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  mediaLabel: { fontSize: 9, fontWeight: '600', color: '#475569' },
  recBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: '#fef2f2', borderRadius: 12, marginHorizontal: 8, marginVertical: 4 },
  recInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  recLabel: { fontSize: 14, fontWeight: '600', color: '#991b1b' },
  recActions: { flexDirection: 'row', gap: 10 },
  recCancel: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' },
  recOk: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalClose: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
  modalImg: { width: '100%', height: '80%' },
  fullscreenVideoContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  fullscreenVideo: { width: '100%', height: '100%' },
  fullscreenClose: { position: 'absolute', top: 50, right: 20, zIndex: 1, padding: 10 },
  scrollBtn: { position: 'absolute', bottom: 90, right: 16, backgroundColor: '#6366F1', borderRadius: 20, padding: 8, elevation: 5 },
  typingBar: { paddingHorizontal: 14, paddingVertical: 4, backgroundColor: '#f1f5f9' },
  typingText: { fontSize: 11, color: '#6366F1', fontStyle: 'italic' },
});