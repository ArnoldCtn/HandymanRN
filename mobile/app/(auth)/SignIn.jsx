import {
  Image, Keyboard, KeyboardAvoidingView,
  Platform,
  ScrollView, StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback, View
} from 'react-native'
import React, { useState } from 'react'
import Title from '@/components/Title'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router'
import api from '@/services/api'
import Toast from '@/components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useGlobal from '@/services/global'
import { HANDYMAN_PIN } from '@/services/pin'
import PINLockScreen from '@/components/PINLock'
import favicon from '@/assets/images/FullLogo.jpg'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/use-theme-color'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'

function DismissKeyboard({ children }) {
  if (Platform.OS === 'web') return <>{children}</>;
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {children}
    </TouchableWithoutFeedback>
  );
}

export default function SignInScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false);

  const login = useGlobal(state => state.login)

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const [showPIN, setShowPIN] = useState(false)
  const [pendingData, setPendingData] = useState(null)  // holds responseData until PIN passed


  async function onPINUnlocked() {
    try {
      const { tokens, user } = pendingData
      await AsyncStorage.setItem('access_token', tokens.access)
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
    if (failUsername) setUsernameError(t('auth.username_required'))

    const failPassword = !password
    if (failPassword) setPasswordError(t('auth.password_required'))

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
        const netMsg = t('auth.connection_failed', { error: error.message })
        showToast(netMsg, 'error')
        setUsernameError(netMsg)
      }
      return
    }

    const PinEnabled = await HANDYMAN_PIN.isEnabled()

    if (PinEnabled) {
      setPendingData(responseData)
      login(responseData.user)
      setShowPIN(true)
      return
    }

    // ── 2. Store + navigate ──────────────────────────────
    try {
      const { tokens, user } = responseData
      await AsyncStorage.setItem('access_token', tokens.access)
      await AsyncStorage.setItem('refresh_token', tokens.refresh)
      await AsyncStorage.setItem('user', JSON.stringify(user))

      login(user)
      showToast(t('auth.login_success'), 'success')
      setTimeout(() => router.replace('/(auth)/Home'), 1200)

    } catch (storageError) {
      console.log('[SignIn] Post-login error:', storageError.message)
      router.replace('/(auth)/Home')
    }
  }

  if (showPIN) {
    return (
      <PINLockScreen
        onUnlock={onPINUnlocked}
        title={t('auth.pin_verify_title')}
        subtitle={t('auth.pin_verify_subtitle')}
        pinService={HANDYMAN_PIN}
      />
    )
  }


  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView>
        <DismissKeyboard>
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={{ flex: 1 }}>
              <View>
                <Image source={favicon} alt="" style={{ alignSelf: 'center', padding: 10, height: 250, width: '100%' }} />
              </View>
              <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View style={styles.scrollContent}>
                  <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>

                    <Toast
                      visible={toast.visible}
                      message={toast.message}
                      type={toast.type}
                      onHide={() => setToast(t => ({ ...t, visible: false }))}
                    />
                    <ThemedText type="title" style={{ textAlign: 'center', marginBottom: 20 }}>
                      {t('auth.sign_in_title')}
                    </ThemedText>


                    <Input 
                      title={t('auth.username_email')}
                      placeholder={t('auth.email_placeholder')}
                      value={username}
                      setValue={setUsername}
                      error={usernameError}
                      setError={setUsernameError} 
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

                      <TouchableOpacity style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"}
                          size={24} color={theme.icon} />
                      </TouchableOpacity>

                    </View>

                    <TouchableOpacity style={{ marginTop: -5, marginBottom: 5, alignSelf: 'flex-end' }} onPress={() => router.push('/(auth)/ForgotPassword')}>
                      <ThemedText type="link">{t('auth.forgot_password')}</ThemedText>
                    </TouchableOpacity>


                    <View style={{ marginVertical: 15, alignItems: 'center' }}>
                      <ThemedText type="secondary">
                        {t('auth.dont_have_account')}
                        <ThemedText type="link" onPress={() => router.push("SignUp")} >
                          {t('auth.sign_up')}
                        </ThemedText>
                      </ThemedText>
                    </View>

                    <View style={{ marginVertical: 15, alignItems: 'center' }}>
                      <ThemedText type="secondary" onPress={() => router.push("handyman/SignIn")}>
                        {t('auth.wish_login_handyman')}
                        <ThemedText type="accent">
                          {t('auth.sign_in')}
                        </ThemedText>
                      </ThemedText>
                    </View>

                    <Button title={t('auth.sign_in')} onPress={(onSignIn)} />

                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </DismissKeyboard>
      </ScrollView>
    </ThemedView>
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
