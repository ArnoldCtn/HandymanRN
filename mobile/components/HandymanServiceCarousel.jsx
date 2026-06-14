import React from 'react';
import { View, Text, Image, StyleSheet, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';

export default function HandymanServiceCarousel({ services }) {
  const theme = useAppTheme();
  
  const styles = createStyles(theme);

  const renderCard = ({ item }) => (
    <View style={styles.card} pointerEvents="none">
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Ionicons name="construct-outline" size={32} color={theme.textSecondary} />
        </View>
      )}
      <View style={styles.cardBody}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.name}</ThemedText>
        <ThemedText type="secondary" style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <View style={styles.carouselContainer}>
      <FlatList
        data={services.slice(0, 10)}
        keyExtractor={item => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={renderCard}
      />
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  carouselContainer: {
    marginVertical: 10,
  },
  list: { paddingHorizontal: 16 },
  card: {
    width: 150,
    backgroundColor: theme.card,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  cardImage: { width: '100%', height: 100 },
  cardImagePlaceholder: { width: '100%', height: 100, backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 10 },
  cardDesc: { fontSize: 11, marginTop: 4 },
});
