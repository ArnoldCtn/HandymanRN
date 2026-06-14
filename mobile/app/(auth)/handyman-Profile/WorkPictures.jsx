import React, { useEffect, useState } from 'react';
import { 
  View, Text, Image, ScrollView, TouchableOpacity, 
  ActivityIndicator, StyleSheet, Dimensions, Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/use-theme-color';

const { width, height } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_SIZE = (width - 48) / COLUMN_COUNT;

export default function WorkPicturesScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
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
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const screenStyles = createStyles(theme);

  return (
    <View style={screenStyles.root}>
      <View style={screenStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={screenStyles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={screenStyles.headerTitle}>{name}{t('work_pictures.possessive', "'s")} {t('work_pictures.work', 'Work')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={screenStyles.content}>
        <Text style={screenStyles.subtitle}>{t('work_pictures.subtitle', 'Previous jobs and completed projects')}</Text>
        
        <View style={screenStyles.grid}>
          {pictures.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={screenStyles.imageWrapper}
              onPress={() => setSelectedImage(item.image)}
            >
              <Image source={{ uri: item.image }} style={screenStyles.image} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </View>

        {pictures.length === 0 && (
          <View style={screenStyles.emptyState}>
            <Ionicons name="images-outline" size={64} color={theme.border} />
            <Text style={screenStyles.emptyText}>{t('work_pictures.no_pics', 'No work pictures available.')}</Text>
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
        <View style={screenStyles.modalRoot}>
          <TouchableOpacity 
            style={screenStyles.modalCloseBtn}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>
          
          <Image 
            source={{ uri: selectedImage }} 
            style={screenStyles.fullImage} 
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  subtitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 20 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  imageWrapper: { 
    width: ITEM_SIZE, 
    height: ITEM_SIZE, 
    borderRadius: 12, 
    overflow: 'hidden',
    backgroundColor: theme.border,
    elevation: 2,
    shadowColor: theme.shadow,
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
  emptyText: { fontSize: 16, fontWeight: '700', color: theme.textSecondary, marginTop: 12 },

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
