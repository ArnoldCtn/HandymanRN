import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import handymanApi from '@/services/handymanApi';

export default function HandymanProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [handyman, setHandyman] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await handymanApi.get(`/handymen/${id}/`);   // You may need to add this detail view
        setHandyman(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header with back button + avatar */}
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Image 
          source={{ uri: handyman?.thumbnail }} 
          style={{ width: 120, height: 120, borderRadius: 60 }} 
        />
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 12 }}>{handyman?.username}</Text>
        <Text style={{ color: handyman?.is_online ? 'green' : 'gray' }}>
          {handyman?.is_online ? '● Online' : 'Offline'}
        </Text>
      </View>

      {/* Info */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>About</Text>
        <Text>{handyman?.bio || 'No bio available'}</Text>

        <Text style={{ marginTop: 20, fontSize: 18, fontWeight: '600' }}>Services</Text>
        {handyman?.services?.map(s => (
          <Text key={s.id}>• {s.name}</Text>
        ))}
      </View>

      {/* Reviews Section (placeholder) */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>Reviews</Text>
        <Text style={{ color: '#666' }}>Reviews coming soon...</Text>
      </View>

      {/* Book Button */}
      <TouchableOpacity 
        style={{ backgroundColor: '#6366F1', margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' }}
        onPress={() => router.push(`/booking/${id}`)}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Book This Handyman</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}