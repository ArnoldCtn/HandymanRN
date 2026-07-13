import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import handymanApi from '@/services/handymanApi';
import api from '@/services/api';
import { useTranslation } from 'react-i18next';

const REPORT_REASONS = [
  { key: 'arnaque', label: 'Arnaque / Fraude', icon: 'cash-outline' },
  { key: 'spam', label: 'Spam', icon: 'megaphone-outline' },
  { key: 'comportement_inapproprie', label: 'Comportement inapproprié', icon: 'hand-left-outline' },
];

export default function HandymanProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const [handyman, setHandyman] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isFrench = i18n.language?.startsWith('fr');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await handymanApi.get(`/handymen/${id}/`);
        setHandyman(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert(
        isFrench ? 'Erreur' : 'Error',
        isFrench ? 'Veuillez sélectionner un motif' : 'Please select a reason'
      );
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reports/', {
        reported_handyman: parseInt(id),
        reason: selectedReason,
        additional_details: additionalDetails,
      });
      setSubmitted(true);
      setTimeout(() => {
        setReportModal(false);
        setSubmitted(false);
        setSelectedReason(null);
        setAdditionalDetails('');
      }, 2000);
    } catch (err) {
      console.error('Report error:', err);
      Alert.alert(
        isFrench ? 'Erreur' : 'Error',
        isFrench ? 'Échec de l\'envoi du signalement' : 'Failed to submit report'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header with back button + 3-dot menu */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setReportModal(true)}>
          <Ionicons name="ellipsis-vertical" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Avatar + Name */}
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Image
          source={{ uri: handyman?.thumbnail || `https://ui-avatars.com/api/?name=${handyman?.username}&background=random` }}
          style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#FCD116' }}
        />
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 12 }}>{handyman?.username}</Text>
        <Text style={{ color: handyman?.is_online ? '#22c55e' : '#9ca3af', marginTop: 4 }}>
          {handyman?.is_online ? '● Online' : '○ Offline'}
        </Text>
        {handyman?.average_rating && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={{ fontWeight: '700', color: '#1f2937' }}>{Number(handyman.average_rating).toFixed(1)}</Text>
            <Text style={{ color: '#9ca3af' }}>({handyman.total_ratings || 0})</Text>
          </View>
        )}
      </View>

      {/* About */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>About</Text>
        <Text style={{ color: '#4b5563', lineHeight: 22 }}>{handyman?.bio || 'No bio available'}</Text>
      </View>

      {/* Services & Categories */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Services & Categories</Text>
        {handyman?.services?.map(service => {
          // Get categories for this service
          const serviceCategories = handyman?.categories?.filter(cat => {
            const catServiceId = typeof cat.service === 'object' ? cat.service?.id : cat.service;
            return catServiceId === service.id;
          }) || [];

          return (
            <View key={service.id} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                <Ionicons name="construct-outline" size={16} color="#6366F1" />
                <Text style={{ color: '#374151', fontWeight: '600', fontSize: 15 }}>{service.name}</Text>
              </View>
              {serviceCategories.length > 0 ? (
                <View style={{ marginLeft: 28, marginTop: 6 }}>
                  {serviceCategories.map(cat => (
                    <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
                      <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
                      <Text style={{ color: '#6b7280', fontSize: 14 }}>{cat.name}</Text>
                      {cat.price && (
                        <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '600', marginLeft: 'auto' }}>
                          {cat.price} FCFA
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ marginLeft: 28, color: '#9ca3af', fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>
                  No categories defined
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Reviews */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Reviews</Text>
        <Text style={{ color: '#9ca3af' }}>Reviews coming soon...</Text>
      </View>

      {/* Book Button */}
      <TouchableOpacity
        style={{ backgroundColor: '#6366F1', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' }}
        onPress={() => router.push(`/booking/${id}`)}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Book This Handyman</Text>
      </TouchableOpacity>

      {/* Report Modal */}
      <Modal visible={reportModal} transparent animationType="slide">
        <View style={{
          flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, maxHeight: '80%',
          }}>
            {submitted ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#166534', marginTop: 16 }}>
                  {isFrench ? 'Signalement envoyé !' : 'Report sent!'}
                </Text>
                <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
                  {isFrench
                    ? 'Merci. Notre équipe examinera votre signalement.'
                    : 'Thank you. Our team will review your report.'}
                </Text>
              </View>
            ) : (
              <>
                {/* Modal Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#1f2937' }}>
                    {isFrench ? 'Signaler' : 'Report'} {handyman?.username}
                  </Text>
                  <TouchableOpacity onPress={() => { setReportModal(false); setSelectedReason(null); setAdditionalDetails(''); }}>
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                {/* Reason Selection */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                  {isFrench ? 'Motif du signalement :' : 'Reason for report:'}
                </Text>
                {REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.key}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      padding: 14, borderRadius: 12, marginBottom: 8,
                      backgroundColor: selectedReason === reason.key ? '#fee2e2' : '#f9fafb',
                      borderWidth: 1,
                      borderColor: selectedReason === reason.key ? '#ef4444' : '#e5e7eb',
                    }}
                    onPress={() => setSelectedReason(reason.key)}
                  >
                    <Ionicons name={reason.icon} size={20} color={selectedReason === reason.key ? '#ef4444' : '#6b7280'} />
                    <Text style={{
                      fontSize: 15, fontWeight: '500',
                      color: selectedReason === reason.key ? '#991b1b' : '#374151',
                    }}>
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Additional Details */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 }}>
                  {isFrench ? 'Détails supplémentaires (optionnel) :' : 'Additional details (optional):'}
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
                    padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top',
                    backgroundColor: '#f9fafb',
                  }}
                  multiline
                  placeholder={isFrench ? 'Décrivez le problème...' : 'Describe the issue...'}
                  placeholderTextColor="#9ca3af"
                  value={additionalDetails}
                  onChangeText={setAdditionalDetails}
                />

                {/* Submit Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: selectedReason ? '#ef4444' : '#d1d5db',
                    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
                    marginTop: 20, opacity: submitting ? 0.7 : 1,
                  }}
                  onPress={handleSubmitReport}
                  disabled={!selectedReason || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                      {isFrench ? 'Envoyer le signalement' : 'Send Report'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}