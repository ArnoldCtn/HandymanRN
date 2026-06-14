import React, { useEffect, useState } from 'react';
import { 
  View, Text, Image, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, 
  StyleSheet
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '@/services/api';
import { addFavorite, removeFavorite, getFavorites } from '@/services/favorites';


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
  const [isFavorite, setIsFavorite] = useState(false);
  const [availability, setAvailability] = useState(
      handyman?.availability ?? Object.fromEntries(DAYS.map(d => [d.key, []]))
    )

  const [reviews, setReviews] = useState([]);
const [reviewsLoading, setReviewsLoading] = useState(false);
const [reviewsPage, setReviewsPage] = useState(1);
const [totalReviews, setTotalReviews] = useState(0);
const REVIEWS_PER_PAGE = 5;

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


 const fetchReviews = async (page = 1) => {
  try {
    setReviewsLoading(true);
    console.log('[PROFILE] Fetching reviews page:', page);
    const response = await api.get(`/ratings/handyman/${id}/?page=${page}&limit=${REVIEWS_PER_PAGE}`);
    
    // Handle different response structures
    const reviewsData = response.data.results || response.data || [];
    const totalCount = response.data.count || response.data.length || reviewsData.length;
    
    console.log('[PROFILE] Reviews response:', response.data);
    console.log('[PROFILE] Parsed reviews:', reviewsData);
    
    setReviews(reviewsData);
    setTotalReviews(totalCount);
    setReviewsPage(page);
  } catch (err) {
    console.error('[PROFILE] Failed to fetch reviews:', err?.response?.data || err.message);
  } finally {
    setReviewsLoading(false);
  }
};
  

  const renderStars = (rating) => {
  if (!rating) return null;

  // Show 10 stars for 1-10 rating scale
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 10 - fullStars - (hasHalfStar ? 1 : 0);

    console.log('[PROFILE] Star calculation:', { fullStars, hasHalfStar, emptyStars });
 

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
      {[...Array(fullStars)].map((_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={12} color="#f59e0b" />
      ))}
      {hasHalfStar && (
        <Ionicons key="half" name="star-half" size={12} color="#f59e0b" />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Ionicons key={`empty-${i}`} name="star-outline" size={12} color="#d1d5db" />
      ))}
      <Text style={{ marginLeft: 8, fontSize: 14, color: '#6b7280' }}>
        {rating}/10 ({handyman.total_ratings} {handyman.total_ratings === 1 ? 'rating' : 'ratings'})
      </Text>
    </View>
  );
};

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "Handyman ID not found");
      router.back();
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/handymen/${id}/`);
        setHandyman(res.data);

         // Fetch reviews after handyman data is loaded
      await fetchReviews(1);
      } catch (err) {
        console.error("Failed to fetch handyman:", err?.response?.data || err.message);
        Alert.alert("Error", "Failed to load handyman profile");
      } finally {
        setLoading(false);
      }
    };

    const checkFavorite = async () => {
      try {
          const res = await getFavorites();
          const fav = res.data.find(f => f.handyman.id === parseInt(id));
          setIsFavorite(!!fav);
      } catch (e) {
          console.error("Error checking favorites", e);
      }
    }

    fetchProfile();
    checkFavorite();
  }, [id]);

  const toggleFavorite = async () => {
    try {
        if (isFavorite) {
            await removeFavorite(id);
            setIsFavorite(false);
        } else {
            await addFavorite(id);
            setIsFavorite(true);
        }
    } catch (e) {
        console.error(e);
        Alert.alert("Error", "Failed to update favorites");
    }
  }

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

  const resolveAvatar = (thumbnail) => {
  if (!thumbnail) return null;
  if (thumbnail.startsWith('http')) return thumbnail;
  return `http://192.168.43.188:8000/media/${thumbnail}`;
};

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Back Button + Header */}
      <View style={{ padding: 20,paddingTop:40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={28} color="#202020" />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: '700' }}>Handyman Profile</Text>
        </View>
        <TouchableOpacity onPress={toggleFavorite}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={28} color={isFavorite ? "#ef4444" : "#202020"} />
        </TouchableOpacity>
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

       <TouchableOpacity 
  onPress={() => router.push(`/(auth)/handyman-Profile/rating/${handyman.id}`)}
  style={{ 
    padding: 12, 
    borderRadius: 20, 
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16
  }}
