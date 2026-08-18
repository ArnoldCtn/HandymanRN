import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import api from '@/services/api';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function VerifyAndResetScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [otp_code, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function onReset() {
    if (!otp_code.trim()) {
      setToast({ visible: true, message: t('auth.otp_required', 'Please enter the OTP code'), type: 'error' });
      return;
    }
    if (!password.trim()) {
      setToast({ visible: true, message: t('auth.password_required'), type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setToast({ visible: true, message: t('auth.passwords_dont_match', 'Passwords do not match'), type: 'error' });
      return;
    }
    if (password.length < 8) {
      setToast({ visible: true, message: t('auth.password_too_short', 'Password must be at least 8 characters'), type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/users/password-reset/verify-and-confirm/', {
        email,
        otp_code: otp_code.trim(),
        password
      });
      setToast({ visible: true, message: t('auth.password_updated', 'Password updated!'), type: 'success' });
      setTimeout(() => router.replace('/(auth)/SignIn'), 1500);
    } catch (e) {
      setToast({ visible: true, message: e.response?.data?.detail || t('common.error'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(t => ({...t, visible:false}))} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always">
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <ThemedText type="title" style={styles.title}>{t('auth.verify_and_reset', 'Verify & Reset Password')}</ThemedText>
            <ThemedText type="secondary" style={styles.subtitle}>
              {t('auth.verify_and_reset_desc', 'Enter the OTP sent to your email and set a new password')}
            </ThemedText>

            <Input
              title={t('auth.otp_code', 'OTP Code')}
              value={otp_code}
              setValue={setOtpCode}
              placeholder="123456"
              keyboardType="numeric"
              maxLength={6}
              autoFocus={true}
            />

            <Input
              title={t('auth.new_password', 'New Password')}
              value={password}
              setValue={setPassword}
              placeholder={t('auth.password_placeholder')}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(s => !s)}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={theme.icon}
              />
            </TouchableOpacity>

            <Input
              title={t('auth.confirm_password', 'Confirm Password')}
              value={confirmPassword}
              setValue={setConfirmPassword}
              placeholder={t('auth.confirm_password_placeholder', 'Re-enter your password')}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity
              style={styles.eyeButtonConfirm}
              onPress={() => setShowConfirm(s => !s)}
            >
              <Ionicons
                name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={theme.icon}
              />
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
            ) : (
              <Button title={t('auth.reset_password', 'Reset Password')} onPress={onReset} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 20 },
  backBtn: { marginBottom: 20 },
  title: { textAlign: 'center', marginBottom: 10 },
  subtitle: { textAlign: 'center', marginBottom: 30 },
  eyeButton: {
    position: 'absolute',
    right: 36,
    top: 258,
    padding: 4,
  },
  eyeButtonConfirm: {
    position: 'absolute',
    right: 36,
    top: 340,
    padding: 4,
  },
});
