import { useState } from 'react'
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import Ionicons from '@expo/vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'

import Input from '@/components/Input'
import Button from '@/components/Button'
import handymanApi from '@/services/handymanApi'
import useHandymanGlobal from '@/services/handymanGlobal'

function formatDateISO(d) {
  if (!d) return ''
  if (typeof d === 'string') return d.slice(0, 10)
  const date = new Date(d)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Same base64 conversion as handyman SignUp.jsx */
async function uriToBase64(uri) {
  const imgResponse = await fetch(uri)
  const blob = await imgResponse.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function captureIdPhoto() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync()
  if (status !== 'granted') {
    Alert.alert('Permission needed', 'Camera access is required to photograph your ID.')
    return null
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: false,
    exif: false,
  })

  if (result.canceled || !result.assets?.[0]) return null
  return result.assets[0]
}

export default function VerifyIdScreen() {
  const router = useRouter()
  const handyman = useHandymanGlobal(s => s.handyman)
  const updateHandyman = useHandymanGlobal(s => s.updateHandyman)

  const [legalName, setLegalName] = useState(handyman?.legal_name || '')
  const [frontPhoto, setFrontPhoto] = useState(null)
  const [backPhoto, setBackPhoto] = useState(null)
  const [loading, setLoading] = useState(false)

  const birthDate = formatDateISO(handyman?.birth_date)
  const gender = handyman?.gender || 'male'

  async function pickSide(side) {
    const asset = await captureIdPhoto()
    if (!asset) return
    if (side === 'front') setFrontPhoto(asset)
    else setBackPhoto(asset)
  }

  async function onSubmit() {
    if (!legalName.trim()) {
      Alert.alert('Name required', 'Enter your full legal name exactly as on your ID.')
      return
    }
    if (!birthDate) {
      Alert.alert(
        'Birth date missing',
        'Your profile has no birth date. Set it in Django admin or register again with date of birth.'
      )
      return
    }
    if (!frontPhoto || !backPhoto) {
      Alert.alert('Photos required', 'Capture both the front and back of your ID card.')
      return
    }

    setLoading(true)
    try {
      console.log('[VerifyId] Converting images to base64...')
      const [id_card_front, id_card_back] = await Promise.all([
        uriToBase64(frontPhoto.uri),
        uriToBase64(backPhoto.uri),
      ])

      const payload = {
        id_full_name: legalName.trim(),
        birth_date: birthDate,
        gender,
        id_card_front,
        id_card_back,
      }

      const response = await handymanApi({
        method: 'POST',
        url: '/handymen/verify-id/',
        data: payload,
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000,
      })

      const updated = response.data.handyman
      if (updated) {
        await AsyncStorage.setItem('handyman', JSON.stringify(updated))
        updateHandyman(updated)
      }

      Alert.alert(
        'Verification successful',
        response.data.message || 'Your government ID has been verified.',
        [{ text: 'OK', onPress: () => router.back() }]
      )
    } catch (error) {
      console.log('[VerifyId] error:', error.message, error.response?.status)
      const data = error.response?.data
      let detail =
        data?.detail
        || data?.id_card_front?.[0]
        || data?.id_card_back?.[0]
        || data?.non_field_errors?.[0]

      if (!detail && data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0]
        const val = data[firstKey]
        detail = Array.isArray(val) ? val[0] : val
      }

      if (!detail) {
        detail = error.code === 'ECONNABORTED'
          ? 'Request timed out. Check your connection and try again.'
          : error.message || 'Verification failed. Please try again.'
      }

      Alert.alert('Verification failed', String(detail))
    } finally {
      setLoading(false)
    }
  }

  if (handyman?.is_verified) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#202020" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ID Verification</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.doneBox}>
          <Ionicons name="shield-checkmark" size={64} color="#059669" />
          <Text style={styles.doneTitle}>Already verified</Text>
          <Text style={styles.doneSub}>
            Your account passed government ID verification.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#202020" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Government ID</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Take clear photos of your Cameroon national ID — front and back — in good lighting.
          We will match the details with your profile using secure AI verification.
        </Text>

        <Input
          title="Full legal name (as on ID)"
          value={legalName}
          setValue={setLegalName}
          error=""
          setError={() => {}}
        />

        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Birth date on profile</Text>
          <Text style={styles.profileValue}>{birthDate || '—'}</Text>
        </View>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Gender on profile</Text>
          <Text style={styles.profileValue}>
            {gender === 'female' ? 'Female' : 'Male'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>ID card — front</Text>
        <TouchableOpacity style={styles.photoBox} onPress={() => pickSide('front')}>
          {frontPhoto ? (
            <Image source={{ uri: frontPhoto.uri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#9ca3af" />
              <Text style={styles.photoHint}>Tap to capture front</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>ID card — back</Text>
        <TouchableOpacity style={styles.photoBox} onPress={() => pickSide('back')}>
          {backPhoto ? (
            <Image source={{ uri: backPhoto.uri }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#9ca3af" />
              <Text style={styles.photoHint}>Tap to capture back</Text>
            </View>
          )}
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 24 }} />
        ) : (
          <Button title="Submit for verification" onPress={onSubmit} />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#202020' },
  scroll: { padding: 20 },
  intro: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 4,
  },
  profileLabel: { fontSize: 14, color: '#6b7280' },
  profileValue: { fontSize: 14, fontWeight: '600', color: '#202020' },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202020',
    marginTop: 20,
    marginBottom: 10,
  },
  photoBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    overflow: 'hidden',
    minHeight: 160,
    backgroundColor: '#f9fafb',
  },
  photoPlaceholder: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoHint: { fontSize: 13, color: '#9ca3af' },
  preview: { width: '100%', height: 200 },
  doneBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  doneTitle: { fontSize: 20, fontWeight: '800', color: '#059669' },
  doneSub: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
})
