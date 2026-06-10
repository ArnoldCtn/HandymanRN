import {   Image, Keyboard, KeyboardAvoidingView, 
  Platform, 
  ScrollView, StyleSheet, 
  Text, 
  TouchableOpacity, 
  TouchableWithoutFeedback, View } from 'react-native'
import React, {  useState } from 'react'
import Title from '@/components/Title'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router'
import api from '@/services/api' 
import Toast from '@/components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import  useGlobal from '@/services/global'
import { HANDYMAN_PIN } from '@/services/pin'   
import PINLockScreen from '@/components/PINLock' 
import favicon from '@/assets/images/FullLogo.jpg'
// import GoogleSignIn from '@/components/GoogleSignIn';
import { SafeAreaView } from 'react-native-safe-area-context'

 function DismissKeyboard({ children }) {
  if (Platform.OS === 'web') return <>{children}</>;
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {children}
    </TouchableWithoutFeedback>
  );
}


export default function SignInScreen() {
    const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword,setShowPassword] = useState(false);

  const login = useGlobal(state => state.login)
  
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const [showPIN,      setShowPIN]      = useState(false)
  const [pendingData,  setPendingData]  = useState(null)  // holds responseData until PIN passed


   async function onPINUnlocked() {
    try {
      const { tokens, user } = pendingData
      await AsyncStorage.setItem('access_token',  tokens.access)
      await AsyncStorage.setItem('refresh_token', tokens.refresh)
      await AsyncStorage.setItem('user', JSON.stringify(user))
      login(user)
      router.replace('/(auth)/Home')
    } catch (e) {
      console.log('[SignIn] PIN unlock storage error:', e.message)
      router.replace('/(auth)/Home')
    }
  }


  function showToast(message, type = 'success') {
    setToast({ visible: true, message, type });
  }


 async function onSignIn() {
  const failUsername = !username.trim()
  if (failUsername) setUsernameError('Username not provided')

  const failPassword = !password
  if (failPassword) setPasswordError('Password not provided')

  if (failUsername || failPassword) return

  let responseData = null

  // ── 1. API call ──────────────────────────────────────
  try {
    const response = await api({
      method: 'POST',
      url: '/users/signin/',
      data: { username: username.trim().toLowerCase(), password }
    })
    responseData = response.data
    login(responseData.user)

  } catch (error) {
    console.log('[SignIn] status:', error.response?.status)
    console.log('[SignIn] data:',   error.response?.data)
    console.log('[SignIn] dataaaaa:',   error)

    // ✅ Always read the message Django actually sent
    const msg = error.response?.data?.detail

    if (error.response?.status === 429) {
      // Locked out — show lockout message + how long
      showToast(msg ?? 'Account locked. Try again later.', 'error')
      setPasswordError(msg ?? 'Account locked.')

    } else if (error.response?.status === 401) {
      // Wrong password — shows remaining attempts from Django
      showToast(msg ?? 'Invalid credentials.', 'error')
      setPasswordError(msg ?? 'Invalid username or password.')

    } else if (error.response?.status === 400) {
      showToast(msg ?? 'Fill in all fields.', 'error')
      setUsernameError(msg ?? 'Invalid request.')

    } else {
      // Network/timeout error
      const netMsg = `Connection failed: ${error.message}`
      showToast(netMsg, 'error')
      setUsernameError(netMsg)
      console.log('[SignIn] Network error:', error)
      console.log('[SignIn] Network error:', netMsg)
      console.log('credidentials', username, password)
    }
    return
  }

const PinEnabled = await HANDYMAN_PIN.isEnabled()

  if(PinEnabled){
     // Hold the data, show PIN pad — don't store tokens yet
      setPendingData(responseData)
      login(responseData.user)   // update Zustand so app knows who it is
      setShowPIN(true)           // swap the screen to PIN pad
      return
  }

  // ── 2. Store + navigate ──────────────────────────────
  try {
    const { tokens, user } = responseData
    await AsyncStorage.setItem('access_token',  tokens.access)
    await AsyncStorage.setItem('refresh_token', tokens.refresh)
    await AsyncStorage.setItem('user', JSON.stringify(user))
    
    // ✅ MUST update global state so user isn't "unknown"
    login(user)

    showToast('Login successful! Redirecting...', 'success')

    setTimeout(() => router.replace('/(auth)/Home'), 1200)

  } catch (storageError) {
    console.log('[SignIn] Post-login error:', storageError.message)
    router.replace('/(auth)/Home')
  }
}
 // ── If PIN is needed, swap entire screen to PINLockScreen ──
  if (showPIN) {
    return (
      <PINLockScreen
      onUnlock={onPINUnlocked}
      title="Verify Your Identity"
      subtitle="Enter your app PIN to continue"
      pinService={HANDYMAN_PIN}    // ← pass handyman PIN service
    />
    )
  }
 

  return (
    <ScrollView>
    <DismissKeyboard>
    <SafeAreaView style={{flex:1}}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{flex: 1}}>
      <View>
        <Image source={favicon} alt="" style={{alignSelf:'center', padding:10, height: 250, width: '100%'}} />
      </View>
      <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
<View style={styles.scrollContent}>
      <View style={{flex:1,justifyContent:'center',paddingHorizontal:20}}>
                 
        {/* <Title text='Handyman West' color='#202020'  /> */}
          
            <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast(t => ({ ...t, visible: false }))}
        />
                      <Text style={{textAlign:'center',marginBottom:20, fontSize:36,fontWeight:'black',color:'gray'}}>Sign In Here</Text>
        

          <Input title='Username or Email'
          value={username}
          setValue={setUsername}
          error={usernameError}
          setError={setUsernameError} />
          <View style={{position:'relative'}}>
                        <Input title='Password' 
                         value={password}
                    setValue={setPassword}
                    error={passwordError}
                    setError={setPasswordError}
                    secureTextEntry={!showPassword} />
          
                     <TouchableOpacity style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={24} color='black' />
                    </TouchableOpacity>
          
                    </View>


          <View style={{marginVertical: 15, alignItems: 'center'}}>
            <Text style={{color:'gray'}}>
              Dont have an account?{' '}
              <Text style={{color:'#0b17f5'}} onPress={() => router.push("SignUp")} >
                Sign Up 
              </Text>
            </Text>
          </View>

          <View style={{marginVertical: 15, alignItems: 'center'}}>
            <Text style={{color:'gray'}} onPress={() => router.push("handyman/SignIn")}>
              Wish to login as Handyman?{' '}
              <Text style={{color:'#f59e0b'}}>
                Sign In
              </Text>
            </Text>
          </View>
          
          <Button title='Sign In' onPress={(onSignIn)} />
          
          {/* <GoogleSignIn onLogin={(user, token) => {
            console.log('[SignIn] Google Sign-In Success:', user);
            login(user);
            router.replace('/(auth)/Home');
          }} /> */}
      </View>
</View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
     </DismissKeyboard>
     </ScrollView>
  )
}

const styles = StyleSheet.create({
   eyeButton: {
    position: "absolute",
    right: 16,
    top: 40,
    padding: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
})
