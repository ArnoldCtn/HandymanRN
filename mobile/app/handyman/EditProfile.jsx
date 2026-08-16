import {
  Alert, Image, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, StyleSheet, Text,
  TouchableOpacity, View, ActivityIndicator
} from 'react-native'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import Ionicons from '@expo/vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import handymanApi from '@/services/handymanApi'
import useHandymanGlobal from '@/services/handymanGlobal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Toast from '@/components/Toast'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/use-theme-color'

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
  const { t } = useTranslation()
  const theme = useAppTheme()
  const router         = useRouter()
  const handyman       = useHandymanGlobal(s => s.handyman)
  const updateHandyman = useHandymanGlobal(s => s.updateHandyman)

  const insets = useSafeAreaInsets()

  const [username,       setUsername]       = useState(handyman?.username ?? '')
  const [email,          setEmail]          = useState(handyman?.email ?? '')
  const [phone,          setPhone]          = useState(handyman?.phone ?? '')
  const [birthDate,      setBirthDate]      = useState(handyman?.birth_date ?? '')
  const [gender,         setGender]         = useState(handyman?.gender ?? 'male')
  const [bio,            setBio]            = useState(handyman?.bio ?? '')
  const [password,       setPassword]       = useState('')
  const [showPassword,   setShowPassword]   = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)

  const [services,     setServices]    = useState([])
  const [categories,   setCategories]  = useState([])
  const [locations,    setLocations]   = useState([])
  const [selServices,  setSelServices] = useState(
    handyman?.services?.map(s => s.id ?? s) ?? []
  )
  const [selCategories,setSelCategories] = useState(
    handyman?.categories?.map(c => c.id ?? c) ?? []
  )
  
  // Robustly determine initial location ID
  const initialLocation = useMemo(() => {
    if (handyman?.location) {
      return typeof handyman.location === 'object' ? handyman.location.id : handyman.location;
    }
    return null;
  }, [handyman?.location]);

  const [selLocation, setSelLocation] = useState(initialLocation);
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
    if (thumbnail.startsWith('http')) return thumbnail
    return thumbnail
  }
  const displayAvatar = profilePicture ?? resolveAvatar(handyman?.thumbnail)

  useEffect(() => {
    async function load() {
      try {
        const [sRes, cRes, lRes] = await Promise.all([
          handymanApi.get('/handymen/services/'),
          handymanApi.get('/services/categories/'),
          handymanApi.get('/handymen/locations/'),
        ])
        setServices(sRes.data)
        setCategories(cRes.data)
        setLocations(lRes.data)
      } catch (e) {
        console.log('[EditProfile] load options error:', e.message)
        showToast(t('common.error'), 'error')
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [])

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert(t('auth.permission_needed')); return }
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
  
  const updateData = {};
  if (username !== handyman?.username) updateData.username = username;
  if (email !== handyman?.email) updateData.email = email;
  if (phone !== handyman?.phone) updateData.phone = phone;
  if (birthDate !== handyman?.birth_date) updateData.birth_date = birthDate;
  if (gender !== handyman?.gender) updateData.gender = gender;
  if (bio !== handyman?.bio) updateData.bio = bio;
  if (password) updateData.password = password;

  if (selLocation != null) {
    updateData.location = String(selLocation);
  }

  updateData.availability = JSON.stringify(availability);
  updateData.services = selServices;
  updateData.categories = selCategories;

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
    const response = await handymanApi.patch('/handymen/me/update/', updateData, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    updateHandyman(response.data);
    await AsyncStorage.setItem('handyman', JSON.stringify(response.data));
    showToast(t('common.success'), 'success');
    setTimeout(() => router.back(), 1500);

  } catch (e) {
    console.error('Full Save Error:', e);
    showToast(t('common.error'), 'error');
  } finally {
    setLoading(false);
  }
}

  const styles = createStyles(theme);

  if (fetching) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.root, { paddingTop: insets.top }]}>
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

          <Input title={t('auth.username')} value={username} setValue={setUsername}
            error="" setError={() => {}} />
          <Input title={t('auth.email')} value={email} setValue={setEmail}
            error="" setError={() => {}} keyboardType="email-address" />
          <Input title={t('handyman_profile.contact')} value={phone} setValue={setPhone}
            error="" setError={() => {}}
            keyboardType="phone-pad" maxLength={9} />
          <Input title={t('handyman_profile.about')} value={bio} setValue={setBio}
            error="" setError={() => {}} multiline numberOfLines={3} />

          <Input title={t('handyman_profile.birth_date', 'Birth Date (YYYY-MM-DD)')} value={birthDate} setValue={setBirthDate}
            error="" setError={() => {}} placeholder="1990-01-01" />

          <Text style={styles.sectionTitle}>{t('handyman_profile.gender', 'Gender')}</Text>
          <View style={styles.chipGrid}>
            {['male', 'female'].map(g => {
              const selected = gender === g
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, selected && styles.chipActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                    {g === 'male' ? t('handyman_profile.male', 'Male') : t('handyman_profile.female', 'Female')}
                  </Text>
                  {selected && <Ionicons name="checkmark" size={13} color="white" />}
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={{ position:'relative' }}>
            <Input title={t('auth.password_placeholder')}
              value={password} setValue={setPassword}
              secureTextEntry={!showPassword} error="" setError={() => {}} />
            <TouchableOpacity style={styles.eye}
              onPress={() => setShowPassword(s => !s)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>{t('handyman_profile.services')}</Text>
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

          <Text style={styles.sectionTitle}>{t('handyman_profile.categories', 'Categories')}</Text>
          {services
            .filter(service => selServices.includes(service.id))
            .map(service => {
              const serviceCategories = categories.filter(c => c.service === service.id || c.service_id === service.id)
              return (
                <View key={service.id} style={{ marginBottom: 12, width: '100%' }}>
                  <Text style={[styles.serviceLabel, { color: theme.text }]}>
                    {service.name}
                  </Text>
                  <View style={styles.chipGrid}>
                    {serviceCategories.map(cat => {
                      const selected = selCategories.includes(cat.id)
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[styles.chip, selected && styles.chipActive]}
                          onPress={() => {
                            setSelCategories(prev =>
                              prev.includes(cat.id) ? prev.filter(x => x !== cat.id) : [...prev, cat.id]
                            )
                          }}
                        >
                          <Ionicons name="pricetag-outline" size={13}
                            color={selected ? 'white' : theme.textSecondary} />
                          <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                            {cat.name}
                          </Text>
                          {selected && <Ionicons name="checkmark" size={13} color="white" />}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              )
            })}

          <Text style={styles.sectionTitle}>{t('handyman_profile.location')}</Text>
          <View style={styles.chipGrid}>
            {locations.map(l => {
              // Convert both to string to ensure reliable comparison
              const selected = String(selLocation) === String(l.id)

              return (
                <TouchableOpacity
                  key={l.id}
                  style={[
                    styles.chip, 
                    selected && styles.locationChipActive
                  ]}
                  onPress={() => setSelLocation(l.id)}
                >
                  <Ionicons 
                    name="location-outline" 
                    size={13} 
                    color={selected ? 'white' : theme.textSecondary} 
                  />
                  <Text style={[
                    styles.chipText, 
                    selected && styles.locationChipTextActive
                  ]}>
                    {l.location}
                  </Text>
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

          <Text style={styles.sectionTitle}>{t('handyman_profile.availability')}</Text>
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
                        color={active ? 'white' : theme.textSecondary} />
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
  root:              { flex:1, backgroundColor: theme.background },
  header:            { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical: 15,
    marginTop: 10, borderBottomWidth:1, borderColor: theme.border, backgroundColor: theme.surface },
  headerTitle:       { fontSize:18, fontWeight:'700', color: theme.text },
  scroll:            { paddingHorizontal:16, paddingTop:20, paddingBottom:60 },
  avatarWrapper:     { alignSelf:'center', position:'relative', marginBottom:24 },
  avatar:            { width:100, height:100, borderRadius:50, borderWidth: 3, borderColor: theme.surface },
  avatarPlaceholder: { backgroundColor: theme.primary, alignItems:'center', justifyContent:'center' },
  avatarInitial:     { color:'white', fontSize:34, fontWeight:'bold' },
  cameraBtn:         { position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:14, backgroundColor: theme.primary, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor: theme.surface },
  eye:               { position:'absolute', right:16, top:40, padding:4 },
  sectionTitle:      { fontSize:15, fontWeight:'700', color: theme.text, marginTop:20, marginBottom:10 },
  serviceLabel:      { fontSize:13, fontWeight:'600', marginBottom:6, marginTop:4 },
  chipGrid:          { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8 },
  chip:              { flexDirection:'row', alignItems:'center', gap:5, paddingVertical:7, paddingHorizontal:12, borderRadius:20, borderWidth:1.5, borderColor: theme.border, backgroundColor: theme.surface },
  chipActive:        { backgroundColor: theme.primary, borderColor: theme.primary },
  chipText:          { fontSize:12, color: theme.text, fontWeight:'500' },
  chipTextActive:    { color:'white', fontWeight:'700' },
  dayRow:            { marginBottom:12 },
  dayLabel:          { fontSize:13, fontWeight:'700', color: theme.text, marginBottom:6 },
  shiftRow:          { flexDirection:'row', flexWrap:'wrap', gap:6 },
  shiftBtn:          { flexDirection:'row', alignItems:'center', gap:4, paddingVertical:5, paddingHorizontal:10, borderRadius:14, borderWidth:1.5, borderColor: theme.border, backgroundColor: theme.surface },
  shiftBtnActive:    { backgroundColor: theme.primary, borderColor: theme.primary },
  shiftText:         { fontSize:11, color: theme.textSecondary, fontWeight:'500' },
  shiftTextActive:   { color:'white', fontWeight:'700' },
  locationChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  locationChipTextActive: {
    color: 'white',
    fontWeight: '700',
  },
})
