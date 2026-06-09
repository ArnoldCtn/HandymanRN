import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(1);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '0 XAF/month',
      basePrice: 0,
      discount: 0,
      adminFee: '30%',
      handymanCut: '70%',
      features: [
        'Basic profile',
        'Receive bookings',
        'Standard support',
        'Limited visibility'
      ],
      color: '#94a3b8',
      icon: 'person-outline'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '2,000 XAF/month',
      basePrice: 2000,
      discount: 15,
      adminFee: '25%',
      handymanCut: '75%',
      features: [
        'Enhanced profile',
        'Priority bookings',
        'Advanced analytics',
        'Featured placement',
        'Priority support'
      ],
      color: '#3b82f6',
      icon: 'star-outline',
      recommended: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '2,500 XAF/month',
      basePrice: 2500,
      discount: 20,
      adminFee: '20%',
      handymanCut: '80%',
      features: [
        'Premium profile',
        'Top placement',
        'Real-time analytics',
        'Dedicated support',
        'Advanced tools',
        'Maximum visibility'
      ],
      color: '#10b981',
      icon: 'diamond-outline'
    }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (plan.id === 'free') {
      Alert.alert(
        'Subscription Update',
        `You selected ${plan.name} plan. This is a demo - payment integration coming soon!`,
        [{ text: 'OK' }]
      );
    } else {
      setModalVisible(true);
    }
  };

  const handleConfirmSubscription = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    const discountedPrice = plan.basePrice * (1 - plan.discount / 100);
    const totalPrice = discountedPrice * selectedMonths;
    
    Alert.alert(
      'Subscription Confirmed',
      `${plan.name} plan for ${selectedMonths} months\n\nTotal: ${totalPrice.toLocaleString()} XAF\nDiscount: ${plan.discount}% off\n\nThis is a demo - payment integration coming soon!`,
      [{ text: 'OK' }]
    );
    
    setModalVisible(false);
    setSelectedMonths(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            Select the subscription that best fits your business needs
          </Text>
        </View>

        <View style={styles.plansContainer}>
          {plans.map((plan, index) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.selectedPlanCard,
                plan.recommended && styles.recommendedPlanCard,
                index < plans.length - 1 && { marginBottom: 20 }
              ]}
              onPress={() => handlePlanSelect(plan.id)}
              activeOpacity={0.9}
            >
              {plan.recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
              )}

              <View style={styles.planRow}>
                <View style={[styles.iconContainer, { backgroundColor: plan.color }]}>
                  <Ionicons name={plan.icon} size={28} color="white" />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>
                {selectedPlan === plan.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                )}
              </View>

              <View style={styles.feeSplit}>
                <View style={styles.feeItem}>
                  <Text style={styles.feeLabel}>Admin Fee</Text>
                  <Text style={[styles.feeValue, { color: plan.color }]}>{plan.adminFee}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.feeItem}>
                  <Text style={styles.feeLabel}>Your Cut</Text>
                  <Text style={[styles.feeValue, { color: plan.color }]}>{plan.handymanCut}</Text>
                </View>
              </View>

              <View style={styles.features}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Ionicons name="checkmark-sharp" size={16} color={plan.color} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomGap} />
      </ScrollView>

      {/* Fixed Subscribe Button at bottom */}
      <View style={styles.actionArea}>
        <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
          <Text style={styles.subscribeButtonText}>
            Subscribe to {plans.find(p => p.id === selectedPlan)?.name}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>* Payment integration coming soon *</Text>
      </View>

      {/* Month Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Duration</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDescription}>
                Choose how many months you want to subscribe to the {plans.find(p => p.id === selectedPlan)?.name} plan.
              </Text>
              
              <View style={styles.monthOptions}>
                {[1, 3, 6, 12].map((months) => {
                  const plan = plans.find(p => p.id === selectedPlan);
                  const discountedPrice = plan.basePrice * (1 - plan.discount / 100);
                  const totalPrice = discountedPrice * months;
                  
                  return (
                    <TouchableOpacity
                      key={months}
                      style={[
                        styles.monthOption,
                        selectedMonths === months && styles.selectedMonthOption
                      ]}
                      onPress={() => setSelectedMonths(months)}
                    >
                      <View style={styles.monthOptionLeft}>
                        <Text style={styles.monthOptionText}>{months} {months === 1 ? 'Month' : 'Months'}</Text>
                        <Text style={styles.monthOptionPrice}>
                          {totalPrice.toLocaleString()} XAF
                          {months > 1 && <Text style={styles.discountText}> ({plan.discount}% off)</Text>}
                        </Text>
                      </View>
                      <View style={[styles.radio, selectedMonths === months && styles.radioSelected]}>
                        {selectedMonths === months && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirmSubscription}
              >
                <Text style={styles.confirmButtonText}>Confirm Subscription</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, alignItems: 'center', paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '900', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  plansContainer: { paddingHorizontal: 20 },
  planCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: '#e2e8f0', position: 'relative' },
  selectedPlanCard: { borderColor: '#3b82f6', backgroundColor: '#f0f9ff' },
  recommendedPlanCard: { shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  recommendedBadge: { position: 'absolute', top: -12, right: 24, backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, zIndex: 10 },
  recommendedText: { color: 'white', fontSize: 10, fontWeight: '800' },
  planRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconContainer: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  planName: { fontSize: 22, fontWeight: '800', color: '#1e293b' },
  planPrice: { fontSize: 16, color: '#64748b', fontWeight: '600', marginTop: 2 },
  feeSplit: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 16, padding: 16, marginBottom: 20, alignItems: 'center' },
  feeItem: { flex: 1, alignItems: 'center' },
  feeLabel: { fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: '600', textTransform: 'uppercase' },
  feeValue: { fontSize: 20, fontWeight: '900' },
  divider: { width: 1, height: 36, backgroundColor: '#cbd5e1' },
  features: { gap: 10 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureText: { fontSize: 14, color: '#475569', marginLeft: 10, flex: 1, fontWeight: '500' },
  bottomGap: { height: 140 },
  actionArea: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0', alignItems: 'center' },
  subscribeButton: { backgroundColor: '#3b82f6', width: '100%', padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  subscribeButtonText: { color: 'white', fontSize: 17, fontWeight: '800' },
  footerNote: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, width: '100%', maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  closeBtn: { padding: 4 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  modalBody: { padding: 24 },
  modalDescription: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  monthOptions: { gap: 12 },
  monthOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 18, marginBottom: 12 },
  selectedMonthOption: { borderColor: '#3b82f6', backgroundColor: '#f0f9ff' },
  monthOptionLeft: { flex: 1 },
  monthOptionText: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  monthOptionPrice: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '500' },
  discountText: { color: '#10b981', fontWeight: '700' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#3b82f6' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3b82f6' },
  modalFooter: { padding: 24, paddingBottom: 34, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  confirmButton: { backgroundColor: '#1e293b', padding: 18, borderRadius: 16, alignItems: 'center' },
  confirmButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
