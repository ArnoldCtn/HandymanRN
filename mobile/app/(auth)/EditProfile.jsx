import {
  Alert, Image, Keyboard, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, StyleSheet, Text,
  TouchableOpacity, TouchableWithoutFeedback, View, ActivityIndicator
} from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import Ionicons from '@expo/vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '@/services/api'
import useGlobal from '@/services/global'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Toast from '@/components/Toast'

export default function EditProfileScreen() {
  const router     = useRouter()
  const user       = useGlobal(state => state.user)
  const updateUser = useGlobal(state => state.updateUser)

  const [username,       setUsername]       = useState(user?.username ?? '')
  const [email,          setEmail]          = useState(user?.email    ?? '')
//   const [phone,          setPhone]          = useState(user?.phone    ?? '')
  const [password,       setPassword]       = useState('')
  const [showPassword,   setShowPassword]   = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)  // new local pick
  const [loading,        setLoading]        = useState(false)
  const [toast,          setToast]          = useState({ visible:false, message:'', type:'success' })

  function showToast(msg, type='success') {
    setToast({ visible:true, message:msg, type })
  }

  function resolveAvatar(thumbnail) {
    if (!thumbnail) return null
    // Backend already returns full URLs, use them directly
    if (thumbnail.startsWith('http')) return thumbnail
    // Fallback for any relative URLs
    return `http://192.168.43.188:8000/media/${thumbnail}`
  }

  // Shows newly picked image, else existing
  const displayAvatar = profilePicture
    ? profilePicture
    : resolveAvatar(user?.thumbnail)

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission needed'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect:[1,1], quality:0.5
    })
    if (!result.canceled) setProfilePicture(result.assets[0].uri)
  }

  async function onSave() {
    setLoading(true)
    
    // Pure JSON approach with base64 image support
    const updateData = {};

    if (username !== user?.username) updateData.username = username;
    if (email    !== user?.email)    updateData.email = email;
    // if (phone    !== user?.phone)    updateData.phone = phone;
    if (password)                    updateData.password = password;

    // Convert profile picture to base64 and include in JSON
    if (profilePicture) {
      try {
        console.log('Converting profile picture to base64...');
        const response = await fetch(profilePicture);
        const blob = await response.blob();
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        updateData.thumbnail = base64;
        console.log('Profile picture converted to base64');
      } catch (imgErr) {
        console.log('Failed to convert image to base64:', imgErr.message);
      }
    }

    try {
    // Send as pure JSON with base64 image
    const response = await api.patch('/users/me/update/', updateData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    updateUser(response.data)
    await AsyncStorage.setItem('user', JSON.stringify(response.data))
    showToast('Profile updated!', 'success')
    setTimeout(() => router.back(), 1200)
  } catch (error) {
    console.log('[EditProfile]', error.response?.data ?? error.message)
    console.log('[Edit', error)
    showToast(
      error.response?.data
        ? JSON.stringify(error.response.data)
        : 'Update failed',
      'error'
    )
  } finally {
    setLoading(false)
  }
  }

  return (
      <SafeAreaView style={{ flex:1, backgroundColor:'#fff' }}>
        <Toast visible={toast.visible} message={toast.message}
          type={toast.type} onHide={() => setToast(t => ({...t, visible:false}))} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#202020" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width:24 }} />
        </View>

        {/* <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex:1 }}
        > */}
           <ScrollView
                  contentContainerStyle={styles.scroll}
                  keyboardShouldPersistTaps="handled"   // ← key fix for non-input taps
                  keyboardDismissMode="on-drag"         // ← keyboard hides only when dragging
                  showsVerticalScrollIndicator={false}
                >

            {/* Avatar picker */}
            <View style={styles.avatarWrapper}>
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {user?.username?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.pencilBtn} onPress={pickImage}>
                <Ionicons name="camera" size={15} color="white" />
              </TouchableOpacity>
            </View>

            <Input title="Username" value={username} setValue={setUsername}
              error="" setError={() => {}} />
            <Input title="Email"    value={email}    setValue={setEmail}
              error="" setError={() => {}} />
            {/* <Input title="Phone (e.g. +237...)" value={phone} setValue={setPhone}
              error="" setError={() => {}} /> */}

            <View style={{ position:'relative' }}>
              <Input title="New Password (leave blank to keep)"
                value={password} setValue={setPassword}
                secureTextEntry={!showPassword}
                error="" setError={() => {}} />
              <TouchableOpacity style={styles.eyeBtn}
                onPress={() => setShowPassword(s => !s)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22} color="gray" />
              </TouchableOpacity>
            </View>

            {loading
              ? <ActivityIndicator size="large" color="#6366F1" style={{ marginTop:20 }} />
              : <Button title="Save Changes" onPress={onSave} />
            }
          </ScrollView>
        {/* </KeyboardAvoidingView> */}
      </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:           { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical: 15,
    marginVertical: 20, borderBottomWidth:1, borderColor:'#f0f0f0' },
  headerTitle:      { fontSize:18, fontWeight:'700', color:'#202020' },
  scroll:           { paddingHorizontal:24, paddingTop:20, paddingBottom:40 },
  avatarWrapper:    { alignSelf:'center', position:'relative', marginBottom:28 },
  avatar:           { width:110, height:110, borderRadius:55 },
  avatarPlaceholder:{ width:110, height:110, borderRadius:55, backgroundColor:'#6366F1', alignItems:'center', justifyContent:'center' },
  avatarInitial:    { color:'white', fontSize:36, fontWeight:'bold' },
  pencilBtn:        { position:'absolute', bottom:0, right:0, width:30, height:30, borderRadius:15, backgroundColor:'#6366F1', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'white' },
  eyeBtn:           { position:'absolute', right:16, top:40, padding:4 },
})