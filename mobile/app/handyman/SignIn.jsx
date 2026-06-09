import {
  Image,
  Keyboard, KeyboardAvoidingView, Platform, SafeAreaView,
  ScrollView, StyleSheet, Text, TouchableOpacity,
  TouchableWithoutFeedback, View
} from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Title from '@/components/Title'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Toast from '@/components/Toast'
import PINLockScreen from '@/components/PINLock'
import { PIN } from '@/services/pin'
import handymanApi from '@/services/handymanApi'
import useHandymanGlobal from '@/services/handymanGlobal'
import favicon from '@/assets/images/FullLogo.jpg'


function DismissKeyboard({ children }) {
  if (Platform.OS === 'web') return <>{children}</>
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {children}
    </TouchableWithoutFeedback>
  )
}

export default function HandymanSignInScreen() {
  const router = useRouter()
  const login  = useHandymanGlobal(s => s.login)

  const [username,      setUsername]      = useState('')
  const [password,      setPassword]      = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword,  setShowPassword]  = useState(false)
  const [toast,         setToast]         = useState({ visible:false, message:'', type:'success' })
  const [showPIN,       setShowPIN]       = useState(false)
  const [pendingData,   setPendingData]   = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ visible:true, message:msg, type })
  }

  async function onPINUnlocked() {
    try {
      const { tokens, handyman } = pendingData
      await AsyncStorage.setItem('handyman_access_token',  tokens.access)
      await AsyncStorage.setItem('handyman_refresh_token', tokens.refresh)
      await AsyncStorage.setItem('handyman', JSON.stringify(handyman))
      
      // ✅ Update global state
      login(handyman)
      
      router.replace('/handyman/Home')
    } catch (e) {
      router.replace('/handyman/Home')
    }
  }

  async function onSignIn() {
    const failUsername = !username.trim()
    if (failUsername) setUsernameError('Username not provided')
    const failPassword = !password
    if (failPassword) setPasswordError('Password not provided')
    if (failUsername || failPassword) return

    let responseData = null
    try {
      const response = await handymanApi({
        method: 'POST',
        url:    '/handymen/signin/',
        data:   { username: username.trim().toLowerCase(), password }
      })
      responseData = response.data
    } catch (error) {
      const msg = error.response?.data?.detail
      if (error.response?.status === 429) {
        showToast(msg ?? 'Account locked.', 'error')
        setPasswordError(msg ?? 'Account locked.')
      } else if (error.response?.status === 401) {
        showToast(msg ?? 'Invalid credentials.', 'error')
        setPasswordError(msg ?? 'Invalid username or password.')
      } else if (error.response?.status === 400) {
        showToast(msg ?? 'Fill in all fields.', 'error')
        setUsernameError(msg ?? 'Invalid request.')
      } else {
        showToast(`Connection failed: ${error.message}`, 'error')
        showToast('Try Again Later','error')
        setUsernameError(`Connection failed: ${error.message}`)
      }
      return
    }

    // ── PIN check ──────────────────
    const pinEnabled = await PIN.isEnabled()
    if (pinEnabled) {
      setPendingData(responseData)
      // login(responseData.handyman) // Might want to wait for PIN but updating here is safer for "unknown" user
      setShowPIN(true)
      return
    }

    try {
      const { tokens, handyman } = responseData
      await AsyncStorage.setItem('handyman_access_token',  tokens.access)
      await AsyncStorage.setItem('handyman_refresh_token', tokens.refresh)
      await AsyncStorage.setItem('handyman', JSON.stringify(handyman))
      
      // ✅ Update global state
      login(handyman)
      
      showToast('Login successful!', 'success')
      setTimeout(() => router.replace('/handyman/Home'), 1200)
    } catch (e) {
      router.replace('/handyman/Home')
    }
  }

  if (showPIN) {
    return (
      <PINLockScreen
        onUnlock={onPINUnlocked}
        title="Verify Your Identity"
        subtitle="Enter your app PIN to continue"
      />
    )
  }

  return (
    <ScrollView>
    <DismissKeyboard>
      <SafeAreaView style={{ flex:1}}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
           <View>
                  <Image source={favicon} width={200} height={250} alt="" style={{alignSelf:'center',padding:10, height:'250',width:'100%'}} />
                </View>
          <ScrollView contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={{ flex:1, justifyContent:'center', paddingHorizontal:20 }}>

          <Text style={{textAlign:'center',marginBottom:20, fontSize:30,fontWeight:'black',color:'gray'}}>Sign In Here As a Pro</Text>

              <Toast visible={toast.visible} message={toast.message}
                type={toast.type}
                onHide={() => setToast(t => ({ ...t, visible:false }))} />

              <Input title='Username' value={username}
                setValue={setUsername} error={usernameError}
                setError={setUsernameError} />

              <View style={{ position:'relative' }}>
                <Input title='Password' value={password}
                  setValue={setPassword} error={passwordError}
                  setError={setPasswordError}
                  secureTextEntry={!showPassword} />
                <TouchableOpacity style={styles.eye}
                  onPress={() => setShowPassword(s => !s)}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={24} color='black' />
                </TouchableOpacity>
              </View>

              <Text style={{ textAlign:'center', marginVertical:15, color:'gray' }}>
                Don&apos;t have an account?{' '}
                <Text style={{ color:'#f59e0b' }}
                  onPress={() => router.push('/handyman/SignUp')}>
                  Sign Up
                </Text>
              </Text>
              <Text style={{ textAlign:'center', marginVertical:15, color:'gray' }}>
               Sign In as A simple user?{' '}
                <Text style={{ color:'#0b17f5' }}
                  onPress={() => router.push('/SignIn')}>
                  Sign In
                </Text>
              </Text>

              <Button title='Sign In' onPress={onSignIn} />

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </DismissKeyboard>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flexGrow:1, paddingHorizontal:24, paddingTop:40 },
  eye:    { position:'absolute', right:16, top:40, padding:4 },
})
