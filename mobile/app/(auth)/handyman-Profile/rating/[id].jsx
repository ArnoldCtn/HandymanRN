import React, { useState, useEffect, useCallback } from 'react';
import { 
  Alert, 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Rating } from '@kolking/react-native-rating';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/services/api';

const { width, height } = Dimensions.get('window');

const RatingPage = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  // State
  const [handyman, setHandyman] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [userExistingRating, setUserExistingRating] = useState(null);

  console.log('[RATING PAGE] Initializing with handyman ID:', id);

  // Fetch handyman profile and existing rating
  useEffect(() => {
    if (!id) {
      console.error('[RATING PAGE] No handyman ID provided');
      Alert.alert("Error", "Handyman ID not found");
      router.back();
      return;
    }

    const fetchData = async () => {
      try {
        console.log('[RATING PAGE] Fetching handyman profile...');
        setLoading(true);
        
        // Fetch handyman profile
        const profileRes = await api.get(`/handymen/${id}/`);
        console.log('[RATING PAGE] Handyman profile loaded:', profileRes.data.username);
        setHandyman(profileRes.data);
        
        // Check if user already rated this handyman
        try {
          const ratingRes = await api.get(`/ratings/handyman/${id}/user-rating/`);
          console.log('[RATING PAGE] Existing rating found:', ratingRes.data);
          setUserExistingRating(ratingRes.data);
          setRating(ratingRes.data.rating);
          setReview(ratingRes.data.review || '');
        } catch (ratingErr) {
          console.log('[RATING PAGE] No existing rating found');
          // No existing rating is fine
        }
        
      } catch (err) {
        console.error('[RATING PAGE] Failed to fetch handyman:', err?.response?.data || err.message);
        Alert.alert("Error", "Failed to load handyman profile");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleRatingChange = useCallback((value) => {
    console.log('[RATING PAGE] Rating changed to:', value);
    setRating(value);
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    if (!handyman) {
      Alert.alert("Error", "Handyman data not loaded");
      return;
    }

    console.log('[RATING PAGE] Submitting rating:', {
      handyman_id: handyman.id,
      rating: rating,
      review: review
    });

    try {
      setSubmitting(true);
      
      const response = await api.post('/ratings/', {
        handyman: handyman.id,
        rating: rating,
        review: review
      });

      console.log('[RATING PAGE] Rating submitted successfully:', response.data);
      
      Alert.alert(
        "Success!", 
        userExistingRating ? "Your rating has been updated!" : "Your rating has been submitted!",
        [
          {
            text: "OK",
            onPress: () => {
              console.log('[RATING PAGE] Redirecting to handyman profile...');
              router.push(`/handyman-Profile/${id}`);
            }
          }
        ]
      );

    } catch (err) {
      console.error('[RATING PAGE] Failed to submit rating:', err?.response?.data || err.message);
      Alert.alert("Error", err?.response?.data?.detail || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const resolveAvatar = (thumbnail) => {
    if (!thumbnail) return null;
    if (thumbnail.startsWith('http')) return thumbnail;
    return `http://192.168.43.188:8000/media/${thumbnail}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading handyman profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!handyman) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Handyman not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const avatarUrl = resolveAvatar(handyman.thumbnail);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Rate & Review</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Handyman Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Image 
                source={{ 
                  uri: avatarUrl || 'https://ui-avatars.com/api/?name=' + handyman.username + '&background=random' 
                }} 
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.handymanName}>{handyman.username}</Text>
                <Text style={styles.handymanTitle}>Professional Handyman</Text>
                {handyman.average_rating && (
                  <View style={styles.ratingRow}>
                    <Text style={styles.averageRating}>
                      ⭐ {handyman.average_rating}/10
                    </Text>
                    <Text style={styles.ratingCount}>
                      ({handyman.total_ratings} {handyman.total_ratings === 1 ? 'rating' : 'ratings'})
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Bio */}
            {handyman.bio && (
              <View style={styles.bioSection}>
                <Text style={styles.bioTitle}>About</Text>
                <Text style={styles.bioText}>{handyman.bio}</Text>
              </View>
            )}

            {/* Services */}
            {handyman.services && handyman.services.length > 0 && (
              <View style={styles.servicesSection}>
                <Text style={styles.servicesTitle}>Services</Text>
                <View style={styles.servicesList}>
                  {handyman.services.map((service, index) => (
                    <View key={index} style={styles.serviceTag}>
                      <Text style={styles.serviceText}>{service.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Rating Form */}
          <View style={styles.ratingForm}>
            <Text style={styles.formTitle}>
              {userExistingRating ? 'Update Your Rating' : 'Rate Your Experience'}
            </Text>
            
            {/* Rating Stars */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>How was your experience?</Text>
              <View style={styles.starsContainer}>
                <Rating 
                  size={20} 
                  rating={rating} 
                  maxRating={10}
                  onChange={handleRatingChange}
                  style={styles.ratingStars}
                />
              </View>
              <Text style={styles.ratingValue}>
                {rating}/10 {rating === 0 ? '(No rating)' : rating <= 3 ? '(Poor)' : rating <= 6 ? '(Good)' : rating <= 8 ? '(Very Good)' : '(Excellent)'}
              </Text>
            </View>

            {/* Review Text */}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Tell us more (optional)</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Share details about your experience..."
                multiline
                numberOfLines={4}
                value={review}
                onChangeText={setReview}
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, (rating === 0 || submitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={rating === 0 || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {userExistingRating ? 'Update Rating' : 'Submit Rating'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your feedback helps {handyman.username} improve their service
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 60,
  },
  profileCard: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  handymanName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  handymanTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
  },
  ratingCount: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },
  bioSection: {
    marginBottom: 20,
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  servicesSection: {
    marginBottom: 20,
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  serviceText: {
    fontSize: 12,
    color: '#4b5563',
  },
  ratingForm: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingStars: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  ratingValue: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default RatingPage;