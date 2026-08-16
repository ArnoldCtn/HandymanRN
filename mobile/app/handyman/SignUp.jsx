import {
  Alert, Image, Keyboard, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, StyleSheet, Text,
  TouchableOpacity, TouchableWithoutFeedback,
  View, ActivityIndicator, FlatList
} from 'react-native'
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import Ionicons from '@expo/vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Title from '@/components/Title'
import Input from '@/components/Input'
import Button from '@/components/Button'
import handymanApi from '@/services/handymanApi'
import useHandymanGlobal from '@/services/handymanGlobal'
import favicon from '@/assets/images/FullLogo.jpg'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/use-theme-color'
import { useToast } from '@/hooks/useToast'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'


// ── Constants ────────────────────────────────────────────
const DAYS = [
  { key: 'monday',    label: 'Mon' },
  { key: 'tuesday',   label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday',  label: 'Thu' },
  { key: 'friday',    label: 'Fri' },
  { key: 'saturday',  label: 'Sat' },
  { key: 'sunday',    label: 'Sun' },
]

const SHIFTS = [
  { key: 'morning',   label: 'Morning',   sub: '6 AM – 12 PM', icon: 'sunny-outline' },
  { key: 'afternoon', label: 'Afternoon', sub: '12 PM – 6 PM', icon: 'partly-sunny-outline' },
  { key: 'evening',   label: 'Evening',   sub: '6 PM – 10 PM', icon: 'moon-outline' },
  { key: 'full_day',  label: 'Full Day',  sub: '6 AM – 10 PM', icon: 'calendar-outline' },
]

function DismissKeyboard({ children }) {
  if (Platform.OS === 'web') return <>{children}</>
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {children}
    </TouchableWithoutFeedback>
  )
}

// ── Step indicator ────────────────────────────────────────
function StepBar({ step, theme }) {
  return (
    <View style={styles.stepBar}>
      {[1, 2].map(n => (
        <View key={n} style={styles.stepRow}>
          <View style={[styles.stepCircle, { backgroundColor: theme.border }, step >= n && { backgroundColor: theme.accent }]}>
            {step > n
              ? <Ionicons name="checkmark" size={14} color="white" />
              : <Text style={[styles.stepNum, step >= n && styles.stepNumActive]}>{n}</Text>
            }
          </View>
          {n < 2 && (
            <View style={[styles.stepLine, { backgroundColor: theme.border }, step > n && { backgroundColor: theme.accent }]} />
          )}
        </View>
      ))}
    </View>
  )
}

