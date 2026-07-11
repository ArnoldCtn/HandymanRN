// app/booking-detail/[id].jsx — USER ONLY
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, TextInput, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';

export default function UserBookingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modifyModal, setModifyModal] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [paymentModal, setPaymentModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    console.log('[U-BookingDetail] Mount, id:', id);
    if (!id) { console.log('[U-BookingDetail] No id'); return; }

    const fetchBooking = async () => {
      console.log('[U-BookingDetail] Fetching booking', id);
      try {
        const res = await api.get(`/bookings/${id}/`);
        console.log('[U-BookingDetail] Fetched OK:', JSON.stringify(res.data, null, 2));
        setBooking(res.data);
      } catch (err) {
        console.error('[U-BookingDetail] Fetch ERROR:', err.response?.status, err.response?.data || err.message);
        Alert.alert(t('common.error'), t('bookings.load_failed'));
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  const handleComplete = () => {
    setPaymentModal(true);
  };

  const validatePhoneNumber = (number, provider) => {
    if (!number) return false;
    
    const orangePattern = /^(69)\d{7}$|^(655|656|657|658|659)\d{6}$/;
    const mtnPattern = /^(67|68)\d{7}$|^(650|651|652|653|654)\d{6}$/;
    
    if (provider === 'orange') {
      return orangePattern.test(number);
    } else if (provider === 'mtn') {
      return mtnPattern.test(number);
    }
    return false;
  };

  const handlePaymentNumberChange = (number) => {
    setPaymentNumber(number);
    
    if (!selectedProvider) {
      setPhoneError(t('payment.select_provider_first'));
      return;
    }
    
    if (validatePhoneNumber(number, selectedProvider)) {
      setPhoneError('');
    } else {
      const providerName = selectedProvider === 'orange' ? t('payment.orange_money') : t('payment.mtn_money');
      setPhoneError(t('payment.invalid_number', { provider: providerName }));
    }
  };

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    setPaymentNumber('');
    setPhoneError('');
  };

  const getErrorTranslation = (errorCode, fallbackMessage) => {
    const errorMap = {
      'INSUFFICIENT_BALANCE': t('payment.error_insufficient_balance'),
      'WRONG_PIN': t('payment.error_wrong_pin'),
      'CANCELLED_BY_USER': t('payment.error_cancelled_by_user'),
      'PAYMENT_REFUSED': t('payment.error_payment_refused'),
      'INVALID_NUMBER': t('payment.error_invalid_number'),
      'ACCOUNT_INACTIVE': t('payment.error_account_inactive'),
      'ACCOUNT_BLOCKED': t('payment.error_account_blocked'),
      'ACCOUNT_SUSPENDED': t('payment.error_account_inactive'),
      'LIMIT_EXCEEDED': t('payment.error_limit_exceeded'),
      'TIMEOUT_PIN': t('payment.error_timeout_pin'),
      'TIMEOUT': t('payment.error_timeout_pin'),
      'SERVICE_UNAVAILABLE': t('payment.error_service_unavailable'),
      'NETWORK_ERROR': t('payment.error_network'),
      'MISSING_PAYMENT_DETAILS': t('payment.no_provider'),
    };
    
    return errorMap[errorCode] || fallbackMessage || t('payment.error_generic');
  };

  const handlePaymentSubmit = async () => {
    console.log('[U-BookingDetail] ==============================');
    console.log('[U-BookingDetail] handlePaymentSubmit START');
    console.log('[U-BookingDetail] Provider:', selectedProvider);
    console.log('[U-BookingDetail] Number:', paymentNumber);
    console.log('[U-BookingDetail] Booking ID:', id);
    console.log('[U-BookingDetail] ==============================');
    
    if (!selectedProvider) {
      console.log('[U-BookingDetail] VALIDATION FAIL: no provider');
      Alert.alert(t('common.error'), t('payment.no_provider'));
      return;
    }
    
    if (!paymentNumber) {
      console.log('[U-BookingDetail] VALIDATION FAIL: no number');
      Alert.alert(t('common.error'), t('payment.no_number'));
      return;
    }
    
    if (phoneError) {
      console.log('[U-BookingDetail] VALIDATION FAIL: phoneError=', phoneError);
      Alert.alert(t('common.error'), phoneError);
      return;
    }
    
    // Start payment flow
    console.log('[U-BookingDetail] Starting payment flow...');
    try {
      await runPaymentFlow();
      console.log('[U-BookingDetail] runPaymentFlow() completed');
    } catch (error) {
      console.log('[U-BookingDetail] runPaymentFlow() error:', error);
    }
  };
  
  const runPaymentFlow = async () => {
    setPaymentLoading(true);
    setPaymentResult(null);
    console.log('[U-BookingDetail] Calling API: PATCH /bookings/' + id + '/action/');
    console.log('[U-BookingDetail] Payload:', JSON.stringify({
      action: 'complete',
      payment_provider: selectedProvider,
      payment_number: paymentNumber
    }));
    
    try {
      const response = await api.patch(`/bookings/${id}/action/`, { 
        action: 'complete',
        payment_provider: selectedProvider,
        payment_number: paymentNumber
      });
      
      console.log('[U-BookingDetail] ==============================');
      console.log('[U-BookingDetail] API Response! Status:', response.status);
      console.log('[U-BookingDetail] Response data:', JSON.stringify(response.data, null, 2));
      console.log('[U-BookingDetail] ==============================');
      
      // Handle 200 OK - payment completed successfully
      if (response.status === 200) {
        setPaymentResult({
          type: 'success',
          ...response.data
        });
        
        // Show detailed success alert with translations
        const successMsg = t('payment.success_message', {
          status: response.data.payment_status || 'Completed',
          amount: response.data.amount || 'N/A',
          handyman_amount: response.data.handyman_amount || 'N/A',
          fee: response.data.platform_fee || 'N/A',
          transaction_id: response.data.transaction_id || 'N/A',
          detail: response.data.detail || ''
        });
        
        Alert.alert(
          t('payment.success_title'),
          successMsg,
          [
            {
              text: t('common.ok'),
              onPress: () => {
                setPaymentModal(false);
                setSelectedProvider(null);
                setPaymentNumber('');
                setPhoneError('');
                setPaymentResult(null);
              }
            }
          ]
        );
        
        // Refresh booking data to show updated status
        const res = await api.get(`/bookings/${id}/`);
        console.log('[U-BookingDetail] Booking refreshed after payment');
        setBooking(res.data);
      }
      
    } catch (err) {
      console.log('[U-BookingDetail] ==============================');
      console.log('[U-BookingDetail] API ERROR!');
      console.log('[U-BookingDetail] Error status:', err.response?.status);
      console.log('[U-BookingDetail] Error data:', JSON.stringify(err.response?.data, null, 2));
      console.log('[U-BookingDetail] Error message:', err.message);
      console.log('[U-BookingDetail] ==============================');
      
      const errorData = err.response?.data || {};
      const statusCode = err.response?.status;
      
      setPaymentResult({
        type: 'error',
        ...errorData
      });
      
      // Get the error code and map to translated message
      const errorCode = errorData.error_code || 'UNKNOWN_ERROR';
      const rawError = errorData.detail || errorData.mesomb_raw_error || '';
      
      // Use translated error message based on error code
      let errorMsg = getErrorTranslation(errorCode, rawError);
      
      if (statusCode === 402) {
        // Payment-specific errors with helpful tips
        errorMsg = [
          errorMsg,
          '',
          t('payment.error_what_to_do'),
        ].join('\n');
      } else if (statusCode === 400) {
        errorMsg = [
          t('common.error'),
          '',
          errorMsg,
        ].join('\n');
      } else if (statusCode === 500) {
        errorMsg = [
          t('common.error'),
          '',
          errorMsg,
        ].join('\n');
      }
      
      Alert.alert(t('payment.failed_title'), errorMsg);
    } finally {
      setPaymentLoading(false);
      console.log('[U-BookingDetail] handlePaymentSubmit END');
    }
  };

  const handleModifyPrice = async () => {
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      Alert.alert(t('common.error'), t('bookings.invalid_price'));
      return;
    }
    console.log('[U-BookingDetail] Modify price to', newPrice);
    try {
      await api.patch(`/bookings/${id}/modify-price/`, { total_amount: parseFloat(newPrice) });
      console.log('[U-BookingDetail] Price modified OK');
      Alert.alert(t('common.success'), t('bookings.price_updated'));
      setModifyModal(false);
      setNewPrice('');
      const res = await api.get(`/bookings/${id}/`);
      setBooking(res.data);
    } catch (err) {
      console.error('[U-BookingDetail] Modify ERROR:', err.response?.status, err.response?.data || err.message);
      Alert.alert(t('common.error'), err.response?.data?.detail || t('bookings.modify_failed'));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#9ca3af' }}>{t('bookings.no_bookings')}</Text>
      </View>
    );
  }

  const isPending = booking.status === 'pending';
  const isAccepted = booking.status === 'accepted';
  const isCompleted = booking.status === 'completed';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('bookings.title')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Handyman Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('handyman_profile.title')}</Text>
          <View style={styles.personRow}>
            <Image
              source={{
                uri: booking.handyman?.thumbnail || `https://ui-avatars.com/api/?name=${booking.handyman?.username}&background=random`
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.personName}>{booking.handyman?.username}</Text>
              <Text style={styles.personPhone}>{booking.handyman?.phone || t('common.not_set')}</Text>
            </View>
          </View>
        </View>

        {/* Booking Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('bookings.title')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('handyman_profile.services')}</Text>
            <Text style={styles.infoValue}>{booking.service_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('handyman_profile.location')}</Text>
            <Text style={styles.infoValue}>{booking.location_name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('request.feature_book_title')}</Text>
            <Text style={styles.infoValue}>{new Date(booking.scheduled_date).toLocaleString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('handyman_profile.rate')}</Text>
            <Text style={styles.infoValue}>{booking.total_amount} FCFA</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('bookings.tab_all')}</Text>
            <Text style={[styles.status, { color: getStatusColor(booking.status) }]}>
              {booking.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('handyman_profile.about')}</Text>
          <Text style={styles.description}>{booking.job_description || t('bookings.no_description')}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {isAccepted && !isCompleted && (
            <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
              <Text style={styles.completeText}>{t('payment.complete_pay')}</Text>
            </TouchableOpacity>
          )}

          {isPending && (
            <TouchableOpacity
              style={styles.modifyButton}
              onPress={() => { setNewPrice(String(booking.total_amount || '')); setModifyModal(true); }}
            >
              <Text style={styles.modifyText}>{t('bookings.modify_price')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {(isAccepted || isCompleted) && (
          <TouchableOpacity style={styles.chatButton} onPress={() => router.push(`/chat/${id}?source=user`)}>
            <Ionicons name="chatbubble-outline" size={20} color="#6366F1" />
            <Text style={styles.chatButtonText}>{t('bookings.chat')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={modifyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('bookings.modify_modal_title')}</Text>
            <TextInput
              style={styles.priceInput} keyboardType="numeric" value={newPrice}
              onChangeText={setNewPrice} placeholder={t('bookings.price_placeholder')}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setModifyModal(false); setNewPrice(''); }}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleModifyPrice}>
                <Text style={styles.modalConfirmText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={paymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.paymentHeader}>
              <Text style={styles.modalTitle}>{t('payment.title')}</Text>
              <TouchableOpacity onPress={() => { setPaymentModal(false); setSelectedProvider(null); setPaymentNumber(''); setPhoneError(''); }}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.paymentDescription}>
              {t('payment.description')}
            </Text>

            {/* Payment Provider Selection */}
            <View style={styles.providerContainer}>
              <Text style={styles.providerLabel}>{t('payment.provider_label')}</Text>
              <View style={styles.providerButtons}>
                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    selectedProvider === 'orange' && styles.selectedProvider
                  ]}
                  onPress={() => handleProviderSelect('orange')}
                >
                  <Image 
                    source={require('@/assets/images/OM.png')} 
                    style={styles.providerImage} 
                    resizeMode="contain"
                  />
                  <Text style={styles.providerName}>{t('payment.orange_money')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.providerButton,
                    selectedProvider === 'mtn' && styles.selectedProvider
                  ]}
                  onPress={() => handleProviderSelect('mtn')}
                >
                  <Image 
                    source={require('@/assets/images/momo.png')} 
                    style={styles.providerImage} 
                    resizeMode="contain"
                  />
                  <Text style={styles.providerName}>{t('payment.mtn_money')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Phone Number Input */}
            {selectedProvider && (
              <View style={styles.phoneContainer}>
                <Text style={styles.phoneLabel}>{t('payment.phone_label')}</Text>
                <TextInput
                  style={[
                    styles.phoneInput,
                    phoneError ? styles.phoneInputError : null
                  ]}
                  keyboardType="phone-pad"
                  value={paymentNumber}
                  onChangeText={handlePaymentNumberChange}
                  placeholder={selectedProvider === 'orange' ? t('payment.phone_placeholder_orange') : t('payment.phone_placeholder_mtn')}
                  maxLength={9}
                />
                {phoneError ? (
                  <Text style={styles.errorText}>{phoneError}</Text>
                ) : (
                  <Text style={styles.hintText}>
                    {selectedProvider === 'orange' 
                      ? t('payment.phone_hint_orange')
                      : t('payment.phone_hint_mtn')
                    }
                  </Text>
                )}
              </View>
            )}

            {/* Result Feedback */}
            {paymentResult && (
              <View style={[
                styles.resultContainer,
                paymentResult.type === 'success' ? styles.resultSuccess : 
                paymentResult.type === 'pending' ? styles.resultPending : styles.resultError
              ]}>
                <Ionicons 
                  name={paymentResult.type === 'success' ? 'checkmark-circle' : 
                        paymentResult.type === 'pending' ? 'time' : 'close-circle'} 
                  size={20} 
                  color={paymentResult.type === 'success' ? '#22c55e' : 
                        paymentResult.type === 'pending' ? '#f59e0b' : '#ef4444'} 
                />
                <Text style={[
                  styles.resultText,
                  paymentResult.type === 'success' ? styles.resultTextSuccess : 
                  paymentResult.type === 'pending' ? styles.resultTextPending : styles.resultTextError
                ]}>
                  {paymentResult.type === 'success' 
                    ? t('payment.result_success')
                    : paymentResult.type === 'pending'
                    ? t('payment.result_pending')
                    : getErrorTranslation(paymentResult.error_code, paymentResult.detail || paymentResult.mesomb_error)
                  }
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <View style={styles.paymentModalButtons}>
              <TouchableOpacity 
                style={[styles.modalCancel, { flex: 1 }]} 
                onPress={() => { 
                  setPaymentModal(false); 
                  setSelectedProvider(null); 
                  setPaymentNumber(''); 
                  setPhoneError(''); 
                  setPaymentResult(null);
                }}
                disabled={paymentLoading}
              >
                <Text style={styles.modalCancelText}>{t('payment.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalConfirm, 
                  { flex: 1 },
                  (!selectedProvider || !paymentNumber || !!phoneError || paymentLoading) && styles.disabledButton
                ]} 
                onPress={handlePaymentSubmit}
                disabled={!selectedProvider || !paymentNumber || !!phoneError || paymentLoading}
              >
                {paymentLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>{t('payment.complete_pay')}</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Loading Overlay */}
            {paymentLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>{t('payment.waiting_title')}</Text>
                <Text style={styles.loadingSubtext}>
                  {t('payment.waiting_instructions')}
                </Text>
                <Text style={[styles.loadingSubtext, {color: '#ef4444', fontWeight: '600', marginTop: 8}]}>
                  {t('payment.waiting_timeout')}
                </Text>
                <TouchableOpacity 
                  style={styles.cancelLoadingButton}
                  onPress={() => {
                    setPaymentLoading(false);
                    setPaymentResult({
                      type: 'error',
                      detail: t('payment.payment_cancelled')
                    });
                  }}
                >
                  <Text style={styles.cancelLoadingText}>{t('payment.cancel_loading')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStatusColor(status) {
  const colors = { pending: '#f59e0b', accepted: '#22c55e', declined: '#ef4444', completed: '#3b82f6', paid: '#8b5cf6' };
  return colors[status] || '#6b7280';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d3e5f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    paddingVertical: 15,
    marginVertical: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  content: { padding: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  personRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  personName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  personPhone: { fontSize: 13, color: '#64748b', marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#1f2937', flex: 1, textAlign: 'right' },
  status: { fontWeight: '700', fontSize: 14 },
  description: { fontSize: 14, color: '#374151', lineHeight: 20 },
  actionsContainer: { marginTop: 8, marginBottom: 12 },
  completeButton: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  completeText: { color: 'white', fontWeight: '600', fontSize: 15 },
  modifyButton: { backgroundColor: '#f59e0b', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  modifyText: { color: 'white', fontWeight: '600', fontSize: 15 },
  chatButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f0f9ff', paddingVertical: 14, borderRadius: 10, gap: 8, marginBottom: 24,
  },
  chatButtonText: { color: '#6366F1', fontWeight: '600', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  priceInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 16, marginTop: 16 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  modalCancelText: { fontWeight: '600', color: '#475569' },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6366F1', alignItems: 'center' },
  modalConfirmText: { color: 'white', fontWeight: '700' },
  // Payment modal styles
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  providerContainer: {
    marginBottom: 24,
  },
  providerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  providerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  providerButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  selectedProvider: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  providerImage: {
    width: 60,
    height: 40,
    marginBottom: 8,
  },
  providerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  phoneContainer: {
    marginBottom: 24,
  },
  phoneLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  phoneInputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  hintText: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  paymentModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
    opacity: 0.6,
  },
  // Loading overlay styles
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cancelLoadingButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelLoadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991b1b',
  },
  // Result feedback styles
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  resultSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  resultError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  resultPending: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  resultText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  resultTextSuccess: {
    color: '#166534',
  },
  resultTextError: {
    color: '#991b1b',
  },
  resultTextPending: {
    color: '#92400e',
  },
});