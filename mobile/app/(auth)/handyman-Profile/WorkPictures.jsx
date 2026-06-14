import React, { useEffect, useState } from 'react';
import { 
  View, Text, Image, ScrollView, TouchableOpacity, 
  ActivityIndicator, StyleSheet, Dimensions, Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_SIZE = (width - 48) / COLUMN_COUNT;

export default function WorkPicturesScreen() {
  const { id, name } = useLocalSearchParams();
  const router = useRouter();
  const [pictures, setPictures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchPictures = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/handymen/${id}/`);
        // The backend serializer already limits and orders pictures
        setPictures(res.data.job_pictures || []);
      } catch (err) {
        console.error("[WorkPictures] Failed to fetch pictures:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPictures();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#202020" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}'s Work</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Previous jobs and completed projects</Text>
        
        <View style={styles.grid}>
          {pictures.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.imageWrapper}
              onPress={() => setSelectedImage(item.image)}
            >
              <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>

        {pictures.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#e5e7eb" />
            <Text style={styles.emptyText}>No work pictures available.</Text>
          </View>
        )}
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity 
            style={styles.modalCloseBtn}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>
          
          <Image 
            source={{ uri: selectedImage }} 
            style={styles.fullImage} 
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  imageWrapper: { 
    width: ITEM_SIZE, 
    height: ITEM_SIZE, 
    borderRadius: 12, 
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  image: { width: '100%', height: '100%' },
  
  emptyState: { 
    width: '100%', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 100 
  },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#9ca3af', marginTop: 12 },

  // Modal Styles
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullImage: {
    width: width,
    height: height * 0.8,
  },
});