export default function HandymanSignUpScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const router = useRouter()
  const login  = useHandymanGlobal(s => s.login)

  // ── Step state ────────────────────────────────────────
  const [step, setStep] = useState(1)

  // ── Step 1 fields ─────────────────────────────────────
  const [username,       setUsername]       = useState('')
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [phone,          setPhone]          = useState('')
  const [birthDate,      setBirthDate]      = useState(() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 25)
    return d
  })
  const [showBirthPicker, setShowBirthPicker] = useState(false)
  const [gender,         setGender]         = useState('male')
  const [showPassword,   setShowPassword]   = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)

  const [usernameError, setUsernameError] = useState('')
  const [emailError,    setEmailError]    = useState('')
  const [passwordError, setPasswordError] = useState('')

  // ── Step 2 fields ─────────────────────────────────────
  const [services,     setServices]   = useState([])      // all available
  const [categories,   setCategories] = useState([])      // all available categories
  const [locations,    setLocations]  = useState([])      // all available
  const [selServices,  setSelServices] = useState([])     // selected IDs
  const [selCategories,setSelCategories] = useState([])   // selected category IDs
  const [selLocation,  setSelLocation] = useState(null)   // selected ID
  const [availability, setAvailability] = useState(
    Object.fromEntries(DAYS.map(d => [d.key, []]))
  )

  const [loading,  setLoading]  = useState(false)
  const [fetching, setFetching] = useState(false)

  const insets = useSafeAreaInsets()
  const showToast = useToast()

  useEffect(() => {
    if (step === 2) loadOptions()
  }, [step])

  async function loadOptions() {
    setFetching(true)
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
      showToast(t('common.error'), 'error')
    } finally {
      setFetching(false)
    }
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert(t('auth.permission_needed')); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5
    })
    if (!result.canceled) setProfilePicture(result.assets[0].uri)
  }

  function formatBirthDateISO(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  function ageFromBirthDate(d) {
    const today = new Date()
    let age = today.getFullYear() - d.getFullYear()
    const m = today.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1
    return age
  }

  function validateStep1() {
    let ok = true
    setUsernameError('')
    setEmailError('')
    setPasswordError('')
    
    if (!username.trim()) { setUsernameError(t('auth.username_required')); ok = false }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(t('auth.email_invalid')); ok = false
    }
    if (!password || password.length < 6) {
      setPasswordError(t('auth.password_too_short')); ok = false
    }
    if (ageFromBirthDate(birthDate) < 18) {
      showToast(t('auth.age_limit_error', 'You must be at least 18 years old.'), 'error')
      ok = false
    }
    return ok
  }

  function goToStep2() {
    if (!validateStep1()) return
    setStep(2)
  }

  function toggleService(id) {
    setSelServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  function toggleShift(day, shift) {
    setAvailability(prev => {
      const current = prev[day] ?? []
      const updated = current.includes(shift)
        ? current.filter(s => s !== shift)
        : [...current, shift]
      return { ...prev, [day]: updated }
    })
  }

  async function onSubmit() {
    if (selServices.length === 0) {
      showToast(t('auth.select_service_error'), 'error'); return
    }
    if (!selLocation) {
      showToast(t('auth.select_location_error'), 'error'); return
    }

    const hasAvailability = Object.values(availability).some(v => v.length > 0)
    if (!hasAvailability) {
      showToast(t('auth.set_availability_error'), 'error'); return
    }

    setLoading(true)

    let base64Image = null
    if (profilePicture) {
      try {
        const imgResponse = await fetch(profilePicture)
        const blob = await imgResponse.blob()
        base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      } catch (imgErr) {
        console.log('Failed to convert image to base64:', imgErr.message)
      }
    }

    const signupData = {
      username:     username.trim().toLowerCase(),
      email:        email.trim().toLowerCase(),
      password:     password,
      phone:        phone,
      birth_date:   formatBirthDateISO(birthDate),
      gender:       gender,
      location:     selLocation,
      availability: JSON.stringify(availability),
      services:     selServices,
      categories:   selCategories
    }
    if (base64Image) {
      signupData.thumbnail = base64Image
    }

    try {
      const response = await handymanApi({
        method:  'POST',
        url:     '/handymen/signup/',
        data:    signupData,
        headers: { 'Content-Type': 'application/json' },
      })

      const { tokens, handyman } = response.data
      await AsyncStorage.setItem('handyman_access_token',  tokens.access)
      await AsyncStorage.setItem('handyman_refresh_token', tokens.refresh)
      await AsyncStorage.setItem('handyman', JSON.stringify(handyman))

      showToast(t('auth.account_created'), 'success')
      login(handyman)
      setTimeout(() => router.replace('/handyman/Home'), 1200)

    } catch (error) {
      const data = error.response?.data
      console.log('handyman signup error data:', data)

      if (data) {
        if (data.username) {
           setUsernameError(data.username[0])
           setStep(1)
        }
        if (data.email) {
           setEmailError(data.email[0])
           setStep(1)
        }
        if (data.password) {
           setPasswordError(data.password[0])
           setStep(1)
        }
        
        const firstKey = Object.keys(data)[0]
        const firstError = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]
        showToast(firstError || t('auth.signup_failed'), 'error')
      } else {
        showToast(error.message ?? t('auth.connection_error'), 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <ThemedView style={{ flex: 1 }}>
      <ScrollView>
      <DismissKeyboard>
        <SafeAreaView style={{ flex: 1, paddingTop: insets.top }}>
            <View>
                 <Image source={favicon} alt="" style={{alignSelf:'center',padding:10, height:250,width:'100%'}} />
            </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled">

          <ThemedText type="title" style={{textAlign:'center',marginBottom:20}}>{t('auth.sign_up_pro', 'Sign Up as a Pro')}</ThemedText>
              <StepBar step={1} theme={theme} />
              <ThemedText type="subtitle" style={styles.stepTitle}>{t('auth.basic_info', 'Basic Information')}</ThemedText>

              <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.background }]}>
                    <Ionicons name="camera-outline" size={28} color={theme.textSecondary} />
                    <ThemedText type="secondary" style={styles.avatarHint}>{t('auth.add_photo', 'Add Photo')}</ThemedText>
                  </View>
                )}
                <View style={styles.avatarBadge}>
                  <Ionicons name="camera" size={13} color="white" />
                </View>
              </TouchableOpacity>

              <Input 
                title={t('auth.username')} 
                placeholder={t('auth.username_placeholder')}
                value={username}
                setValue={setUsername} 
                error={usernameError}
                setError={setUsernameError} 
              />

              <Input 
                title={t('auth.email')} 
                placeholder={t('auth.email_placeholder')}
                value={email}
                setValue={setEmail} 
                error={emailError}
                setError={setEmailError} 
              />

              <View style={{ position: 'relative' }}>
                <Input 
                  title={t('auth.password')} 
                  placeholder={t('auth.password_placeholder')}
                  value={password}
                  setValue={setPassword} 
                  error={passwordError}
                  setError={setPasswordError}
                  secureTextEntry={!showPassword} 
                />
                <TouchableOpacity style={styles.eye}
                  onPress={() => setShowPassword(s => !s)}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <Input 
                title={t('handyman_profile.contact')} 
                placeholder="6XX XXX XXX"
                value={phone} 
                maxLength={9} 
                keyboardType="phone-pad"
                setValue={setPhone} 
                error="" 
                setError={() => {}} 
              />
              <ThemedText type="secondary" style={{fontSize:12}}>{t('auth.phone_hint', 'Should be your MTN or OM number')}</ThemedText>

              <ThemedText style={styles.fieldLabel}>{t('handyman_profile.birth_date', 'Date of birth')}</ThemedText>
              <TouchableOpacity
                style={[styles.dateBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setShowBirthPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                <ThemedText style={styles.dateBtnText}>{formatBirthDateISO(birthDate)}</ThemedText>
              </TouchableOpacity>
              {showBirthPicker && (
                <DateTimePicker
                  value={birthDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_, selected) => {
                    setShowBirthPicker(Platform.OS === 'ios')
                    if (selected) setBirthDate(selected)
                  }}
                />
              )}

              <ThemedText style={styles.fieldLabel}>{t('handyman_profile.gender', 'Gender')}</ThemedText>
              <View style={styles.genderRow}>
                {['male', 'female'].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, { backgroundColor: theme.surface, borderColor: theme.border }, gender === g && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderChipText, { color: theme.textSecondary }, gender === g && styles.genderChipTextActive]}>
                      {g === 'male' ? t('handyman_profile.male', 'Male') : t('handyman_profile.female', 'Female')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button title={t('common.next') + " →"} onPress={goToStep2} />

              <ThemedText style={styles.signinLink}>
                {t('auth.already_have_account')}
                <ThemedText style={{ color: theme.accent }}
                  onPress={() => router.push('/handyman/SignIn')}>
                  {t('auth.sign_in')}
                </ThemedText>
              </ThemedText>
              <ThemedText style={styles.signinLink}>
                {t('auth.create_client_account', 'Create a Client Account? ')}
                <ThemedText style={{ color: theme.primary }}
                  onPress={() => router.push('/SignUp')}>
                  {t('auth.sign_up')}
                </ThemedText>
              </ThemedText>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </DismissKeyboard>
      </ScrollView>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1, paddingTop: insets.top + 20 }}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => setStep(1)} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{t('auth.complete_profile', 'Complete Your Profile')}</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <StepBar step={2} theme={theme} />

      {fetching ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll2}
          showsVerticalScrollIndicator={false}>

          <ThemedText style={styles.sectionTitle}>
            {t('handyman_profile.services')}
            <ThemedText type="secondary" style={styles.sectionSub}> ({t('auth.select_all_apply', 'select all that apply')})</ThemedText>
          </ThemedText>
          <View style={styles.chipGrid}>
            {services.map(s => {
              const selected = selServices.includes(s.id)
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }, selected && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  onPress={() => toggleService(s.id)}
                >
                  {s.image ? (
                    <Image source={{ uri: s.image }}
                      style={styles.chipImage} />
                  ) : (
                    <Ionicons name="construct-outline" size={16}
                      color={selected ? 'white' : theme.textSecondary} />
                  )}
                  <Text style={[styles.chipText, { color: theme.text }, selected && styles.chipTextSelected]}>
                    {s.name}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Categories Section - Dynamic based on selected services */}
          {selServices.length > 0 && (
            <>
              <ThemedText style={[styles.sectionTitle, { marginTop: 24 }]}>
                {t('handyman_profile.categories', 'Categories')}
                <ThemedText type="secondary" style={styles.sectionSub}> ({t('auth.select_all_apply', 'select all that apply')})</ThemedText>
              </ThemedText>
              
              {/* Group categories by service */}
              {services
                .filter(service => selServices.includes(service.id))
                .map(service => {
                  const serviceCategories = categories.filter(c => c.service === service.id || c.service_id === service.id)
                  return (
                    <View key={service.id} style={{ marginBottom: 16, width: '100%' }}>
                      <ThemedText type="default" style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: theme.text }}>
                        {service.name}
                      </ThemedText>
                      <View style={styles.chipGrid}>
                        {serviceCategories.map(cat => {
                          const selected = selCategories.includes(cat.id)
                          return (
                            <TouchableOpacity
                              key={cat.id}
                              style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }, selected && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                              onPress={() => {
                                setSelCategories(prev =>
                                  prev.includes(cat.id) ? prev.filter(x => x !== cat.id) : [...prev, cat.id]
                                )
                              }}
                            >
                              <Ionicons name="pricetag-outline" size={16}
                                color={selected ? 'white' : theme.textSecondary} />
                              <Text style={[styles.chipText, { color: theme.text }, selected && styles.chipTextSelected]}>
                                {cat.name}
                              </Text>
                              {selected && (
                                <Ionicons name="checkmark-circle" size={16} color="white" />
                              )}
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                    </View>
                  )
                })}
            </>
          )}

          <ThemedText style={[styles.sectionTitle, { marginTop: 24 }]}>
            {t('handyman_profile.location')}
            <ThemedText type="secondary" style={styles.sectionSub}> ({t('auth.select_one', 'select one')})</ThemedText>
          </ThemedText>
          <View style={styles.chipGrid}>
            {locations.map(l => {
              const selected = selLocation === l.id
              return (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }, selected && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  onPress={() => setSelLocation(l.id)}
                >
                  <Ionicons name="location-outline" size={16}
                    color={selected ? 'white' : theme.textSecondary} />
                  <Text style={[styles.chipText, { color: theme.text }, selected && styles.chipTextSelected]}>
                    {l.location}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          <ThemedText style={[styles.sectionTitle, { marginTop: 24 }]}>
            {t('handyman_profile.availability')}
            <ThemedText type="secondary" style={styles.sectionSub}> ({t('auth.days_shifts', 'days + shifts')})</ThemedText>
          </ThemedText>

          {DAYS.map(day => (
            <View key={day.key} style={styles.dayRow}>
              <ThemedText style={styles.dayLabel}>{day.label}</ThemedText>
              <View style={styles.shiftRow}>
                {SHIFTS.map(shift => {
                  const active = availability[day.key]?.includes(shift.key)
                  return (
                    <TouchableOpacity
                      key={shift.key}
                      style={[styles.shiftBtn, { backgroundColor: theme.surface, borderColor: theme.border }, active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                      onPress={() => toggleShift(day.key, shift.key)}
                    >
                      <Ionicons
                        name={shift.icon}
                        size={14}
                        color={active ? 'white' : theme.textSecondary}
                      />
                      <Text style={[styles.shiftText, { color: theme.textSecondary }, active && styles.shiftTextActive]}>
                        {shift.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}

          <View style={[styles.legendBox, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
            {SHIFTS.map(s => (
              <View key={s.key} style={styles.legendRow}>
                <Ionicons name={s.icon} size={14} color={theme.accent} />
                <ThemedText type="secondary" style={styles.legendText}>
                  {s.label}: <ThemedText type="secondary" style={{ opacity: 0.7 }}>{s.sub}</ThemedText>
                </ThemedText>
              </View>
            ))}
          </View>

          {loading
            ? <ActivityIndicator size="large" color={theme.primary}
                style={{ marginTop: 24 }} />
            : <Button title={t('auth.create_account', 'Create Account')} onPress={onSubmit} />
          }

          <View style={{ height: 40 }} />

        </ScrollView>
      )}
    </SafeAreaView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  scroll:       { flexGrow:1, paddingHorizontal:24, paddingTop:20, paddingBottom:32 },
  scroll2:      { paddingHorizontal:16, paddingTop:8, paddingBottom:32 },
  stepBar:       { flexDirection:'row', alignItems:'center', justifyContent:'center', marginVertical:16 },
  stepRow:       { flexDirection:'row', alignItems:'center' },
  stepCircle:    { width:32, height:32, borderRadius:16, alignItems:'center', justifyContent:'center' },
  stepNum:       { fontSize:14, fontWeight:'700', color:'#9ca3af' },
  stepNumActive: { color:'white' },
  stepLine:      { width:48, height:2, marginHorizontal:4 },
  stepTitle:     { fontSize:18, fontWeight:'700', textAlign:'center', marginBottom:20 },
  avatarPicker:     { alignSelf:'center', position:'relative', marginBottom:24 },
  avatar:           { width:100, height:100, borderRadius:50 },
  avatarPlaceholder:{ width:100, height:100, borderRadius:50, alignItems:'center', justifyContent:'center', borderWidth:1.5, borderStyle:'dashed' },
  avatarHint:       { fontSize:11, marginTop:4 },
  avatarBadge:      { position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:13, backgroundColor:'#6366F1', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'white' },
  eye:           { position:'absolute', right:16, top:40, padding:4 },
  signinLink:    { textAlign:'center', marginTop:16, fontSize:13 },
  fieldLabel:    { fontSize:14, fontWeight:'600', marginTop:12, marginBottom:6 },
  dateBtn:       { flexDirection:'row', alignItems:'center', gap:10, padding:14, borderWidth:1, borderRadius:10 },
  dateBtnText:   { fontSize:15 },
  genderRow:     { flexDirection:'row', gap:10, marginBottom:8 },
  genderChip:    { flex:1, paddingVertical:12, borderRadius:10, borderWidth:1.5, alignItems:'center' },
  genderChipText: { fontSize:14, fontWeight:'600' },
  genderChipTextActive: { color:'white' },
  header:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:15, borderBottomWidth:1 },
  headerTitle:   { fontSize:16, fontWeight:'700' },
  sectionTitle:  { fontSize:16, fontWeight:'700', marginBottom:10 },
  sectionSub:    { fontSize:12, fontWeight:'400' },
  chipGrid:      { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:          { flexDirection:'row', alignItems:'center', gap:6, paddingVertical:8, paddingHorizontal:12, borderRadius:20, borderWidth:1.5 },
  chipText:      { fontSize:13, fontWeight:'500' },
  chipTextSelected: { color:'white', fontWeight:'700' },
  chipImage:     { width:18, height:18, borderRadius:4 },
  dayRow:        { marginBottom:14 },
  dayLabel:      { fontSize:14, fontWeight:'700', marginBottom:6 },
  shiftRow:      { flexDirection:'row', flexWrap:'wrap', gap:6 },
  shiftBtn:      { flexDirection:'row', alignItems:'center', gap:4, paddingVertical:6, paddingHorizontal:10, borderRadius:16, borderWidth:1.5 },
  shiftText:     { fontSize:11, fontWeight:'500' },
  shiftTextActive:{ color:'white', fontWeight:'700' },
  legendBox:     { borderRadius:10, padding:12, marginVertical:16, gap:6 },
  legendRow:     { flexDirection:'row', alignItems:'center', gap:8 },
  legendText:    { fontSize:12, fontWeight:'500' },
})
