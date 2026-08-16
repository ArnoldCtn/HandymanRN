import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import useGlobal from '@/services/global';
import HomeScreen from './Home';
import MybookingsScreen from './Mybookings';
import FavoritesScreen from './Favorites';
import NotificationsScreen from './Notifications';
import ProfileScreen from './Profile';

const ACTIVE = '#0277BD';
const INACTIVE = '#4FC3F7';

const TABS = [
  {
    key: 'Home',
    title: 'Home',
    icon: (color) => <IconSymbol size={28} name="house.fill" color={color} />,
  },
  {
    key: 'Mybookings',
    title: 'Bookings',
    icon: (color) => <Feather name="book-open" size={24} color={color} />,
  },
  // {
  //   key: 'Favorites',
  //   title: 'Favorites',
  //   icon: (color) => <Ionicons name="heart" size={24} color={color} />,
  // },
  {
    key: 'Notifications',
    title: 'Notifications',
    icon: (color) => <Ionicons name="notifications" size={25} color={color} />,
  },
  {
    key: 'Profile',
    title: 'Profile',
    icon: (color) => <Ionicons name="person" size={25} color={color} />,
  },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Home');
  const authenticated = useGlobal(state => state.authenticated);

  if (!authenticated) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.screen, activeTab !== 'Home' && styles.hidden]}>
          <HomeScreen />
        </View>
        <View style={[styles.screen, activeTab !== 'Mybookings' && styles.hidden]}>
          <MybookingsScreen />
        </View>
        {/* <View style={[styles.screen, activeTab !== 'Favorites' && styles.hidden]}>
          <FavoritesScreen />
        </View> */}
        <View style={[styles.screen, activeTab !== 'Notifications' && styles.hidden]}>
          <NotificationsScreen />
        </View>
        <View style={[styles.screen, activeTab !== 'Profile' && styles.hidden]}>
          <ProfileScreen />
        </View>
      </View>
      <View
        style={[
          styles.tabBar,
          {
            height: 60 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
          },
        ]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const color = isActive ? ACTIVE : INACTIVE;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}>
              {tab.icon(color)}
              <Text
                style={[
                  styles.tabLabel,
                  { color },
                ]}>
                {tab.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderTopColor: '#1F1F1F',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    transform: [{ translateY: -6 }],
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
