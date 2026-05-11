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
    <ScrollView style={styles.container}>
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
              index < plans.length - 1 && { marginBottom: 16 }
            ]}
            onPress={() => handlePlanSelect(plan.id)}
          >
            {plan.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>RECOMMENDED</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View style={[styles.iconContainer, { backgroundColor: plan.color }]}>
                <Ionicons name={plan.icon} size={32} color="white" />
              </View>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
            </View>

            <View style={styles.feeSplit}>
              <View style={styles.feeItem}>
                <Text style={styles.feeLabel}>Admin Fee</Text>
                <Text style={[styles.feeValue, { color: plan.color }]}>
                  {plan.adminFee}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.feeItem}>
                <Text style={styles.feeLabel}>Your Cut</Text>
                <Text style={[styles.feeValue, { color: plan.color }]}>
                  {plan.handymanCut}
                </Text>
              </View>
            </View>

            <View style={styles.features}>
              {plan.features.map((feature, index) => (
                <View key={index} style={[styles.featureItem, index < plan.features.length - 1 && { marginBottom: 12 }]}>
                  <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
        <Text style={styles.subscribeButtonText}>
          Subscribe to {plans.find(p => p.id === selectedPlan)?.name}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          You can change your plan anytime. No hidden fees.
        </Text>
        <Text style={styles.footerNote}>
          *Payment integration coming soon*
        </Text>
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
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Choose how many months you want to subscribe
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
                        </Text>
                      </View>
                      {selectedMonths === months && (
                        <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  plansContainer: {
    padding: 20,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: '#3b82f6',
    borderWidth: 3,
  },
  recommendedPlanCard: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  feeSplit: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  feeItem: {
    flex: 1,
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  feeValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  features: {
    // gap: 12, // Not supported in React Native
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#3b82f6',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerNote: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  monthOptions: {
    gap: 12,
  },
  monthOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  selectedMonthOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  monthOptionLeft: {
    flex: 1,
  },
  monthOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  monthOptionPrice: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
