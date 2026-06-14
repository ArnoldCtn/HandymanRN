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
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/use-theme-color'

export default function EditProfileScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const router     = useRouter()
  const user       = useGlobal(state => state.user)
  const updateUser = useGlobal(state => state.updateUser)

  const [username,       setUsername]       = useState(user?.username ?? '')
  const [email,          setEmail]          = useState(user?.email    ?? '')
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
    if (thumbnail.startsWith('http')) return thumbnail
    return thumbnail
  }

  // Shows newly picked image, else existing
  const displayAvatar = profilePicture
    ? profilePicture
    : resolveAvatar(user?.thumbnail)

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert(t('auth.permission_needed')); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect:[1,1], quality:0.5,
      base64: true
    })
    if (!result.canceled) setProfilePicture(result.assets[0].uri)
  }

  async function onSave() {
    setLoading(true)
    
    const updateData = {};
    if (username !== user?.username) updateData.username = username;
    if (email    !== user?.email)    updateData.email = email;
    if (password)                    updateData.password = password;

    if (profilePicture) {
      try {
        const response = await fetch(profilePicture);
        const blob = await response.blob();
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        updateData.thumbnail = base64;
      } catch (imgErr) {
        console.log('Failed to convert image to base64:', imgErr.message);
      }
    }

    try {
      const response = await api.patch('/users/me/update/', updateData, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      })

      updateUser(response.data)
      await AsyncStorage.setItem('user', JSON.stringify(response.data))
      showToast(t('common.success'), 'success')
      setTimeout(() => router.back(), 1200)
    } catch (error) {
      console.log('[EditProfile]', error.response?.data ?? error.message)
      showToast(t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const styles = createStyles(theme)

  return (
      <SafeAreaView style={styles.root}>
        <Toast visible={toast.visible} message={toast.message}
          type={toast.type} onHide={() => setToast(t => ({...t, visible:false}))} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('handyman_profile.edit_profile')}</Text>
          <View style={{ width:24 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex:1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
           <ScrollView
                  contentContainerStyle={styles.scroll}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
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

            <Input title={t('auth.username')} value={username} setValue={setUsername}
              error="" setError={() => {}} />
            <Input title={t('auth.email')} value={email} setValue={setEmail}
              error="" setError={() => {}} keyboardType="email-address" />

            <View style={{ position:'relative' }}>
              <Input title={t('auth.password_placeholder')}
                value={password} setValue={setPassword}
                secureTextEntry={!showPassword}
                error="" setError={() => {}} />
              <TouchableOpacity style={styles.eyeBtn}
                onPress={() => setShowPassword(s => !s)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {loading
              ? <ActivityIndicator size="large" color={theme.primary} style={{ marginTop:20 }} />
              : <Button title={t('common.save')} onPress={onSave} />
            }
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  root:             { flex:1, backgroundColor: theme.background },
  header:           { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical: 15,
    marginTop: 40, borderBottomWidth:1, borderColor: theme.border, backgroundColor: theme.surface },
  headerTitle:      { fontSize:18, fontWeight:'700', color: theme.text },
  scroll:           { paddingHorizontal:24, paddingTop:20, paddingBottom:40 },
  avatarWrapper:    { alignSelf:'center', position:'relative', marginBottom:28 },
  avatar:           { width:110, height:110, borderRadius:55, borderWidth: 3, borderColor: theme.surface },
  avatarPlaceholder:{ width:110, height:110, borderRadius:55, backgroundColor: theme.primary, alignItems:'center', justifyContent:'center', borderWidth: 3, borderColor: theme.surface },
  avatarInitial:    { color:'white', fontSize:36, fontWeight:'bold' },
  pencilBtn:        { position:'absolute', bottom:0, right:0, width:30, height:30, borderRadius:15, backgroundColor: theme.primary, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor: theme.surface },
  eyeBtn:           { position:'absolute', right:16, top:40, padding:4 },
})
