import React, { useState } from 'react';
import { 
  View, Text, Image, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, StyleSheet, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import useHandymanGlobal from '@/services/handymanGlobal';
import handymanApi from '@/services/handymanApi';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/use-theme-color';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_SIZE = (width - 48) / COLUMN_COUNT;

export default function JobPicturesScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const handyman = useHandymanGlobal(s => s.handyman);
  const refreshHandyman = useHandymanGlobal(s => s.refreshHandyman);
  const [uploading, setUploading] = useState(false);

  const pictures = handyman?.job_pictures || [];
  const subscription = handyman?.subscription_level || 'free';

  const limits = {
    free: 2,
    pro: 6,
    premium: Infinity
  };

  const limit = limits[subscription];
  const remaining = limit - pictures.length;

  async function handlePickImage() {
    if (pictures.length >= limit) {
      Alert.alert(t('job_pictures.limit_reached', "Limit Reached"), t('job_pictures.limit_msg', { subscription, limit }, `Your ${subscription} subscription allows a maximum of ${limit} pictures.`));
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('job_pictures.permission_denied', 'We need access to your photos to upload them.'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      handleUpload(result.assets[0].base64);
    }
  }

  async function handleUpload(base64) {
    setUploading(true);
    try {
      const data = {
        image: `data:image/jpeg;base64,${base64}`,
        description: "" 
      };
      await handymanApi.post('/handymen/me/job-pictures/', data);
      await refreshHandyman();
      Alert.alert(t('common.success'), t('job_pictures.upload_success', "Picture uploaded successfully!"));
    } catch (err) {
      console.error("[JobPictures] Upload failed:", err);
      const msg = err.response?.data?.detail || t('job_pictures.upload_failed', "Could not upload picture. Check your connection or subscription limit.");
      Alert.alert(t('common.error'), msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    Alert.alert(
      t('job_pictures.delete_title', "Delete Picture"),
      t('job_pictures.delete_confirm', "Are you sure you want to remove this picture?"),
      [
        { text: t('common.cancel'), style: "cancel" },
        { 
          text: t('common.delete'), 
          style: "destructive", 
          onPress: async () => {
            try {
              await handymanApi.delete(`/handymen/me/job-pictures/${id}/`);
              await refreshHandyman();
            } catch (err) {
              Alert.alert(t('common.error'), t('job_pictures.delete_failed', "Could not delete picture."));
            }
          } 
        }
      ]
    );
  }

  const styles = createStyles(theme);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('handyman_profile.manage_pics')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.subscriptionLabel}>{t('job_pictures.current_plan', 'Current Plan')}: <Text style={styles.planName}>{subscription.toUpperCase()}</Text></Text>
          <Text style={styles.limitText}>
            {limit === Infinity ? t('job_pictures.unlimited', "Unlimited pictures") : `${t('job_pictures.limit', 'Limit')}: ${pictures.length} / ${limit} ${t('job_pictures.pictures', 'pictures')}`}
          </Text>
          {limit !== Infinity && remaining > 0 && (
            <Text style={styles.remainingText}>{t('job_pictures.remaining', { count: remaining }, `You can add ${remaining} more pictures.`)}</Text>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.uploadBtn, (pictures.length >= limit || uploading) && styles.uploadBtnDisabled]}
          onPress={handlePickImage}
          disabled={uploading || pictures.length >= limit}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={24} color="white" />
              <Text style={styles.uploadBtnText}>{t('job_pictures.upload_btn', 'Upload New Picture')}</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t('handyman_profile.portfolio')}</Text>

        <View style={styles.grid}>
          {pictures.map((item) => (
            <View key={item.id} style={styles.imageWrapper}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color="white" />
              </TouchableOpacity>
            </View>
          ))}

          {pictures.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={64} color={theme.border} />
              <Text style={styles.emptyText}>{t('job_pictures.no_pics', 'No job pictures yet.')}</Text>
              <Text style={styles.emptySubText}>{t('job_pictures.empty_sub', 'Show off your work to attract more customers!')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: 50, 
    paddingBottom: 15, 
    paddingHorizontal: 16, 
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderColor: theme.border
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  backBtn: { padding: 4 },
  
  content: { padding: 16 },
  
  infoCard: { 
    backgroundColor: theme.surface, 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border
  },
  subscriptionLabel: { fontSize: 14, color: theme.textSecondary, marginBottom: 4 },
  planName: { fontWeight: '800', color: theme.primary },
  limitText: { fontSize: 16, fontWeight: '700', color: theme.text },
  remainingText: { fontSize: 13, color: theme.success, marginTop: 4, fontWeight: '600' },
  
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
    marginBottom: 24,
  },
  uploadBtnDisabled: { backgroundColor: theme.textSecondary },
  uploadBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.text, marginBottom: 16 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  imageWrapper: { 
    width: ITEM_SIZE, 
    height: ITEM_SIZE, 
    borderRadius: 12, 
    overflow: 'hidden',
    backgroundColor: theme.border,
    position: 'relative'
  },
  image: { width: '100%', height: '100%' },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  emptyState: { 
    width: '100%', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 60 
  },
  emptyText: { fontSize: 16, fontWeight: '700', color: theme.textSecondary, marginTop: 12 },
  emptySubText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 40 },
});
