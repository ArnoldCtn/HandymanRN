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

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_SIZE = (width - 48) / COLUMN_COUNT;

export default function JobPicturesScreen() {
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
      Alert.alert("Limit Reached", `Your ${subscription} subscription allows a maximum of ${limit} pictures.`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to upload them.');
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
      Alert.alert("Success", "Picture uploaded successfully!");
    } catch (err) {
      console.error("[JobPictures] Upload failed:", err);
      const msg = err.response?.data?.detail || "Could not upload picture. Check your connection or subscription limit.";
      Alert.alert("Upload Failed", msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    Alert.alert(
      "Delete Picture",
      "Are you sure you want to remove this picture?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await handymanApi.delete(`/handymen/me/job-pictures/${id}/`);
              await refreshHandyman();
            } catch (err) {
              Alert.alert("Error", "Could not delete picture.");
            }
          } 
        }
      ]
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#202020" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Pictures</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.subscriptionLabel}>Current Plan: <Text style={styles.planName}>{subscription.toUpperCase()}</Text></Text>
          <Text style={styles.limitText}>
            {limit === Infinity ? "Unlimited pictures" : `Limit: ${pictures.length} / ${limit} pictures`}
          </Text>
          {limit !== Infinity && remaining > 0 && (
            <Text style={styles.remainingText}>You can add {remaining} more pictures.</Text>
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
              <Text style={styles.uploadBtnText}>Upload New Picture</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Your Portfolio</Text>

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
              <Ionicons name="images-outline" size={64} color="#e5e7eb" />
              <Text style={styles.emptyText}>No job pictures yet.</Text>
              <Text style={styles.emptySubText}>Show off your work to attract more customers!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: 50, 
    paddingBottom: 15, 
    paddingHorizontal: 16, 
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#202020' },
  backBtn: { padding: 4 },
  
  content: { padding: 16 },
  
  infoCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  subscriptionLabel: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  planName: { fontWeight: '800', color: '#6366F1' },
  limitText: { fontSize: 16, fontWeight: '700', color: '#202020' },
  remainingText: { fontSize: 13, color: '#10b981', marginTop: 4, fontWeight: '600' },
  
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
    marginBottom: 24,
  },
  uploadBtnDisabled: { backgroundColor: '#9ca3af' },
  uploadBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#202020', marginBottom: 16 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  imageWrapper: { 
    width: ITEM_SIZE, 
    height: ITEM_SIZE, 
    borderRadius: 12, 
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
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
  emptyText: { fontSize: 16, fontWeight: '700', color: '#9ca3af', marginTop: 12 },
  emptySubText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 4, paddingHorizontal: 40 },
});
