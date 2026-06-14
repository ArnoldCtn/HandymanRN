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
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/use-theme-color'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'


function DismissKeyboard({ children }) {
  if (Platform.OS === 'web') return <>{children}</>
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {children}
    </TouchableWithoutFeedback>
  )
}

export default function HandymanSignInScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
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
      
      login(handyman)
      router.replace('/handyman/Home')
    } catch (e) {
      router.replace('/handyman/Home')
    }
  }

  async function onSignIn() {
    const failUsername = !username.trim()
    if (failUsername) setUsernameError(t('auth.username_required'))
    const failPassword = !password
    if (failPassword) setPasswordError(t('auth.password_required'))
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
        showToast(msg ?? t('auth.account_locked'), 'error')
        setPasswordError(msg ?? t('auth.account_locked_short'))
      } else if (error.response?.status === 401) {
        showToast(msg ?? t('auth.invalid_credentials'), 'error')
        setPasswordError(msg ?? t('auth.invalid_credentials'))
      } else if (error.response?.status === 400) {
        showToast(msg ?? t('auth.fill_all_fields'), 'error')
        setUsernameError(msg ?? t('auth.invalid_request'))
      } else {
        showToast(t('auth.connection_failed', { error: error.message }), 'error')
        setUsernameError(t('auth.connection_failed', { error: error.message }))
      }
      return
    }

    const pinEnabled = await PIN.isEnabled()
    if (pinEnabled) {
      setPendingData(responseData)
      setShowPIN(true)
      return
    }

    try {
      const { tokens, handyman } = responseData
      await AsyncStorage.setItem('handyman_access_token',  tokens.access)
      await AsyncStorage.setItem('handyman_refresh_token', tokens.refresh)
      await AsyncStorage.setItem('handyman', JSON.stringify(handyman))
      
      login(handyman)
      showToast(t('auth.login_success'), 'success')
      setTimeout(() => router.replace('/handyman/Home'), 1200)
    } catch (e) {
      router.replace('/handyman/Home')
    }
  }

  if (showPIN) {
    return (
      <PINLockScreen
        onUnlock={onPINUnlocked}
        title={t('auth.pin_verify_title')}
        subtitle={t('auth.pin_verify_subtitle')}
      />
    )
  }

  const styles = createStyles(theme)

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView>
      <DismissKeyboard>
        <SafeAreaView style={{ flex:1}}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
             <View>
                    <Image source={favicon} alt="" style={{alignSelf:'center',padding:10, height:250,width:'100%'}} />
                  </View>
            <ScrollView contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <View style={{ flex:1, justifyContent:'center', paddingHorizontal: 20 }}>

            <ThemedText type="title" style={{textAlign:'center',marginBottom:20}}>{t('auth.sign_in_pro', 'Sign In as a Pro')}</ThemedText>

                <Toast visible={toast.visible} message={toast.message}
                  type={toast.type}
                  onHide={() => setToast(t => ({ ...t, visible:false }))} />

                <Input 
                  title={t('auth.username_email')} 
                  placeholder={t('auth.email_placeholder')}
                  value={username}
                  setValue={setUsername} 
                  error={usernameError}
                  setError={setUsernameError} 
                />

                <View style={{ position:'relative' }}>
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
                      size={24} color={theme.icon} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={{ marginTop: -5, marginBottom: 5, alignSelf: 'flex-end' }} onPress={() => router.push('/(auth)/ForgotPassword')}>
                  <ThemedText type="link">{t('auth.forgot_password')}</ThemedText>
                </TouchableOpacity>

                <ThemedText style={{ textAlign:'center', marginVertical:15 }}>
                  {t('auth.dont_have_account')}
                  <ThemedText style={{ color: theme.accent }}
                    onPress={() => router.push('/handyman/SignUp')}>
                    {t('auth.sign_up')}
                  </ThemedText>
                </ThemedText>
                <ThemedText style={{ textAlign:'center', marginVertical:15 }}>
                 {t('auth.wish_login_user')}
                  <ThemedText style={{ color: theme.primary }}
                    onPress={() => router.push('/SignIn')}>
                    {t('auth.sign_in')}
                  </ThemedText>
                </ThemedText>

                <Button title={t('auth.sign_in')} onPress={onSignIn} />

              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </DismissKeyboard>
      </ScrollView>
    </ThemedView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  scroll: { flexGrow:1, paddingHorizontal:24, paddingTop:40 },
  eye:    { position:'absolute', right:16, top:40, padding:4 },
})
