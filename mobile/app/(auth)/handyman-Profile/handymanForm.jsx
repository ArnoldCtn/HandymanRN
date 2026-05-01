// app/booking/[id].jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import handymanApi from '@/services/handymanApi';
import api from '@/services/api';
import useGlobal from '@/services/global'
import useHandymanGlobal from '@/services/handymanGlobal'

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const SHIFT_TIMES = {
  morning:   '6 AM – 12 PM',
  afternoon: '12 PM – 6 PM',
  evening:   '6 PM – 10 PM',
  full_day:  '6 AM – 10 PM',
};

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [handyman, setHandyman] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  const user    = useGlobal(state => state.user)   // ← Zustand only, no AsyncStorage
  

  // Form States
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedShift, setSelectedShift] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedServices, setSelectedServices] = useState([]); // Only handyman's services

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchHandyman = async () => {
      try {
        const res = await handymanApi.get(`/handymen/${id}/`);
        setHandyman(res.data);
        if (res) {
          console.log('res for fetch ok')
          // console.log(res)
        }else{
          console.log('res for not there')

        }
      } catch (err) {
        Alert.alert("Error", "Failed to load handyman");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchHandyman();
  }, [id]);

  // Filter services to only those offered by this handyman
  const handymanServices = handyman?.services || [];

  const isShiftAvailable = (shift) => {
    const dayKey = DAYS_OF_WEEK[selectedDate.getDay()];
    return handyman?.availability?.[dayKey]?.includes(shift) || false;
  };

  const toggleService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedShift) {
      Alert.alert("Required", "Please select a time shift");
      return;
    }
    if (currentStep === 2 && selectedServices.length === 0) {
      Alert.alert("Required", "Please select at least one service");
      return;
    }
    if (currentStep === 2 && !jobDescription.trim()) {
      Alert.alert("Required", "Please describe the job");
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else router.back();
  };

  useEffect(() => {
  console.log("Current User from global:", user);
}, [user]);

  const handleConfirmBooking = async () => {
    if (!selectedShift || selectedServices.length === 0 || !jobDescription.trim()) {
      Alert.alert("Incomplete", "Please fill all required fields");
      return;
    }

    setSubmitting(true);

    let locationId = null

    if (handyman?.location) {
    if (typeof handyman.location === 'object' && handyman.location.id) {
      // New format: {id, name}
      locationId = handyman.location.id
    } else if (typeof handyman.location === 'string') {
      // Old format: plain string name — fetch the ID from the locations list
      // OR just pass null and let the booking work without it
      console.log('[Booking] location is string:', handyman.location)
      // If you need the ID, fetch it:
      try {
        const lRes = await handymanApi.get('/handymen/locations/')
        const match = lRes.data.find(
          l => l.location.toLowerCase() === handyman.location.toLowerCase()
        )
        locationId = match?.id ?? null
        console.log('[Booking] resolved location id:', locationId)
      } catch (e) {
        console.log('[Booking] could not resolve location id:', e.message)
      }
    }
  }

    try {
      // Get location ID - use the ID field, not the name string
      
      // Build payload
      const payload = {
        handyman: parseInt(id),
        service: parseInt(selectedServices[0]),
        scheduled_date: selectedDate.toISOString(),
        job_description: jobDescription,
        total_amount: budget ? budget.toString() : "0",
      };

      // Only add location if it exists (as integer ID)
      if (locationId) {
        payload.location = locationId;
      }

      console.log('=== BOOKING PAYLOAD ===');
      console.log('Full payload:', JSON.stringify(payload, null, 2));
      console.log('========================');

      const res = await api.post('/bookings/', payload);
      Alert.alert("Success", "Booking request sent successfully!");
      console.log('Booking created:', res.data)
      router.back();
    } catch (err) {
      // Log full error details
      console.log('=== BOOKING ERROR ===');
      console.log('Status:', err.response?.status);
      console.log('Full response data:', JSON.stringify(err.response?.data, null, 2));
      console.log('====================');
      
      const errorData = err.response?.data;
      let errorMessage = "Failed to send booking";
      
      if (errorData) {
        // Format Django validation errors
        if (typeof errorData === 'object') {
          const errors = Object.entries(errorData)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join('\n');
          errorMessage = errors;
        } else {
          errorMessage = errorData.detail || errorData;
        }
      }
      
      Alert.alert("Error", errorMessage);

    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Handyman</Text>
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[styles.progressDot, currentStep >= step && styles.progressDotActive]}
            />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* STEP 1: Date & Time */}
        {currentStep === 1 && (
          <View>
            <Text style={styles.stepTitle}>When do you need help?</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={24} color="#6366F1" />
              <Text style={styles.dateText}>{selectedDate.toDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                minimumDate={new Date()}
                onChange={(e, date) => {
                  setShowDatePicker(false);
                  if (date) setSelectedDate(date);
                }}
              />
            )}
    {/* <Text>{handyman?.location?.id} or null</Text> */}
            <Text style={styles.sectionTitle}>Available Time Slots</Text>
            <View style={styles.shiftGrid}>
              {['morning', 'afternoon', 'evening', 'full_day'].map((shiftKey) => {
                const available = isShiftAvailable(shiftKey);
                const timeRange = SHIFT_TIMES[shiftKey];

                return (
                  <TouchableOpacity
                    key={shiftKey}
                    style={[
                      styles.shiftOption,
                      selectedShift === shiftKey && styles.shiftOptionSelected,
                      !available && styles.shiftOptionDisabled,
                    ]}
                    onPress={() => available && setSelectedShift(shiftKey)}
                    disabled={!available}
                  >
                    <Text style={[
                      styles.shiftOptionText,
                      selectedShift === shiftKey && styles.shiftOptionTextSelected,
                    ]}>
                      {shiftKey.charAt(0).toUpperCase() + shiftKey.slice(1)}
                    </Text>
                    <Text style={styles.timeRange}>{timeRange}</Text>
                    {!available && <Text style={styles.notAvailable}>Not available this day</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 2: Job Details */}
        {currentStep === 2 && (
          <View>
            <Text style={styles.stepTitle}>Job Details</Text>

            {/* Services - Only Handyman's Services */}
            <Text style={styles.sectionTitle}>Services Needed</Text>
            <View style={styles.chipGrid}>
              {handymanServices.map((service) => {
                const isSelected = selectedServices.includes(service.id);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => toggleService(service.id)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {service.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Describe the Job</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Be specific about what needs to be done..."
              multiline
              numberOfLines={5}
              value={jobDescription}
              onChangeText={setJobDescription}
            />

            <Text style={styles.sectionTitle}>Estimated Budget (FCFA)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 35000"
              keyboardType="numeric"
              value={budget}
              onChangeText={setBudget}
              
            />
            <Text style={styles.note}>This can be negotiated later with the handyman</Text>
          </View>
        )}

        {/* STEP 3: Review */}
        {currentStep === 3 && (
          <View>
            <Text style={styles.stepTitle}>Review Your Booking</Text>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Handyman</Text>
              <Text style={styles.reviewValue}>{handyman?.username}</Text>

              <Text style={styles.reviewLabel}>Date</Text>
              <Text style={styles.reviewValue}>{selectedDate.toDateString()}</Text>

              <Text style={styles.reviewLabel}>Time</Text>
              <Text style={styles.reviewValue}>
                {selectedShift ? `${selectedShift} (${SHIFT_TIMES[selectedShift]})` : 'Not selected'}
              </Text>

              <Text style={styles.reviewLabel}>Services</Text>
              <Text style={styles.reviewValue}>
                {selectedServices.length > 0
                  ? selectedServices.map(id =>
                      handymanServices.find(s => s.id === id)?.name
                    ).join(', ')
                  : "None selected"}
              </Text>

              <Text style={styles.reviewLabel}>Job Description</Text>
              <Text style={styles.reviewValue}>{jobDescription || "No description"}</Text>
              
              <Text style={styles.reviewLabel}>location</Text>
              <Text style={styles.reviewValue}>{handyman.location}</Text>

              <Text style={styles.reviewLabel}>Budget</Text>
              <Text style={styles.reviewValue}>
                {budget ? `${budget} FCFA` : "To be negotiated"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {currentStep < 3 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmBooking}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Booking Request</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ====================== STYLES ====================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  progressContainer: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#e5e7eb' },
  progressDotActive: { backgroundColor: '#6366f1' },

  scrollContent: { padding: 20, paddingBottom: 120 },

  stepTitle: { fontSize: 22, fontWeight: '700', color: '#1f2937', marginBottom: 20 },

  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  dateText: { marginLeft: 12, fontSize: 16, color: '#374151' },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 24, marginBottom: 10 },

  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    minHeight: 130,
    textAlignVertical: 'top',
    fontSize: 16,
  },

  shiftGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shiftOption: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  shiftOptionSelected: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  shiftOptionDisabled: { backgroundColor: '#f3f4f6', borderColor: '#cbd5e1' },
  shiftOptionText: { fontWeight: '600', color: '#475569' },
  shiftOptionTextSelected: { color: 'white' },
  timeRange: { fontSize: 12, color: '#64748b', marginTop: 4 },
  notAvailable: { fontSize: 11, color: '#ef4444', marginTop: 4 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextActive: { color: 'white', fontWeight: '600' },

  note: { fontSize: 12, color: '#64748b', marginTop: 4, fontStyle: 'italic' },

  reviewCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewLabel: { fontSize: 14, color: '#64748b', marginTop: 12 },
  reviewValue: { fontSize: 16, fontWeight: '600', color: '#1f2937' },

  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  backButtonText: { fontWeight: '600', color: '#475569' },

  nextButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },

  confirmButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});