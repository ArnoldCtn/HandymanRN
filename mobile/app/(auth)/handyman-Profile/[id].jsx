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
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/hooks/use-theme-color';


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
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [handyman, setHandyman] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [reviews, setReviews] = useState([]);
const [reviewsLoading, setReviewsLoading] = useState(false);
const [reviewsPage, setReviewsPage] = useState(1);
const [totalReviews, setTotalReviews] = useState(0);
const REVIEWS_PER_PAGE = 5;

 const fetchReviews = async (page = 1) => {
  try {
    setReviewsLoading(true);
    const response = await api.get(`/ratings/handyman/${id}/?page=${page}&limit=${REVIEWS_PER_PAGE}`);
    const reviewsData = response.data.results || response.data || [];
    const totalCount = response.data.count || response.data.length || reviewsData.length;
    
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

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 10 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
      {[...Array(fullStars)].map((_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={12} color={theme.accent} />
      ))}
      {hasHalfStar && (
        <Ionicons key="half" name="star-half" size={12} color={theme.accent} />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Ionicons key={`empty-${i}`} name="star-outline" size={12} color={theme.textSecondary} />
      ))}
      <Text style={{ marginLeft: 8, fontSize: 14, color: theme.textSecondary }}>
        {rating}/10 ({handyman.total_ratings} {handyman.total_ratings === 1 ? t('handyman_profile.rating', 'rating') : t('handyman_profile.ratings', 'ratings')})
      </Text>
    </View>
  );
};

  useEffect(() => {
    if (!id) {
      Alert.alert(t('common.error'), t('handyman_profile.id_not_found', 'Handyman ID not found'));
      router.back();
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/handymen/${id}/`);
        setHandyman(res.data);
        await fetchReviews(1);
      } catch (err) {
        console.error("Failed to fetch handyman:", err?.response?.data || err.message);
        Alert.alert(t('common.error'), t('handyman_profile.load_failed', 'Failed to load handyman profile'));
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
        Alert.alert(t('common.error'), t('handyman_profile.favorite_failed', "Failed to update favorites"));
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!handyman) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <Text style={{ color: theme.text }}>{t('handyman_profile.not_found', 'Handyman not found')}</Text>
      </View>
    );
  }

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.root}>
      {/* Back Button + Header */}
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={28} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('handyman_profile.title', 'Handyman Profile')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={toggleFavorite}>
            <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={28} color={isFavorite ? theme.error : theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push({
            pathname: '/(auth)/ReportHandyman',
            params: { id: handyman.id, username: handyman.username }
          })}>
            <Ionicons name="ellipsis-vertical" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Info */}
      <View style={{ alignItems: 'center', paddingVertical: 20 }}>
        { handyman.thumbnail ? (
        <Image 
          source={{ uri: handyman.thumbnail }} 
          style={styles.avatar} 
        />
        ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {handyman.username?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                ) }

        <Text style={styles.username}>
          {handyman.username}
        </Text>
        <Text style={{ 
          color: handyman.is_online ? theme.success : theme.textSecondary, 
          fontSize: 16, 
          marginTop: 4 
        }}>
          {handyman.is_online ? t('handyman_profile.active_now', '● Active Now') : handyman.last_seen}
        </Text>

       <TouchableOpacity 
  onPress={() => router.push(`/(auth)/handyman-Profile/rating/${handyman.id}`)}
  style={styles.rateBtn}
>
  <Text style={styles.rateBtnText}>
    {t('handyman_profile.rate', 'Rate')}
  </Text>
  {renderStars(handyman.average_rating)}
</TouchableOpacity>

      </View>
      <View style={{ padding: 16 }}>
        <View style={{flexDirection:'row', justifyContent:'space-around'}}>
          <Text style={styles.sectionLabel}>{t('auth.email', 'Email')}</Text>
          <Text style={styles.sectionLabel}>{t('handyman_profile.contact', 'Contact')}</Text>
        </View>
        <View style={{flexDirection:'row', justifyContent:'space-around', marginBottom: 16}}>
          <Text style={styles.sectionValue}>
            {handyman.email || t('handyman_profile.no_email', "No Email provided yet.")}
          </Text>
          <Text style={styles.sectionValue}>
            {handyman.phone || t('handyman_profile.no_phone', "No Phone number provided yet.")}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>{t('handyman_profile.about', 'About Me')}</Text>
        <Text style={styles.sectionValue}>
          {handyman.bio || t('handyman_profile.no_bio', "No biography provided yet.")}
        </Text>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
          {t('handyman_profile.location', 'Location')}
        </Text>
        <Text style={styles.sectionValue}>{handyman.location}</Text>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
          {t('handyman_profile.services', 'Services Offered')}
        </Text>
        {handyman.services && handyman.services.length > 0 ? (
          handyman.services.map((service) => (
            <View key={service.id} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                <Text style={{ marginLeft: 8, fontSize: 16, color: theme.text, fontWeight: '500' }}>{service.name}</Text>
              </View>
              {handyman.categories?.filter(cat => cat.service === service.id || cat.service?.id === service.id)?.map(cat => (
                <View key={cat.id} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 28, marginVertical: 3 }}>
                  <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
                  <Text style={{ marginLeft: 6, fontSize: 14, color: theme.textSecondary }}>{cat.name}</Text>
                  {cat.price && (
                    <Text style={{ marginLeft: 'auto', fontSize: 13, color: theme.primary, fontWeight: '600' }}>
                      {cat.price} FCFA
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))
        ) : (
          <Text style={{ color: theme.textSecondary }}>{t('handyman_profile.no_services', 'No services listed')}</Text>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
          {t('handyman_profile.availability', 'Availability')}
        </Text>
        {DAYS.map(day => (
          <View key={day.key} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{day.label}</Text>
            <View style={styles.shiftRow}>
              {SHIFTS.map(shift => {
                const active = handyman.availability[day.key]?.includes(shift.key)
                return (
                  <View
                    key={shift.key}
                    style={[styles.shiftBtn, active && styles.shiftBtnActive]}
                  >
                    <Ionicons name={shift.icon} size={12}
                      color={active ? 'white' : theme.textSecondary} />
                    <Text style={[styles.shiftText, active && styles.shiftTextActive]}>
                      {shift.label}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        ))}
      </View>

      {/* View Pictures Button */}
      <TouchableOpacity 
        style={styles.viewPicsBtn}
        onPress={() => router.push({
          pathname: `/(auth)/handyman-Profile/WorkPictures`,
          params: { id: handyman.id, name: handyman.username }
        })}
      >
        <Ionicons name="images-outline" size={22} color={theme.primary} />
        <Text style={styles.viewPicsBtnText}>
          {t('handyman_profile.view_work_pics', 'View Handyman Work Pictures')}
        </Text>
      </TouchableOpacity>

      {/* Book Button */}
      <TouchableOpacity 
        style={styles.bookBtn}
        onPress={() => router.push({
        pathname:'/(auth)/handyman-Profile/handymanForm',
        params: {id : handyman.id}
      })
    }
      >
        <Text style={styles.bookBtnText}>
          {t('handyman_profile.book_btn', 'Book This Handyman')}
        </Text>
      </TouchableOpacity>

      {/* Reviews Section */}
<View style={{ padding: 16, marginTop: 24 }}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
    <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>
      {t('handyman_profile.reviews', 'Reviews')} ({totalReviews})
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
          <Ionicons name="chevron-back" size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 14, color: theme.textSecondary, marginHorizontal: 8 }}>
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
          <Ionicons name="chevron-forward" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>
    )}
  </View>

  {reviewsLoading ? (
    <View style={{ alignItems: 'center', padding: 20 }}>
      <ActivityIndicator size="small" color={theme.primary} />
      <Text style={{ marginTop: 8, color: theme.textSecondary }}>{t('common.loading')}</Text>
    </View>
  ) : reviews.length > 0 ? (
    reviews.map((review, index) => (
      <View key={review.id} style={styles.reviewCard}>
        {/* User Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
          {/* User Avatar */}
          <View style={{ marginRight: 12 }}>
            {review.user_info?.thumbnail ? (
              <Image 
                source={{ uri: review.user_info.thumbnail }} 
                style={{ width: 40, height: 40, borderRadius: 20 }} 
              />
            ) : (
              <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: theme.primary,
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
                <Text style={{ fontWeight: '600', fontSize: 16, color: theme.text }}>
                  {review.user_info?.username || 'Anonymous User'}
                </Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                  {new Date(review.created_at).toLocaleDateString()}
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
          <View style={styles.reviewTextContainer}>
            <Text style={styles.reviewText}>
              {review.review}
            </Text>
          </View>
        )}
      </View>
    ))
  ) : (
    <View style={{ alignItems: 'center', padding: 20 }}>
      <Ionicons name="star-outline" size={48} color={theme.border} />
      <Text style={{ color: theme.textSecondary, fontSize: 16, marginTop: 12 }}>{t('handyman_profile.no_reviews', 'No reviews yet')}</Text>
    </View>
  )}
</View>
<View style={{ height: 40 }} />
    </ScrollView>
  );
}



const createStyles = (theme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },
  header: { padding: 20, paddingTop: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.surface, borderBottomWidth: 1, borderColor: theme.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  
  avatar: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: theme.surface },
  avatarPlaceholder: {
    width: 130, height: 130, borderRadius: 65, borderWidth: 3,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: theme.surface
  },
  avatarInitial: { color: 'white', fontSize: 48, fontWeight: 'bold' },
  username: { fontSize: 26, fontWeight: 'bold', marginTop: 12, color: theme.text },

  rateBtn: { padding: 12, borderRadius: 20, backgroundColor: theme.primary + '11', flexDirection: 'row', alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: theme.primary + '22' },
  rateBtnText: { color: theme.primary, fontWeight: '600', marginRight: 8 },

  sectionLabel: { fontSize: 18, fontWeight: '900', color: theme.text, marginBottom: 8 },
  sectionValue: { fontSize: 15, lineHeight: 22, color: theme.textSecondary },

  shiftRow:          { flexDirection:'row', flexWrap:'wrap', gap:6 },
  shiftBtn:          { flexDirection:'row', alignItems:'center', gap:4, paddingVertical:5, paddingHorizontal:10, borderRadius:14, borderWidth:1.5, borderColor: theme.border, backgroundColor: theme.surface },
  shiftBtnActive:    { backgroundColor: theme.accent, borderColor: theme.accent },
  shiftText:         { fontSize:11, color: theme.textSecondary, fontWeight:'500' },
  shiftTextActive:   { color:'white', fontWeight:'700' },
  dayRow:            { marginBottom:12 },
  dayLabel:          { fontSize:13, fontWeight:'700', color: theme.text, marginBottom:6 },

  viewPicsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, marginHorizontal: 16, marginBottom: 10, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: theme.primary, gap: 10 },
  viewPicsBtnText: { color: theme.primary, fontWeight: 'bold', fontSize: 16 },

  bookBtn: { backgroundColor: theme.primary, margin: 16, padding: 18, borderRadius: 16, alignItems: 'center', elevation: 4, shadowColor: theme.shadow, shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width:0, height:4 } },
  bookBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

  reportBtn: { backgroundColor: '#fef2f2', marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#fecaca' },
  reportBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 16 },

  reviewCard: { backgroundColor: theme.card, padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: theme.border },
  reviewTextContainer: { backgroundColor: theme.background, padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: theme.primary },
  reviewText: { fontSize: 14, color: theme.text, lineHeight: 20 },
})