import {
  Alert, Image, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, ActivityIndicator
} from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import Ionicons from '@expo/vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import handymanApi from '@/services/handymanApi'
import useHandymanGlobal from '@/services/handymanGlobal'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Toast from '@/components/Toast'

const DAYS = [
  { key:'monday', label:'Mon' }, { key:'tuesday', label:'Tue' },
  { key:'wednesday', label:'Wed' }, { key:'thursday', label:'Thu' },
  { key:'friday', label:'Fri' }, { key:'saturday', label:'Sat' },
  { key:'sunday', label:'Sun' },
]
const SHIFTS = [
  { key:'morning',   label:'Morning',   icon:'sunny-outline' },
  { key:'afternoon', label:'Afternoon', icon:'partly-sunny-outline' },
  { key:'evening',   label:'Evening',   icon:'moon-outline' },
  { key:'full_day',  label:'Full Day',  icon:'calendar-outline' },
  { key:'flexible',  label:'Flexible',  icon:'time-outline' },
]

export default function HandymanEditProfileScreen() {
  const router         = useRouter()
  const handyman       = useHandymanGlobal(s => s.handyman)
  const updateHandyman = useHandymanGlobal(s => s.updateHandyman)

  const [username,       setUsername]       = useState(handyman?.username ?? '')
  const [email,          setEmail]          = useState(handyman?.email ?? '')
  const [phone,          setPhone]          = useState(handyman?.phone ?? '')
  const [bio,            setBio]            = useState(handyman?.bio ?? '')
  const [password,       setPassword]       = useState('')
  const [showPassword,   setShowPassword]   = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)

  const [services,     setServices]    = useState([])
  const [locations,    setLocations]   = useState([])
  const [selServices,  setSelServices] = useState(
    handyman?.services?.map(s => s.id ?? s) ?? []
  )
  const [selLocation, setSelLocation] = useState(
    handyman?.location?.id ?? handyman?.location ?? null
  )
  const [availability, setAvailability] = useState(
    handyman?.availability ?? Object.fromEntries(DAYS.map(d => [d.key, []]))
  )

  const [loading,  setLoading]  = useState(false)
  const [fetching, setFetching] = useState(true)
  const [toast,    setToast]    = useState({ visible:false, message:'', type:'success' })

  function showToast(msg, type = 'success') {
    setToast({ visible:true, message:msg, type })
  }

  function resolveAvatar(thumbnail) {
    if (!thumbnail) return null
    // Backend already returns full URLs, use them directly
    if (thumbnail.startsWith('http')) return thumbnail
    // Fallback for any relative URLs
    return `http://192.168.43.188:8000/media/${thumbnail}`
  }
  const displayAvatar = profilePicture ?? resolveAvatar(handyman?.thumbnail)

  useEffect(() => {
    async function load() {
      try {
        const [sRes, lRes] = await Promise.all([
          handymanApi.get('/handymen/services/'),
          handymanApi.get('/handymen/locations/'),
        ])
        setServices(sRes.data)
        setLocations(lRes.data)
      } catch (e) {
        const errMsg = e.response?.data
        ? JSON.stringify(e.response.data)   // show full error for debugging
        : e.message

        console.log('[EditProfile] load options error:', e.message)
        showToast('Could not load options: Try Again Later', 'error')
        console.log('sooo:',errMsg)
        
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [])

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission needed'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect:[1,1], quality:0.5
    })
    if (!result.canceled) setProfilePicture(result.assets[0].uri)
  }

  function toggleService(id) {
    setSelServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  function toggleShift(day, shift) {
    setAvailability(prev => {
      const current = prev[day] ?? []
      return {
        ...prev,
        [day]: current.includes(shift)
          ? current.filter(s => s !== shift)
          : [...current, shift]
      }
    })
  }

  async function onSave() {
  setLoading(true);
  
  // Pure JSON approach with base64 image support
  const updateData = {};

  if (username !== handyman?.username) updateData.username = username;
  if (email !== handyman?.email) updateData.email = email;
  if (phone !== handyman?.phone) updateData.phone = phone;
  if (bio !== handyman?.bio) updateData.bio = bio;
  if (password) updateData.password = password;

  // Location - Send as string
  if (selLocation != null) {
    updateData.location = String(selLocation);
  }

  updateData.availability = JSON.stringify(availability);
  // Send services as array of IDs
  updateData.services = selServices;

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
    const response = await handymanApi.patch('/handymen/me/update/', updateData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Update Success:', response.data);

    updateHandyman(response.data);
    await AsyncStorage.setItem('handyman', JSON.stringify(response.data));

    showToast('Profile updated successfully!', 'success');
    setTimeout(() => router.back(), 1500);

  } catch (e) {
    // Better error logging for network errors
    console.error('Full Save Error:', e);
    console.error('Error code:', e.code);
    console.error('Error message:', e.message);
    console.error('Is network error:', e.code === 'NETWORK_ERROR');
    
    if (e.code === 'NETWORK_ERROR' || e.message === 'Network Error') {
      showToast('Cannot reach server. Check network connection.', 'error');
    } else {
      const msg = e.response?.data ? JSON.stringify(e.response.data) : e.message;
      showToast(msg || 'Failed to update profile', 'error');
    }
    console.log('msg:', e.response?.data || e.message);
  } finally {
    setLoading(false);
  }
}

  if (fetching) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    )
  }

  return (
    // ✅ No TouchableWithoutFeedback — edit screens need free typing
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

      {/*
        ✅ No KeyboardAvoidingView wrapping chip/shift buttons
        Use ScrollView with keyboardShouldPersistTaps="handled"
        This stops the keyboard from closing when tapping chips/shifts
        and prevents the view from jumping
      */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"   // ← key fix for non-input taps
        keyboardDismissMode="on-drag"         // ← keyboard hides only when dragging
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {handyman?.username?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
            <Ionicons name="camera" size={14} color="white" />
          </TouchableOpacity>
        </View>

        {/*
          ✅ Each Input is standalone — no wrapping KeyboardAvoidingView
          This stops focus from being stolen between keystrokes
        */}
        <Input title="Username" value={username} setValue={setUsername}
          error="" setError={() => {}} />
        <Input title="Email" value={email} setValue={setEmail}
          error="" setError={() => {}} keyboardType="email-address" />
        <Input title="Phone" value={phone} setValue={setPhone}
          error="" setError={() => {}}
          keyboardType="phone-pad" maxLength={9} />
        <Input title="Bio" value={bio} setValue={setBio}
          error="" setError={() => {}} multiline numberOfLines={3} />

          {/* <Text>
            {handyman?.username} && 
            {handyman?.location} &&
            {selLocation}
          </Text> */}

        <View style={{ position:'relative' }}>
          <Input title="New Password (leave blank to keep)"
            value={password} setValue={setPassword}
            secureTextEntry={!showPassword} error="" setError={() => {}} />
          <TouchableOpacity style={styles.eye}
            onPress={() => setShowPassword(s => !s)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={22} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Services — chips don't steal focus */}
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.chipGrid}>
          {services.map(s => {
            const selected = selServices.includes(s.id)
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.chip, selected && styles.chipActive]}
                onPress={() => toggleService(s.id)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {s.name}
                </Text>
                {selected && <Ionicons name="checkmark" size={13} color="white" />}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Location */}
<Text style={styles.sectionTitle}>Location</Text>
<View style={styles.chipGrid}>
  {locations.map(l => {
    const selected = selLocation === l.id     // Changed to compare with l.id (more reliable)

    return (
      <TouchableOpacity
        key={l.id}
        style={[
          styles.chip, 
          selected && styles.locationChipActive   // New active style
        ]}
        onPress={() => setSelLocation(l.id)}
      >
        <Ionicons 
          name="location-outline" 
          size={13} 
          color={selected ? 'white' : '#6b7280'} 
        />
        <Text style={[
          styles.chipText, 
          selected && styles.locationChipTextActive
        ]}>
          {l.location}
        </Text>

        {/* Show tick only when selected */}
        {selected && (
          <Ionicons 
            name="checkmark" 
            size={14} 
            color="white" 
            style={{ marginLeft: 4 }}
          />
        )}
      </TouchableOpacity>
    )
  })}
</View>

        {/* Availability */}
        <Text style={styles.sectionTitle}>Availability</Text>
        {DAYS.map(day => (
          <View key={day.key} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{day.label}</Text>
            <View style={styles.shiftRow}>
              {SHIFTS.map(shift => {
                const active = availability[day.key]?.includes(shift.key)
                return (
                  <TouchableOpacity
                    key={shift.key}
                    style={[styles.shiftBtn, active && styles.shiftBtnActive]}
                    onPress={() => toggleShift(day.key, shift.key)}
                  >
                    <Ionicons name={shift.icon} size={12}
                      color={active ? 'white' : '#9ca3af'} />
                    <Text style={[styles.shiftText, active && styles.shiftTextActive]}>
                      {shift.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ))}

        {loading
          ? <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop:20 }} />
          : <Button title="Save Changes" onPress={onSave} />
        }

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header:            { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:14, borderBottomWidth:1, borderColor:'#f0f0f0' },
  headerTitle:       { fontSize:18, fontWeight:'700', color:'#202020' },
  scroll:            { paddingHorizontal:16, paddingTop:20, paddingBottom:60 },
  avatarWrapper:     { alignSelf:'center', position:'relative', marginBottom:24 },
  avatar:            { width:100, height:100, borderRadius:50 },
  avatarPlaceholder: { backgroundColor:'#6366F1', alignItems:'center', justifyContent:'center' },
  avatarInitial:     { color:'white', fontSize:34, fontWeight:'bold' },
  cameraBtn:         { position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:14, backgroundColor:'#f59e0b', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'white' },
  eye:               { position:'absolute', right:16, top:40, padding:4 },
  sectionTitle:      { fontSize:15, fontWeight:'700', color:'#202020', marginTop:20, marginBottom:10 },
  chipGrid:          { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8 },
  chip:              { flexDirection:'row', alignItems:'center', gap:5, paddingVertical:7, paddingHorizontal:12, borderRadius:20, borderWidth:1.5, borderColor:'#e5e7eb', backgroundColor:'#f9fafb' },
  chipActive:        { backgroundColor:'#f59e0b', borderColor:'#f59e0b' },
  chipText:          { fontSize:12, color:'#374151', fontWeight:'500' },
  chipTextActive:    { color:'white', fontWeight:'700' },
  dayRow:            { marginBottom:12 },
  dayLabel:          { fontSize:13, fontWeight:'700', color:'#202020', marginBottom:6 },
  shiftRow:          { flexDirection:'row', flexWrap:'wrap', gap:6 },
  shiftBtn:          { flexDirection:'row', alignItems:'center', gap:4, paddingVertical:5, paddingHorizontal:10, borderRadius:14, borderWidth:1.5, borderColor:'#e5e7eb', backgroundColor:'#f9fafb' },
  shiftBtnActive:    { backgroundColor:'#f59e0b', borderColor:'#f59e0b' },
  shiftText:         { fontSize:11, color:'#9ca3af', fontWeight:'500' },
  shiftTextActive:   { color:'white', fontWeight:'700' },
  locationChipActive: {
    backgroundColor: '#3b82f6',     // Nice blue color
    borderColor: '#3b82f6',
  },
  locationChipTextActive: {
    color: 'white',
    fontWeight: '700',
  },
})