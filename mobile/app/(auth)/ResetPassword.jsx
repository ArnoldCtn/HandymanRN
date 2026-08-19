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

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const { email, otp_code } = useLocalSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function onReset() {
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
        otp_code,
        password,
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
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(t => ({ ...t, visible: false }))} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="always">
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>

            <ThemedText type="title" style={styles.title}>
              {t('auth.new_password', 'New Password')}
            </ThemedText>
            <ThemedText type="secondary" style={styles.subtitle}>
              {t('auth.new_password_desc', 'Create a strong password for your account')}
            </ThemedText>

            <Input
              title={t('auth.new_password', 'New Password')}
              value={password}
              setValue={setPassword}
              placeholder={t('auth.password_placeholder')}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.seePasswordRow}
              onPress={() => setShowPassword(s => !s)}
              activeOpacity={0.6}
            >
              <Ionicons
                name={showPassword ? 'checkmark-square-outline' : 'square-outline'}
                size={20}
                color={theme.primary}
              />
              <ThemedText type="secondary" style={styles.seePasswordText}>
                {t('auth.see_password', 'See password')}
              </ThemedText>
            </TouchableOpacity>

            <Input
              title={t('auth.confirm_password', 'Confirm Password')}
              value={confirmPassword}
              setValue={setConfirmPassword}
              placeholder={t('auth.confirm_password_placeholder', 'Re-enter your password')}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity
              style={styles.seePasswordRow}
              onPress={() => setShowConfirm(s => !s)}
              activeOpacity={0.6}
            >
              <Ionicons
                name={showConfirm ? 'checkmark-square-outline' : 'square-outline'}
                size={20}
                color={theme.primary}
              />
              <ThemedText type="secondary" style={styles.seePasswordText}>
                {t('auth.see_password', 'See password')}
              </ThemedText>
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
  seePasswordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -2,
    marginBottom: 12,
    paddingLeft: 4,
  },
  seePasswordText: { fontSize: 14 },
});
