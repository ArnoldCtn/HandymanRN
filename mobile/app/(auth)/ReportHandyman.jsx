import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, StyleSheet
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/use-theme-color';

const REPORT_REASONS = [
  { key: 'arnaque', label: 'Arnaque / Fraude', icon: 'cash-outline' },
  { key: 'spam', label: 'Spam', icon: 'megaphone-outline' },
  { key: 'comportement_inapproprie', label: 'Comportement inapproprié', icon: 'hand-left-outline' },
];

export default function ReportHandymanScreen() {
  const { id, username } = useLocalSearchParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const theme = useAppTheme();

  const [selectedReason, setSelectedReason] = useState(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isFrench = i18n.language?.startsWith('fr');

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
        router.back();
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

  if (submitted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
        <Text style={[styles.successTitle, { color: '#166534' }]}>
          {isFrench ? 'Signalement envoyé !' : 'Report sent!'}
        </Text>
        <Text style={[styles.successMessage, { color: '#6b7280' }]}>
          {isFrench
            ? 'Merci. Notre équipe examinera votre signalement.'
            : 'Thank you. Our team will review your report.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isFrench ? 'Signaler un artisan' : 'Report Handyman'}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="warning-outline" size={40} color="#ef4444" />
          <Text style={[styles.infoTitle, { color: theme.text }]}>
            {isFrench ? 'Signaler un problème' : 'Report an Issue'}
          </Text>
          <Text style={[styles.infoMessage, { color: theme.textSecondary }]}>
            {isFrench
              ? `Vous signalez ${username}. Veuillez sélectionner le motif du signalement.`
              : `You are reporting ${username}. Please select the reason for your report.`}
          </Text>
        </View>

        {/* Reason Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {isFrench ? 'Motif du signalement *' : 'Reason for report *'}
          </Text>
          {REPORT_REASONS.map((reason) => {
            const isSelected = selectedReason === reason.key;
            return (
              <TouchableOpacity
                key={reason.key}
                style={[
                  styles.reasonCard,
                  {
                    backgroundColor: isSelected ? '#fee2e2' : theme.surface,
                    borderColor: isSelected ? '#ef4444' : theme.border,
                  },
                ]}
                onPress={() => setSelectedReason(reason.key)}
              >
                <Ionicons
                  name={reason.icon}
                  size={24}
                  color={isSelected ? '#ef4444' : theme.textSecondary}
                />
                <View style={styles.reasonContent}>
                  <Text
                    style={[
                      styles.reasonLabel,
                      { color: isSelected ? '#991b1b' : theme.text },
                    ]}
                  >
                    {reason.label}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color="#ef4444" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {isFrench ? 'Détails supplémentaires (optionnel)' : 'Additional details (optional)'}
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            multiline
            numberOfLines={6}
            placeholder={isFrench ? 'Décrivez le problème en détail...' : 'Describe the issue in detail...'}
            placeholderTextColor={theme.textSecondary}
            value={additionalDetails}
            onChangeText={setAdditionalDetails}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: selectedReason ? '#ef4444' : '#d1d5db',
            },
          ]}
          onPress={handleSubmitReport}
          disabled={!selectedReason || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color="white" />
              <Text style={styles.submitButtonText}>
                {isFrench ? 'Envoyer le signalement' : 'Send Report'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Note */}
        <View style={[styles.noteCard, { backgroundColor: '#fef3c9', borderColor: '#fcd34d' }]}>
          <Ionicons name="information-circle-outline" size={20} color="#92400e" />
          <Text style={[styles.noteText, { color: '#92400e' }]}>
            {isFrench
              ? 'Les signalements sont examinés par notre équipe dans les 24-48 heures. Merci de votre aide pour maintenir une communauté sûre.'
              : 'Reports are reviewed by our team within 24-48 hours. Thank you for helping keep our community safe.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: 20 },
  infoCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  infoTitle: { fontSize: 20, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  infoMessage: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    gap: 12,
  },
  reasonContent: { flex: 1 },
  reasonLabel: { fontSize: 15, fontWeight: '500' },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 14,
    gap: 10,
    marginBottom: 16,
  },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  noteCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 20 },
  successTitle: { fontSize: 24, fontWeight: '700', marginTop: 20, marginBottom: 12 },
  successMessage: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});