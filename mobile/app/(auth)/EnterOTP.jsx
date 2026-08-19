import React, { useState, useRef, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Animated, Vibration,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from '@/components/Toast';
import api from '@/services/api';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const OTP_LENGTH = 6;
const COOLDOWN_SECONDS = 60;

export default function EnterOTPScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(c => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Shake + clear on error
  useEffect(() => {
    if (!error) return;
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      setError(false);
      setDigits(Array(OTP_LENGTH).fill(''));
      refs.current[0]?.focus();
    }, 1500);
    return () => clearTimeout(timer);
  }, [error]);

  async function verifyAndNavigate(otpCode) {
    setVerifying(true);
    try {
      await api.post('/users/password-reset/verify/', {
        email,
        otp_code: otpCode,
      });
      router.push({
        pathname: '/(auth)/ResetPassword',
        params: { email, otp_code: otpCode },
      });
    } catch (e) {
      setError(true);
    } finally {
      setVerifying(false);
    }
  }

  function handleChange(text, index) {
    if (error || verifying) return;
    if (text.length > 1) text = text.slice(-1);
    if (!/^\d*$/.test(text)) return;

    const next = [...digits];
    next[index] = text;
    setDigits(next);

    if (text && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }

    if (text && index === OTP_LENGTH - 1 && next.every(d => d !== '')) {
      const otpCode = next.join('');
      verifyAndNavigate(otpCode);
    }
  }

  function handleKeyPress(e, index) {
    if (error || verifying) return;
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      refs.current[index - 1]?.focus();
    }
  }

  async function resendOTP() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await api.post('/users/password-reset/request/', { email });
      setCooldown(COOLDOWN_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      setError(false);
      refs.current[0]?.focus();
      setToast({ visible: true, message: t('auth.otp_resent', 'A new code has been sent to your email'), type: 'success' });
    } catch (e) {
      setToast({ visible: true, message: e.response?.data?.detail || t('common.error'), type: 'error' });
    } finally {
      setResending(false);
    }
  }

  const boxColor = (i) => {
    if (error) return theme.error;
    if (digits[i]) return theme.primary;
    return theme.border;
  };

  return (
    <ThemedView style={styles.container}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast(t => ({ ...t, visible: false }))} />

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>

      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
          <Ionicons name="mail-open-outline" size={36} color={theme.primary} />
        </View>
      </View>

      <ThemedText type="title" style={styles.title}>
        {t('auth.check_email', 'Check Your Email')}
      </ThemedText>
      <ThemedText type="secondary" style={styles.subtitle}>
        {t('auth.otp_sent_to', 'Enter the 6-digit code sent to')}
      </ThemedText>
      <ThemedText style={[styles.email, { color: theme.primary }]}>
        {email}
      </ThemedText>

      <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
        {digits.map((digit, i) => (
          <View
            key={i}
            style={[
              styles.otpBox,
              {
                borderColor: boxColor(i),
                backgroundColor: digit ? boxColor(i) + '12' : theme.card,
                shadowColor: digit ? boxColor(i) : 'transparent',
              },
            ]}
          >
            <TextInput
              ref={ref => { refs.current[i] = ref; }}
              style={[styles.otpDigit, { color: error ? theme.error : theme.text }]}
              value={digit}
              onChangeText={text => handleChange(text, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="numeric"
              maxLength={2}
              selectTextOnFocus
              editable={!error && !verifying}
            />
          </View>
        ))}
      </Animated.View>

      {verifying ? (
        <View style={styles.verifyRow}>
          <ActivityIndicator size="small" color={theme.primary} />
          <ThemedText type="secondary" style={styles.verifyText}>
            {t('auth.verifying', 'Verifying...')}
          </ThemedText>
        </View>
      ) : error ? (
        <ThemedText type="error" style={styles.errorText}>
          {t('auth.invalid_otp', 'Invalid code. Please try again.')}
        </ThemedText>
      ) : (
        <ThemedText type="secondary" style={styles.hint}>
          {t('auth.otp_auto_advance', 'Code will submit automatically when complete')}
        </ThemedText>
      )}

      <View style={styles.resendRow}>
        {resending ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : cooldown > 0 ? (
          <ThemedText type="secondary" style={styles.cooldownText}>
            {t('auth.resend_in', 'Resend code in')} {cooldown}s
          </ThemedText>
        ) : (
          <TouchableOpacity onPress={resendOTP} style={styles.resendBtn}>
            <Ionicons name="refresh-outline" size={16} color={theme.primary} />
            <ThemedText style={[styles.resendText, { color: theme.primary }]}>
              {t('auth.resend_code', 'Resend Code')}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 12 },
  iconContainer: { alignItems: 'center', marginBottom: 24 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', marginBottom: 4 },
  email: { textAlign: 'center', fontSize: 16, fontWeight: '600', marginBottom: 36 },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  otpBox: {
    width: 50,
    height: 60,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  hint: { textAlign: 'center', fontSize: 13, marginTop: 4, marginBottom: 24 },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 24,
  },
  verifyText: { fontSize: 13 },
  errorText: { textAlign: 'center', fontSize: 13, marginTop: 4, marginBottom: 24 },
  resendRow: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
    minHeight: 24,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cooldownText: { fontSize: 14 },
  resendText: { fontSize: 15, fontWeight: '600' },
});
