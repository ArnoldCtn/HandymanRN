import React, { useEffect, useState } from 'react';
import { 
  View, Text, Image, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, 
  StyleSheet
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import handymanApi from '@/services/handymanApi';


const DAYS = [
  { key:'monday', label:'Mon' }, { key:'tuesday', label:'Tue' },
  { key:'wednesday', label:'Wed' }, { key:'thursday', label:'Thu' },
  { key:'friday', label:'Fri' }, { key:'saturday', label:'Sat' },
  { key:'sunday', label:'Sun' },
]
const SHIFTS = [
  { key:'morning',   label:'Morning',   icon:'sunny-outline' },
  { key:'afternoon', label:'Afternoon', icon:'partly-sunny-outline' },
  { key:'evening',   label:'Evening',   icon:'moon-outline' },
  { key:'full_day',  label:'Full Day',  icon:'calendar-outline' },
]

export default function HandymanProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [handyman, setHandyman] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState(
      handyman?.availability ?? Object.fromEntries(DAYS.map(d => [d.key, []]))
    )

  //  function toggleShift(day, shift) {
  //   setAvailability(prev => {
  //     const current = prev[day] ?? []
  //     return {
  //       ...prev,
  //       [day]: current.includes(shift)
  //         ? current.filter(s => s !== shift)
  //         : [...current, shift]
  //     }
  //   })
  // }

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "Handyman ID not found");
      router.back();
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await handymanApi.get(`/handymen/${id}/`);
        setHandyman(res.data);
      } catch (err) {
        console.error("Failed to fetch handyman:", err?.response?.data || err.message);
        Alert.alert("Error", "Failed to load handyman profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!handyman) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Handyman not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Back Button + Header */}
      <View style={{ padding: 20,paddingTop:40, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={28} color="#202020" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Handyman Profile</Text>
      </View>

      {/* Profile Info */}
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        { handyman.thumbnail ? (
        <Image 
          source={{ uri: handyman.thumbnail }} 
          style={{ width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: '#fff' }} 
        />
        ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {handyman.username?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                ) }

        <Text style={{ fontSize: 26, fontWeight: 'bold', marginTop: 12 }}>
          {handyman.username}
        </Text>
        <Text style={{ 
          color: handyman.is_online ? '#22c55e' : '#9ca3af', 
          fontSize: 16, 
          marginTop: 4 
        }}>
          {handyman.is_online ? '● Active Now' : handyman.last_seen}
        </Text>
      </View>
      <View style={{ padding: 16 }}>
        <View style={{display:'flex',flexDirection:'row',flex:1,justifyContent:'space-around'}}>
        <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 8 }}>Email</Text>
        
        <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 8 }}>Contact</Text>
        
        </View>
        <View style={{display:'flex',flexDirection:'row',flex:1,justifyContent:'space-around'}}>
        {/* <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 8 }}>Email</Text> */}
        <Text style={{ fontSize: 15, lineHeight: 22, color: '#374151' }}>
          {handyman.email || "No Email  provided yet."}
        </Text>
        {/* <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 8 }}>Contact</Text> */}
        <Text style={{ fontSize: 15, lineHeight: 22, color: '#374151' }}>
          {handyman.phone || "No Phone number provided yet."}
        </Text>
        </View>

        <Text style={{ fontSize: 18, fontWeight: '900', marginBottom: 8 }}>About Me</Text>
        <Text style={{ fontSize: 15, lineHeight: 22, color: '#374151' }}>
          {handyman.bio || "No biography provided yet."}
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '900', marginTop: 24, marginBottom: 8 }}>
          Location
        </Text>
        <Text style={{ fontSize: 16 }}>{handyman.location}</Text>

        <Text style={{ fontSize: 18, fontWeight: '900', marginTop: 24, marginBottom: 8 }}>
          Services Offered
        </Text>
        {handyman.services && handyman.services.length > 0 ? (
          handyman.services.map((service) => (
            <View key={service.id} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
              <Ionicons name="checkmark-circle" size={18} color="#6366F1" />
              <Text style={{ marginLeft: 8, fontSize: 16 }}>{service.name}</Text>
            </View>
          ))
        ) : (
          <Text>No services listed</Text>
        )}

        <Text style={{ fontSize: 18, fontWeight: '900', marginTop: 24, marginBottom: 8 }}>
          Availability
        </Text>
        {DAYS.map(day => (
          <View key={day.key} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{day.label}</Text>
            <View style={styles.shiftRow}>
              {SHIFTS.map(shift => {
                const active = handyman.availability[day.key]?.includes(shift.key)
                return (
                  <TouchableOpacity
                    key={shift.key}
                    style={[styles.shiftBtn, active && styles.shiftBtnActive]}
                   
                  >
                    <Ionicons name={shift.icon} size={12}
                      color={active ? 'white' : '#9ca3af'} />
                    <Text style={[styles.shiftText, active && styles.shiftTextActive]}>
                      {shift.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Book Button */}
      <TouchableOpacity 
        style={{
          backgroundColor: '#6366F1',
          margin: 16,
          padding: 18,
          borderRadius: 16,
          alignItems: 'center',
        }}
        onPress={() => router.push({
        pathname:'/(auth)/handyman-Profile/handymanForm',
        params: {id : handyman.id}
      })
    }
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
          Book This Handyman
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}



const styles = StyleSheet.create({
   avatarPlaceholder: {
    width: 130, height: 130, borderRadius: 65, borderWidth: 3,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitial: { color: 'white', fontSize: 24, fontWeight: 'bold' },

  shiftRow:          { flexDirection:'row', flexWrap:'wrap', gap:6 },
  shiftBtn:          { flexDirection:'row', alignItems:'center', gap:4, paddingVertical:5, paddingHorizontal:10, borderRadius:14, borderWidth:1.5, borderColor:'#e5e7eb', backgroundColor:'#f9fafb' },
  shiftBtnActive:    { backgroundColor:'#f59e0b', borderColor:'#f59e0b' },
  shiftText:         { fontSize:11, color:'#9ca3af', fontWeight:'500' },
  shiftTextActive:   { color:'white', fontWeight:'700' },
  dayRow:            { marginBottom:12 },
  dayLabel:          { fontSize:13, fontWeight:'700', color:'#202020', marginBottom:6 },
})