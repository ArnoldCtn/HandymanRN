import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useAppTheme } from '@/hooks/use-theme-color'

export default function HandymanTermsConditions() {
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Terms & Conditions for Handymen</Text>
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
            By registering as a handyman on Handyman Connect Cameroon, you agree to be bound by these Terms & Conditions. 
            These terms govern your use of our platform and your relationship with customers. Please read them carefully.
          </Text>
        </View>

        {/* Handyman Requirements */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#CE112622' }]}>
              <Ionicons name="id-card-outline" size={24} color="#CE1126" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Handyman Requirements</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            To maintain a professional platform, all handymen must:{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Verification:</Text>{'\n'}
            • Complete government ID verification{'\n'}
            • Provide accurate personal information{'\n'}
            • Maintain a valid profile photo{'\n'}
            • Keep verification documents up to date{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Professional Standards:</Text>{'\n'}
            • Be at least 18 years of age{'\n'}
            • Have legitimate skills in services offered{'\n'}
            • Provide accurate service descriptions{'\n'}
            • Maintain professional conduct at all times{'\n'}
            • Respond to booking requests promptly{'\n'}
            • Honor accepted bookings barring emergencies
          </Text>
        </View>

        {/* Gallery & Portfolio Requirements */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#FCD11622' }]}>
              <Ionicons name="images-outline" size={24} color="#FCD116" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Gallery & Portfolio Requirements</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            Your portfolio is crucial for attracting customers. All handymen must:{'\n\n'}
            • Upload only original work photos (not from internet){'\n'}
            • Ensure photos are clear, well-lit, and professional{'\n'}
            • Showcase actual work completed by you{'\n'}
            • Include before/after shots when applicable{'\n'}
            • Avoid misleading or deceptive images{'\n'}
            • Not use copyrighted material without permission{'\n'}
            • Remove outdated or irrelevant work samples{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Prohibited Content:</Text>{'\n'}
            • Images of other people's work{'\n'}
            • Inappropriate or unprofessional content{'\n'}
            • Misleading representations of services{'\n'}
            • Images violating privacy or copyright
          </Text>
        </View>

        {/* Service Standards */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#10b98122' }]}>
              <Ionicons name="construct-outline" size={24} color="#10b981" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Service Standards & Quality</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            As a handyman on our platform, you agree to:{'\n\n'}
            • Provide services with reasonable skill and care{'\n'}
            • Use quality materials appropriate for the job{'\n'}
            • Complete work within agreed timeframes{'\n'}
            • Clean up work areas after job completion{'\n'}
            • Honor quoted prices unless scope changes{'\n'}
            • Communicate professionally with customers{'\n'}
            • Arrive on time for scheduled appointments{'\n'}
            • Notify customers promptly of any delays{'\n'}
            • Address customer concerns professionally{'\n'}
            • Maintain appropriate insurance coverage
          </Text>
        </View>

        {/* Booking & Availability */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#6366F122' }]}>
              <Ionicons name="calendar-outline" size={24} color="#6366F1" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Booking & Availability Management</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            <Text style={[styles.bold, { color: theme.text }]}>Accepting Bookings:</Text>{'\n'}
            • Review booking requests promptly{'\n'}
            • Accept only jobs you can complete well{'\n'}
            • Decline professionally with brief explanation{'\n'}
            • Update availability status regularly{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Cancellation Policy:</Text>{'\n'}
            • Free cancellation: More than 24 hours notice{'\n'}
            • 50% penalty: 12-24 hours notice{'\n'}
            • Full penalty: Less than 12 hours or no-show{'\n'}
            • Emergency cancellations require documentation{'\n'}
            • Repeated cancellations affect platform standing{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>No-Show Policy:</Text>{'\n'}
            • Three no-shows result in account review{'\n'}
            • Pattern of cancellations may lead to suspension{'\n'}
            • Customer compensation may be required
          </Text>
        </View>

        {/* Payments & Financial Terms */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#10b98122' }]}>
              <Ionicons name="wallet-outline" size={24} color="#10b981" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Payments & Financial Terms</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            <Text style={[styles.bold, { color: theme.text }]}>Platform Commission:</Text>{'\n'}
            • 30% platform fee on all completed jobs{'\n'}
            • You receive 70% of the gross amount{'\n'}
            • Commission is automatically deducted{'\n'}
            • Fees are non-negotiable{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Payment Processing:</Text>{'\n'}
            • Payments via MTN Money or Orange Money{'\n'}
            • Funds transferred after job completion{'\n'}
            • Withdrawals processed within 24-48 hours{'\n'}
            • Minimum withdrawal: 5,000 XAF{'\n'}
            • Withdrawal fees may apply{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Disputes:</Text>{'\n'}
            • Payment disputes must be reported within 48 hours{'\n'}
            • Platform will mediate fair resolution{'\n'}
            • Fraudulent activity results in account termination
          </Text>
        </View>

        {/* Professional Conduct */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#CE112622' }]}>
              <Ionicons name="people-outline" size={24} color="#CE1126" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Professional Conduct & Community</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            You must maintain professional standards:{'\n\n'}
            • Treat all customers with respect and courtesy{'\n'}
            • Not discriminate based on gender, ethnicity, religion{'\n'}
            • Not engage in harassment or inappropriate behavior{'\n'}
            • Not request or accept off-platform payments{'\n'}
            • Not share personal contact information to bypass platform{'\n'}
            • Not solicit customers for competing platforms{'\n'}
            • Report platform issues through proper channels{'\n'}
            • Maintain confidentiality of customer information{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Zero Tolerance:</Text>{'\n'}
            • Harassment, threats, or violence{'\n'}
            • Fraud or deceptive practices{'\n'}
            • Theft or property damage{'\n'}
            • Substance abuse during jobs{'\n'}
            • Violations result in immediate account termination
          </Text>
        </View>

        {/* Ratings & Reviews */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#f59e0b22' }]}>
              <Ionicons name="star-outline" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Ratings & Reviews</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            <Text style={[styles.bold, { color: theme.text }]}>Customer Reviews:</Text>{'\n'}
            • Reviews are honest reflections of customer experience{'\n'}
            • You cannot remove or edit customer reviews{'\n'}
            • You may respond to reviews professionally{'\n'}
            • Fake reviews are prohibited and penalized{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Your Rating:</Text>{'\n'}
            • Average rating affects search visibility{'\n'}
            • Below 3.0 stars triggers account review{'\n'}
            • Consistent low ratings may result in suspension{'\n'}
            • Focus on quality service to maintain high ratings{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Review Manipulation:</Text>{'\n'}
            • Asking customers to remove negative reviews{'\n'}
            • Offering incentives for positive reviews{'\n'}
            • Posting fake reviews yourself or through others{'\n'}
            • These actions result in permanent ban
          </Text>
        </View>

        {/* Platform Rules */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#6366F122' }]}>
              <Ionicons name="shield-outline" size={24} color="#6366F1" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Platform Rules & Compliance</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            <Text style={[styles.bold, { color: theme.text }]}>Account Security:</Text>{'\n'}
            • Keep login credentials secure{'\n'}
            • Notify us immediately of unauthorized access{'\n'}
            • Use strong passwords{'\n'}
            • Enable two-factor authentication when available{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Prohibited Activities:</Text>{'\n'}
            • Creating multiple accounts{'\n'}
            • Manipulating platform algorithms{'\n'}
            • Impersonating other handymen{'\n'}
            • Providing false information{'\n'}
            • Circumventing platform fees{'\n'}
            • Using automated tools or bots{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Legal Compliance:</Text>{'\n'}
            • Comply with Cameroonian tax laws{'\n'}
            • Report income as required by law{'\n'}
            • Obtain necessary business licenses{'\n'}
            • Maintain required insurance coverage
          </Text>
        </View>

        {/* Limitation of Liability */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#ef444422' }]}>
              <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Limitation of Liability</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            Handyman Connect Cameroon provides a platform to connect handymen with customers. We are not liable for:{'\n\n'}
            • Disputes between you and customers{'\n'}
            • Quality of work performed{'\n'}
            • Damages or injuries during service{'\n'}
            • Customer non-payment (we facilitate but don't guarantee payment){'\n'}
            • Loss of income due to account suspension{'\n'}
            • Technical issues or platform downtime{'\n\n'}
            You are an independent contractor, not an employee of Handyman Connect Cameroon.
          </Text>
        </View>

        {/* Termination */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#CE112622' }]}>
              <Ionicons name="close-circle-outline" size={24} color="#CE1126" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Termination</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            <Text style={[styles.bold, { color: theme.text }]}>By You:</Text>{'\n'}
            • You may delete your account anytime{'\n'}
            • Outstanding bookings must be completed or transferred{'\n'}
            • Pending withdrawals will be processed{'\n'}
            • Data deletion follows our privacy policy{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>By Platform:</Text>{'\n'}
            • We may suspend accounts for policy violations{'\n'}
            • Serious violations result in immediate termination{'\n'}
            • You will be notified of termination reasons{'\n'}
            • Outstanding balances will be paid within 30 days{'\n'}
            • Repeated violations lead to permanent ban{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Effect of Termination:</Text>{'\n'}
            • Immediate loss of platform access{'\n'}
            • Profile removed from search{'\n'}
            • Customer data deleted per privacy policy{'\n'}
            • Financial records retained for legal compliance
          </Text>
        </View>

        {/* Governing Law */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#6366F122' }]}>
              <Ionicons name="scale-outline" size={24} color="#6366F1" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Governing Law & Disputes</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            These Terms & Conditions are governed by the laws of the Republic of Cameroon. Any disputes arising from 
            your use of our platform shall be resolved through:{'\n\n'}
            • Good-faith negotiation between parties{'\n'}
            • Mediation through platform support{'\n'}
            • Legal proceedings in courts of Douala, Cameroon{'\n\n'}
            You agree to waive any right to participate in class action lawsuits or collective arbitration.
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
            For questions about these Terms & Conditions:{'\n\n'}
            📧 Email: arnoldctn@gmail.com{'\n'}
            📍 Location: Dschang, Cameroon{'\n'}
            📞 Support: Available through the app{'\n'}
            ⏱️ Response time: Within 48 hours
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