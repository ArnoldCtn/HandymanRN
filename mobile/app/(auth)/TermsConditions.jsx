import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useAppTheme } from '@/hooks/use-theme-color'

export default function UserTermsConditions() {
  const { t } = useTranslation()
  const router = useRouter()
  const theme = useAppTheme()

  return (
    <ScrollView style={[styles.root, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Last Updated */}
        <View style={[styles.updateBadge, { backgroundColor: theme.primary + '11' }]}>
          <Ionicons name="calendar-outline" size={16} color={theme.primary} />
          <Text style={[styles.updateText, { color: theme.primary }]}>Last updated: July 2026</Text>
        </View>

        {/* Introduction */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#007A5E22' }]}>
              <Ionicons name="document-text-outline" size={24} color="#007A5E" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Agreement to Terms</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            By accessing or using Handyman Connect Cameroon, you agree to be bound by these Terms & Conditions. 
            If you disagree with any part of these terms, you may not access our services. These terms apply to all users, 
            customers, and visitors of our platform.
          </Text>
        </View>

        {/* Acceptance of Terms */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#CE112622' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#CE1126" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Acceptance of Terms</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            By creating an account or using our services, you confirm that:{'\n\n'}
            • You are at least 18 years of age{'\n'}
            • You have the legal capacity to enter into this agreement{'\n'}
            • You will provide accurate and complete information{'\n'}
            • You will maintain the security of your account{'\n'}
            • You accept full responsibility for all activities under your account
          </Text>
        </View>

        {/* User Responsibilities */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#FCD11622' }]}>
              <Ionicons name="person-outline" size={24} color="#FCD116" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>User Responsibilities</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            As a user of our platform, you agree to:{'\n\n'}
            • Provide accurate service requests and descriptions{'\n'}
            • Treat handymen with respect and professionalism{'\n'}
            • Pay for services as agreed upon{'\n'}
            • Not engage in fraudulent or illegal activities{'\n'}
            • Not misuse or attempt to hack the platform{'\n'}
            • Not post false or misleading reviews{'\n'}
            • Respect the privacy and property of handymen
          </Text>
        </View>

        {/* Booking & Payment Terms */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#10b98122' }]}>
              <Ionicons name="wallet-outline" size={24} color="#10b981" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Booking & Payment Terms</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            <Text style={[styles.bold, { color: theme.text }]}>Bookings:</Text>{'\n'}
            • All bookings are subject to handyman acceptance{'\n'}
            • You may cancel bookings according to our cancellation policy{'\n'}
            • Cancellation fees may apply based on timing{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Payments:</Text>{'\n'}
            • Payments are processed through MTN Money or Orange Money{'\n'}
            • Platform fee of 30% applies to all transactions{'\n'}
            • Payments are secured and encrypted{'\n'}
            • Refunds are subject to our refund policy{'\n'}
            • Disputes must be reported within 48 hours of service completion
          </Text>
        </View>

        {/* Cancellation Policy */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#f59e0b22' }]}>
              <Ionicons name="time-outline" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Cancellation Policy</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            <Text style={[styles.bold, { color: theme.text }]}>Free Cancellation:</Text>{'\n'}
            • More than 24 hours before scheduled service{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>50% Fee:</Text>{'\n'}
            • 12-24 hours before scheduled service{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Full Charge:</Text>{'\n'}
            • Less than 12 hours before scheduled service{'\n'}
            • No-shows without prior notification{'\n\n'}
            Handymen may also cancel under certain circumstances. You will be notified promptly and offered a rebooking or refund.
          </Text>
        </View>

        {/* Platform Rules */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#6366F122' }]}>
              <Ionicons name="shield-outline" size={24} color="#6366F1" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Community Guidelines</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            To maintain a safe and respectful community, users must:{'\n\n'}
            • Not harass, threaten, or abuse handymen{'\n'}
            • Not request or engage in illegal services{'\n'}
            • Not discriminate based on gender, ethnicity, or religion{'\n'}
            • Not share contact information to bypass the platform{'\n'}
            • Report any inappropriate behavior immediately{'\n\n'}
            Violations may result in account suspension or permanent ban.
          </Text>
        </View>

        {/* Limitation of Liability */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#CE112622' }]}>
              <Ionicons name="alert-circle-outline" size={24} color="#CE1126" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Limitation of Liability</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            Handyman Connect Cameroon acts as a platform connecting users with independent handymen. We are not responsible for:{'\n\n'}
            • Quality of work performed by handymen{'\n'}
            • Damages or injuries during service{'\n'}
            • Disputes between users and handymen{'\n'}
            • Loss of property or personal injury{'\n\n'}
            We recommend verifying handyman credentials and insurance coverage before engaging services.
          </Text>
        </View>

        {/* Intellectual Property */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#007A5E22' }]}>
              <Ionicons name="library-outline" size={24} color="#007A5E" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Intellectual Property</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            All content on Handyman Connect Cameroon, including logos, designs, text, graphics, and software, 
            is the property of Handyman Connect Cameroon and is protected by intellectual property laws. 
            You may not reproduce, distribute, or create derivative works without our express written permission.
          </Text>
        </View>

        {/* Termination */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#ef444422' }]}>
              <Ionicons name="close-circle-outline" size={24} color="#ef4444" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Termination</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            We reserve the right to suspend or terminate your account at any time, without notice, for conduct that we believe 
            violates these Terms & Conditions or is harmful to other users, handymen, or our business interests. 
            Upon termination, your right to use the platform will immediately cease.
          </Text>
        </View>

        {/* Governing Law */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#6366F122' }]}>
              <Ionicons name="scale-outline" size={24} color="#6366F1" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Governing Law</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            These Terms & Conditions are governed by and construed in accordance with the laws of the Republic of Cameroon. 
            Any disputes arising from these terms or your use of our services shall be resolved in the courts of Douala, Cameroon.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={[styles.section, styles.contactSection, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#007A5E22' }]}>
              <Ionicons name="mail-outline" size={24} color="#007A5E" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Us</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            If you have questions about these Terms & Conditions, please contact us:{'\n\n'}
            📧 Email: arnoldctn@gmail.com{'\n'}
            📍 Location: Dschang, Cameroon{'\n'}
            📞 Support: Available through the app
          </Text>
        </View>

        {/* Report Bad Behavior */}
        <TouchableOpacity 
          style={[styles.reportBtn, { backgroundColor: '#CE1126' }]}
          onPress={() => router.push('/chat/support?source=terms&type=report')}
        >
          <Ionicons name="warning-outline" size={22} color="white" />
          <Text style={styles.reportBtnText}>Report Bad Behavior or Policy Violation</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  updateText: { fontSize: 13, fontWeight: '600' },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  bold: { fontWeight: '700' },
  contactSection: { borderLeftWidth: 4, borderLeftColor: '#007A5E' },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  reportBtnText: { color: 'white', fontSize: 15, fontWeight: '700' },
})