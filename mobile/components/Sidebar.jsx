import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Modal, Pressable, Image, ScrollView,
  Dimensions
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/use-theme-color';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

export default function Sidebar({ visible, onClose, user, isHandyman, onLogout }) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  function resolveAvatar(thumbnail) {
    if (!thumbnail) return null;
    if (thumbnail.startsWith('http')) return thumbnail;
    return thumbnail;
  }

  const avatarUrl = resolveAvatar(user?.thumbnail);

  const menuItems = isHandyman ? [
    { label: t('sidebar.dashboard', 'Dashboard'), icon: 'grid-outline', route: 'Dashboard' },
    { label: t('sidebar.bookings', 'Bookings'), icon: 'calendar-outline', route: 'Bookings' },
    { label: t('sidebar.my_services', 'My Services'), icon: 'briefcase-outline', route: 'Myservices' },
    { label: t('sidebar.notifications', 'Notifications'), icon: 'notifications-outline', route: 'Notifications' },
    { label: t('sidebar.messages', 'Messages'), icon: 'chatbubbles-outline', route: 'ChatsList' },
    { label: t('sidebar.wallet', 'Wallet'), icon: 'wallet-outline', route: '/wallet?source=handyman' },
    { label: t('sidebar.support', 'Support'), icon: 'help-circle-outline', route: '/chat/support?source=handyman' },
  ] : [
    { label: t('sidebar.home', 'Home'), icon: 'grid-outline', route: 'Request' },
    { label: t('sidebar.my_bookings', 'My Bookings'), icon: 'book-outline', route: 'Mybookings' },
    { label: t('sidebar.favorites', 'Favorites'), icon: 'heart-outline', route: '/(auth)/Favorites' },
    { label: t('sidebar.notifications', 'Notifications'), icon: 'notifications-outline', route: 'Notifications' },
    { label: t('sidebar.messages', 'Messages'), icon: 'chatbubbles-outline', route: 'ChatsList' },
    { label: t('sidebar.wallet', 'Wallet'), icon: 'wallet-outline', route: '/wallet' },
    { label: t('sidebar.support', 'Support'), icon: 'help-circle-outline', route: '/chat/support' },
  ];

  const handleNavigate = (route) => {
    onClose();
    if (route.startsWith('/')) {
        router.push(route);
    } else {
        navigation.navigate(route);
    }
  };

  const styles = createStyles(theme);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.pressableOverlay} onPress={onClose} />
        
        <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.header}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {user?.username?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            <Text style={styles.username}>{user?.username ?? t('common.guest', 'Guest')}</Text>
            {isHandyman && user?.average_rating && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={theme.accent} />
                <Text style={styles.ratingText}>{Number(user.average_rating).toFixed(1)}</Text>
              </View>
            )}
            <Text style={styles.email}>{user?.email ?? ''}</Text>
          </View>

          <ScrollView style={styles.menu}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleNavigate(item.route)}
              >
                <Ionicons name={item.icon} size={22} color={theme.textSecondary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => { onClose(); onLogout(); }}>
              <Ionicons name="log-out-outline" size={22} color={theme.error} />
              <Text style={styles.logoutText}>{t('auth.logout', 'Logout')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (theme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pressableOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: theme.surface,
    paddingTop: 50,
    elevation: 10,
    shadowColor: theme.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 5, height: 0 },
    borderRightWidth: 1,
    borderColor: theme.border
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderColor: theme.accent,
    borderWidth: 2
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  email: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accent + '11',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.accent + '22',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.accent,
  },
  menu: {
    flex: 1,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  menuLabel: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    color: theme.error,
    fontWeight: '600',
  },
});
