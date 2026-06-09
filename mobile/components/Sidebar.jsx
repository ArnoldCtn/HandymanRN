import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Modal, Pressable, Image, ScrollView,
  Dimensions
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

import Myservices from '@/app/handyman/Myservices'


const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

export default function Sidebar({ visible, onClose, user, isHandyman, onLogout }) {
  const router = useRouter();
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
    const base = isHandyman ? 'http://192.168.43.188:8000/media/' : 'http://192.168.1.XXX:8000/media/';
    return `${base}${thumbnail}`;
  }

  const avatarUrl = resolveAvatar(user?.thumbnail);

  const menuItems = isHandyman ? [
    { label: 'Dashboard', icon: 'grid-outline', route: '/handyman/Home' },
    { label: 'Bookings', icon: 'calendar-outline', route: '/handyman/Bookings' },
    { label: 'My Services', icon: 'briefcase-outline', route: '/handyman/Myservices' },
    { label: 'Reviews', icon: 'star-outline', route: '/handyman/Reviews' },
    { label: 'Notifications', icon: 'notifications-outline', route: '/handyman/Notifications' },
    { label: 'Messages', icon: 'chatbubbles-outline', route: '/handyman/ChatsList' },
    { label: 'Wallet', icon: 'wallet-outline', route: '/wallet?source=handyman' },
    { label: 'Subscription', icon: 'card-outline', route: '/handyman/Subscription' },
    { label: 'Support', icon: 'help-circle-outline', route: '/chat/support?source=handyman' },
  ] : [
    { label: 'Home', icon: 'grid-outline', route: '/(auth)/Home' },
    { label: 'My Bookings', icon: 'book-outline', route: '/(auth)/Mybookings' },
    { label: 'Notifications', icon: 'notifications-outline', route: '/(auth)/Notifications' },
    { label: 'Messages', icon: 'chatbubbles-outline', route: '/(auth)/ChatsList' },
    { label: 'Wallet', icon: 'wallet-outline', route: '/wallet' },
    { label: 'Support', icon: 'help-circle-outline', route: '/chat/support' },
  ];

  const handleNavigate = (route) => {
    onClose();
    router.push(route);
  };

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
            <Text style={styles.username}>{user?.username ?? 'Guest'}</Text>
            {isHandyman && user?.average_rating && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#f59e0b" />
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
                <Ionicons name={item.icon} size={22} color="#4b5563" />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => { onClose(); onLogout(); }}>
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'white',
    paddingTop: 50,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 5, height: 0 },
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderColor:'#f59e0b',

  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
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
    color: '#1f2937',
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
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
    color: '#374151',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
});
