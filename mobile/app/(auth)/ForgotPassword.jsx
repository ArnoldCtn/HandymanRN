import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import api from '@/services/api';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  async function onRequestOTP() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post('/users/password-reset/request/', { email });
      router.push({
        pathname: '/(auth)/VerifyAndReset',
        params: { email }
      });
    } catch (e) {
      setToast({ visible: true, message: e.response?.data?.detail || t('common.error'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(t => ({...t, visible:false}))} />
      
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>

      <ThemedText type="title" style={styles.title}>{t('auth.forgot_password', 'Forgot Password')}</ThemedText>
      <ThemedText type="secondary" style={styles.subtitle}>{t('auth.forgot_password_desc', 'Enter your email to receive an OTP')}</ThemedText>

      <Input title={t('auth.email')} value={email} setValue={setEmail} placeholder={t('auth.email_placeholder')} />
      
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <Button title={t('common.next')} onPress={onRequestOTP} />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 20 },
  title: { textAlign: 'center', marginBottom: 10 },
  subtitle: { textAlign: 'center', marginBottom: 30 }
});