>
  <Text style={{ color: 'white', fontWeight: '600', marginRight: 8 }}>
    Rate
  </Text>
  {renderStars(handyman.average_rating)}
</TouchableOpacity>

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

      {/* View Pictures Button */}
      <TouchableOpacity 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          marginHorizontal: 16,
          marginBottom: 10,
          padding: 15,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#6366F1',
          gap: 10
        }}
        onPress={() => router.push({
          pathname: `/(auth)/handyman-Profile/WorkPictures`,
          params: { id: handyman.id, name: handyman.username }
        })}
      >
        <Ionicons name="images-outline" size={22} color="#6366F1" />
        <Text style={{ color: '#6366F1', fontWeight: 'bold', fontSize: 16 }}>
          View Handyman Work Pictures
        </Text>
      </TouchableOpacity>

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

      {/* Reviews Section */}
{/* Reviews Section */}
<View style={{ padding: 16, marginTop: 24 }}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
    <Text style={{ fontSize: 18, fontWeight: '900' }}>
      Reviews ({totalReviews})
    </Text>
    {totalReviews > REVIEWS_PER_PAGE && (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity 
          onPress={() => fetchReviews(reviewsPage - 1)}
          disabled={reviewsPage === 1}
          style={{ 
            padding: 8, 
            marginRight: 8,
            opacity: reviewsPage === 1 ? 0.5 : 1 
          }}
        >
          <Ionicons name="chevron-back" size={20} color="#6366F1" />
        </TouchableOpacity>
        <Text style={{ fontSize: 14, color: '#6b7280', marginHorizontal: 8 }}>
          {reviewsPage}
        </Text>
        <TouchableOpacity 
          onPress={() => fetchReviews(reviewsPage + 1)}
          disabled={reviewsPage * REVIEWS_PER_PAGE >= totalReviews}
          style={{ 
            padding: 8,
            opacity: reviewsPage * REVIEWS_PER_PAGE >= totalReviews ? 0.5 : 1 
          }}
        >
          <Ionicons name="chevron-forward" size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>
    )}
  </View>

  {reviewsLoading ? (
    <View style={{ alignItems: 'center', padding: 20 }}>
      <ActivityIndicator size="small" color="#6366F1" />
      <Text style={{ marginTop: 8, color: '#6b7280' }}>Loading reviews...</Text>
    </View>
  ) : reviews.length > 0 ? (
    reviews.map((review, index) => (
      <View key={review.id} style={{ 
        backgroundColor: 'white', 
        padding: 16, 
        borderRadius: 12, 
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}>
        {/* User Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
          {/* User Avatar */}
          <View style={{ marginRight: 12 }}>
            {review.user_info?.thumbnail ? (
              <Image 
                source={{ uri: review.user_info.thumbnail.startsWith('http') ? review.user_info.thumbnail : `http://192.168.43.188:8000/media/${review.user_info.thumbnail}` }} 
                style={{ width: 40, height: 40, borderRadius: 20 }} 
              />
            ) : (
              <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: '#6366F1',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                  {review.user_info?.username?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </View>
          
          {/* User Info and Rating */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', fontSize: 16, color: '#1f2937' }}>
                  {review.user_info?.username || 'Anonymous User'}
                </Text>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {new Date(review.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </View>
              <View style={{ alignItems: 'flex-end' }}>
                {renderStars(review.rating)}
              </View>
          </View>
        </View>
        
        {/* Review Text */}
        {review.review && (
          <View style={{ 
            backgroundColor: '#f9fafb', 
            padding: 12, 
            borderRadius: 8, 
            borderLeftWidth: 3, 
            borderLeftColor: '#6366F1' 
          }}>
            <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 20 }}>
              {review.review}
            </Text>
          </View>
        )}
      </View>
    ))
  ) : (
    <View style={{ alignItems: 'center', padding: 20 }}>
      <Ionicons name="star-outline" size={48} color="#d1d5db" />
      <Text style={{ color: '#9ca3af', fontSize: 16, marginTop: 12 }}>No reviews yet</Text>
      <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
        Be the first to rate {handyman.username}!
      </Text>
    </View>
  )}
</View>
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