import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, FlatList, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import handymanApi from '@/services/handymanApi';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function AllServicesScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handymanApi.get('/handymen/services/').then(res => {
      // Sort by ID descending (assuming higher ID is newer)
      const sorted = res.data.sort((a, b) => b.id - a.id);
      setServices(sorted);
      setLoading(false);
    });
  }, []);

  const styles = createStyles(theme);

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.headerTitle}>{t('sidebar.my_services')} ({services.length})</ThemedText>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={services}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.cardImage} />
            ) : (
              <View style={styles.cardImagePlaceholder}>
                <Ionicons name="construct-outline" size={32} color={theme.textSecondary} />
              </View>
            )}
            <View style={styles.cardBody}>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText type="secondary" style={styles.cardDesc}>{item.description}</ThemedText>
            </View>
          </View>
        )}
      />
    </ThemedView>
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border
  },
  cardImage: { width: 60, height: 60, borderRadius: 8 },
  cardImagePlaceholder: { width: 60, height: 60, borderRadius: 8, backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, marginLeft: 12 },
  cardDesc: { fontSize: 12, marginTop: 4 }
});
