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
import Title from '@/components/Title'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Toast from '@/components/Toast'
import handymanApi from '@/services/handymanApi'
import useHandymanGlobal from '@/services/handymanGlobal'
import favicon from '@/assets/images/FullLogo.jpg'


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
function StepBar({ step }) {
  return (
    <View style={styles.stepBar}>
      {[1, 2].map(n => (
        <View key={n} style={styles.stepRow}>
          <View style={[styles.stepCircle, step >= n && styles.stepCircleActive]}>
            {step > n
              ? <Ionicons name="checkmark" size={14} color="white" />
              : <Text style={[styles.stepNum, step >= n && styles.stepNumActive]}>{n}</Text>
            }
          </View>
          {n < 2 && (
            <View style={[styles.stepLine, step > n && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  )
}

export default function HandymanSignUpScreen() {
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
  const [locations,    setLocations]  = useState([])      // all available
  const [selServices,  setSelServices] = useState([])     // selected IDs
  const [selLocation,  setSelLocation] = useState(null)   // selected ID
  const [availability, setAvailability] = useState(
    Object.fromEntries(DAYS.map(d => [d.key, []]))
  )

  const [loading,  setLoading]  = useState(false)
  const [fetching, setFetching] = useState(false)
  const [toast,    setToast]    = useState({ visible:false, message:'', type:'success' })


  function showToast(msg, type = 'success') {
    setToast({ visible:true, message:msg, type })
  }

  useEffect(() => {
    if (step === 2) loadOptions()
  }, [step])

  async function loadOptions() {
    setFetching(true)
    try {
      const [sRes, lRes] = await Promise.all([
        handymanApi.get('/handymen/services/'),
        handymanApi.get('/handymen/locations/'),
      ])
      setServices(sRes.data)
      setLocations(lRes.data)
    } catch (e) {
      showToast('Could not load options. Check connection.', 'error')
    } finally {
      setFetching(false)
    }
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permission needed'); return }
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
    
    if (!username.trim()) { setUsernameError('Username required'); ok = false }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Valid email required'); ok = false
    }
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters'); ok = false
    }
    if (ageFromBirthDate(birthDate) < 18) {
      showToast('You must be at least 18 years old.', 'error')
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
      showToast('Please select at least one service', 'error'); return
    }
    if (!selLocation) {
      showToast('Please select your location', 'error'); return
    }

    const hasAvailability = Object.values(availability).some(v => v.length > 0)
    if (!hasAvailability) {
      showToast('Please set your availability', 'error'); return
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
      services:     selServices
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
      
      // ✅ Update global state
      login(handyman)

      showToast('Account created! Welcome.', 'success')
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
        showToast(firstError || 'Error occurred during sign up', 'error')
      } else {
        showToast(error.message ?? 'Connection error', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <ScrollView>
      <DismissKeyboard>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <Toast visible={toast.visible} message={toast.message}
            type={toast.type}
            onHide={() => setToast(t => ({ ...t, visible: false }))} />

            <View>
                 <Image source={favicon} width={200} height={250} alt="" style={{alignSelf:'center',padding:10, height:'250',width:'100%'}} />
            </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled">

          <Text style={{textAlign:'center',marginBottom:20, fontSize:30,fontWeight:'black',color:'gray'}}>Sign Up Here As a Pro</Text>
              <StepBar step={1} />
              <Text style={styles.stepTitle}>Basic Information</Text>

              <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="camera-outline" size={28} color="#9ca3af" />
                    <Text style={styles.avatarHint}>Add Photo</Text>
                  </View>
                )}
                <View style={styles.avatarBadge}>
                  <Ionicons name="camera" size={13} color="white" />
                </View>
              </TouchableOpacity>

              <Input title="Username" value={username}
                setValue={setUsername} error={usernameError}
                setError={setUsernameError} />

              <Input title="Email" value={email}
                setValue={setEmail} error={emailError}
                setError={setEmailError} />

              <View style={{ position: 'relative' }}>
                <Input title="Password" value={password}
                  setValue={setPassword} error={passwordError}
                  setError={setPasswordError}
                  secureTextEntry={!showPassword} />
                <TouchableOpacity style={styles.eye}
                  onPress={() => setShowPassword(s => !s)}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22} color="gray" />
                </TouchableOpacity>
              </View>

              <Input title="Phone (e.g. +237...)" value={phone} maxLength={9} KeyboardType="phone-pad"
                setValue={setPhone} error="" setError={() => {}} />
                <Text style={{color:'gray',fontWeight:'100',fontSize:12}}>Should be your MTN or OM number</Text>

              <Text style={styles.fieldLabel}>Date of birth</Text>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowBirthPicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                <Text style={styles.dateBtnText}>{formatBirthDateISO(birthDate)}</Text>
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

              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {['male', 'female'].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}>
                      {g === 'male' ? 'Male' : 'Female'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button title="Next →" onPress={goToStep2} />

              <Text style={styles.signinLink} onPress={() => router.push('/handyman/SignIn')}>
                Already have an account?{' '}
                <Text style={{ color: '#f59e0b' }}
                  onPress={() => router.push('/handyman/SignIn')}>
                  Sign In
                </Text>
              </Text>
              <Text style={styles.signinLink} onPress={() => router.push('/SignUp')}>
                Create a Client Account?{' '}
                <Text style={{ color: '#0b17f5' }}
                  onPress={() => router.push('/SignUp')}>
                  Sign In
                </Text>
              </Text>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </DismissKeyboard>
      </ScrollView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff',paddingTop:20 }}>
      <Toast visible={toast.visible} message={toast.message}
        type={toast.type}
        onHide={() => setToast(t => ({ ...t, visible: false }))} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep(1)} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#202020" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <StepBar step={2} />

      {fetching ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#f59e0b" />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll2}
          showsVerticalScrollIndicator={false}>

          <Text style={styles.sectionTitle}>
            Your Services
            <Text style={styles.sectionSub}> (select all that apply)</Text>
          </Text>
          <View style={styles.chipGrid}>
            {services.map(s => {
              const selected = selServices.includes(s.id)
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleService(s.id)}
                >
                  {s.image ? (
                    <Image source={{ uri: s.image }}
                      style={styles.chipImage} />
                  ) : (
                    <Ionicons name="construct-outline" size={16}
                      color={selected ? 'white' : '#6b7280'} />
                  )}
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {s.name}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Your Location
            <Text style={styles.sectionSub}> (select one)</Text>
          </Text>
          <View style={styles.chipGrid}>
            {locations.map(l => {
              const selected = selLocation === l.id
              return (
                <TouchableOpacity
                  key={l.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setSelLocation(l.id)}
                >
                  <Ionicons name="location-outline" size={16}
                    color={selected ? 'white' : '#6b7280'} />
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {l.location}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Availability
            <Text style={styles.sectionSub}> (days + shifts)</Text>
          </Text>

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
                      <Ionicons
                        name={shift.icon}
                        size={14}
                        color={active ? 'white' : '#6b7280'}
                      />
                      <Text style={[styles.shiftText, active && styles.shiftTextActive]}>
                        {shift.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          ))}

          <View style={styles.legendBox}>
            {SHIFTS.map(s => (
              <View key={s.key} style={styles.legendRow}>
                <Ionicons name={s.icon} size={14} color="#f59e0b" />
                <Text style={styles.legendText}>
                  {s.label}: <Text style={{ color: '#9ca3af' }}>{s.sub}</Text>
                </Text>
              </View>
            ))}
          </View>

          {loading
            ? <ActivityIndicator size="large" color="#f59e0b"
                style={{ marginTop: 24 }} />
            : <Button title="Create Account" onPress={onSubmit} />
          }

          <View style={{ height: 40 }} />

        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  scroll:       { flexGrow:1, paddingHorizontal:24, paddingTop:20, paddingBottom:32 },
  scroll2:      { paddingHorizontal:16, paddingTop:8, paddingBottom:32 },
  stepBar:       { flexDirection:'row', alignItems:'center', justifyContent:'center', marginVertical:16 },
  stepRow:       { flexDirection:'row', alignItems:'center' },
  stepCircle:    { width:32, height:32, borderRadius:16, backgroundColor:'#e5e7eb', alignItems:'center', justifyContent:'center' },
  stepCircleActive: { backgroundColor:'#f59e0b' },
  stepNum:       { fontSize:14, fontWeight:'700', color:'#9ca3af' },
  stepNumActive: { color:'white' },
  stepLine:      { width:48, height:2, backgroundColor:'#e5e7eb', marginHorizontal:4 },
  stepLineActive:{ backgroundColor:'#f59e0b' },
  stepTitle:     { fontSize:18, fontWeight:'700', color:'#202020', textAlign:'center', marginBottom:20 },
  avatarPicker:     { alignSelf:'center', position:'relative', marginBottom:24 },
  avatar:           { width:100, height:100, borderRadius:50 },
  avatarPlaceholder:{ width:100, height:100, borderRadius:50, backgroundColor:'#f3f4f6', alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:'#e5e7eb', borderStyle:'dashed' },
  avatarHint:       { color:'#9ca3af', fontSize:11, marginTop:4 },
  avatarBadge:      { position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:13, backgroundColor:'#f59e0b', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'white' },
  eye:           { position:'absolute', right:16, top:40, padding:4 },
  signinLink:    { textAlign:'center', marginTop:16, color:'gray', fontSize:13 },
  fieldLabel:    { fontSize:14, fontWeight:'600', color:'#374151', marginTop:12, marginBottom:6 },
  dateBtn:       { flexDirection:'row', alignItems:'center', gap:10, padding:14, borderWidth:1, borderColor:'#e5e7eb', borderRadius:10, backgroundColor:'#f9fafb' },
  dateBtnText:   { fontSize:15, color:'#202020' },
  genderRow:     { flexDirection:'row', gap:10, marginBottom:8 },
  genderChip:    { flex:1, paddingVertical:12, borderRadius:10, borderWidth:1.5, borderColor:'#e5e7eb', alignItems:'center', backgroundColor:'#f9fafb' },
  genderChipActive: { backgroundColor:'#f59e0b', borderColor:'#f59e0b' },
  genderChipText: { fontSize:14, fontWeight:'600', color:'#6b7280' },
  genderChipTextActive: { color:'white' },
  header:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:15, borderBottomWidth:1, borderColor:'#f0f0f0' },
  headerTitle:   { fontSize:16, fontWeight:'700', color:'#202020' },
  sectionTitle:  { fontSize:16, fontWeight:'700', color:'#202020', marginBottom:10 },
  sectionSub:    { fontSize:12, fontWeight:'400', color:'#9ca3af' },
  chipGrid:      { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:          { flexDirection:'row', alignItems:'center', gap:6, paddingVertical:8, paddingHorizontal:12, borderRadius:20, borderWidth:1.5, borderColor:'#e5e7eb', backgroundColor:'#f9fafb' },
  chipSelected:  { backgroundColor:'#f59e0b', borderColor:'#f59e0b' },
  chipText:      { fontSize:13, color:'#374151', fontWeight:'500' },
  chipTextSelected: { color:'white', fontWeight:'700' },
  chipImage:     { width:18, height:18, borderRadius:4 },
  dayRow:        { marginBottom:14 },
  dayLabel:      { fontSize:14, fontWeight:'700', color:'#202020', marginBottom:6 },
  shiftRow:      { flexDirection:'row', flexWrap:'wrap', gap:6 },
  shiftBtn:      { flexDirection:'row', alignItems:'center', gap:4, paddingVertical:6, paddingHorizontal:10, borderRadius:16, borderWidth:1.5, borderColor:'#e5e7eb', backgroundColor:'#f9fafb' },
  shiftBtnActive:{ backgroundColor:'#f59e0b', borderColor:'#f59e0b' },
  shiftText:     { fontSize:11, color:'#6b7280', fontWeight:'500' },
  shiftTextActive:{ color:'white', fontWeight:'700' },
  legendBox:     { backgroundColor:'#fffbeb', borderRadius:10, padding:12, marginVertical:16, gap:6 },
  legendRow:     { flexDirection:'row', alignItems:'center', gap:8 },
  legendText:    { fontSize:12, color:'#374151', fontWeight:'500' },
})
