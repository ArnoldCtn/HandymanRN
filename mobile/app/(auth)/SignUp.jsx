import { Alert, Image, Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React, { useState } from 'react'
import Title from '@/components/Title'
import Input from '@/components/Input'
import Button from '@/components/Button'
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import api from '@/services/api'
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import useGlobal from '@/services/global'
import favicon from '@/assets/images/FullLogo.jpg'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/use-theme-color'
import { useToast } from '@/hooks/useToast'
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

export default function SignUpScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('')

  const login = useGlobal(state => state.login)

  const showToast = useToast()

  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('auth.permission_needed'), t('auth.permission_photos_msg'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }

  };

  async function onSignUp() {
    setUsernameError('');
    setEmailError('');
    setPasswordError('');

    const failUsername = !username;
    if (failUsername) setUsernameError(t('auth.username_is_required'));

    let failEmail = false;
    if (!email.trim()) {
      setEmailError(t('auth.email_required'));
      failEmail = true;
    } else if (!isValidEmail(email)) {
      setEmailError(t('auth.email_invalid'));
      failEmail = true;
    }

    const failPassword = !password;
    if (failPassword) setPasswordError(t('auth.password_is_required'));

    if (failUsername || failEmail || failPassword) return;


    // ── Convert image to base64 if selected ─────────────────
    let base64Image = null;
    if (profilePicture) {
      try {
        const imgResponse = await fetch(profilePicture);
        const blob = await imgResponse.blob();
        base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (imgErr) {
        console.log('Failed to convert image to base64:', imgErr.message);
      }
    }

    const signupData = {
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: password,
      user_type: 'client'
    };
    if (base64Image) {
      signupData.thumbnail = base64Image;
    }

    let responseData = null;

    // ── 1. Signup with JSON (no FormData) ─────────────────
    try {
      const response = await api({
        method: 'POST',
        url: '/users/signup/',
        data: signupData,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      responseData = response.data;
    } catch (error) {
      if (error.response?.data) {
        const data = error.response.data;
        if (data.username) setUsernameError(data.username[0]);
        if (data.email) setEmailError(data.email[0]);
        if (data.password) setPasswordError(data.password[0]);
        showToast(t('auth.check_entries'), 'error')
      } else {
        setUsernameError(t('auth.connection_failed', { error: error.message }));
        showToast(t('auth.network_error'), 'error')
      }
      return;
    }

    // ── 2. Store tokens + navigate ────────────────────────
    try {
      const { tokens, user } = responseData;
      await AsyncStorage.setItem('access_token', tokens.access);
      await AsyncStorage.setItem('refresh_token', tokens.refresh);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      showToast(t('auth.account_created'), 'success');
      login(user);
      setTimeout(() => router.replace('/'), 1200);
    } catch (storageError) {
      console.log('[SignUp] Post-signup error:', storageError.message);
      router.replace('/');
    }
  }

  function isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim().toLowerCase());
  };


  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView>
        <DismissKeyboard>
          <SafeAreaView style={{ flex: 1 }} >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : 'height'}
              keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
              style={{ flex: 1 }}
            >
              <View>
                <Image source={favicon} width={200} height={250} alt="" style={{ alignSelf: 'center', padding: 10, height: 250, width: '100%' }} />
              </View>

              <ScrollView contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled">
                <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>

                  <ThemedText type="title" style={{ textAlign: 'center', marginBottom: 20 }}>
                    {t('auth.sign_up_title')}
                  </ThemedText>

                  <TouchableOpacity style={styles.ImagePicker} onPress={pickImage}>
                    {profilePicture ? (
                      <Image source={{ uri: profilePicture }} style={styles.profileImage} />
                    ) : (
                      <View style={[styles.imagePlaceholder, { backgroundColor: theme.border }]}>
                        <ThemedText type="secondary" style={styles.imagePlaceholderText}>
                          {t('auth.add_profile_pic')}
                        </ThemedText>
                      </View>
                    )}

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
                    setValue={setEmail}
                    error={emailError}
                    value={email}
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

                    <TouchableOpacity style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={24} color={theme.icon} />
                    </TouchableOpacity>

                  </View>


                  <ThemedText style={{ textAlign: 'center', marginVertical: 15 }} onPress={() => router.push("SignIn")}>
                    {t('auth.already_have_account')}
                    <ThemedText type="link" onPress={() => router.push("SignIn")} >
                      {t('auth.sign_in')}
                    </ThemedText>
                  </ThemedText>

                  <ThemedText style={{ textAlign: 'center', marginVertical: 15, fontSize: 18 }} onPress={() => router.push("handyman/SignUp")}>
                    {t('auth.wish_signup_handyman')}
                    <ThemedText type="accent" onPress={() => router.push("handyman/SignUp")} >
                      {t('auth.sign_up')}
                    </ThemedText>
                  </ThemedText>

                  <Button title={t('auth.sign_up')} onPress={onSignUp} />

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
  ImagePicker: {
    alignSelf: 'center',
    marginBottom: 20,
  },

  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  imagePlaceholderText: {
    fontSize: 12,
    textAlign: 'center'
  }
})
