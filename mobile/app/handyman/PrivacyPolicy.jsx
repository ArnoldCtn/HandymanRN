import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useAppTheme } from '@/hooks/use-theme-color'

export default function HandymanPrivacyPolicy() {
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy Policy for Handymen</Text>
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
              <Ionicons name="shield-checkmark-outline" size={24} color="#007A5E" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Privacy as a Handyman</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            At Handyman Connect Cameroon, we are committed to protecting your personal information and your right to privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information as a handyman service provider on our platform.
          </Text>
        </View>

        {/* Information We Collect */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#CE112622' }]}>
              <Ionicons name="document-text-outline" size={24} color="#CE1126" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Information We Collect</Text>
          </View>
          
          <View style={styles.subSection}>
            <Text style={[styles.subTitle, { color: theme.text }]}>Personal & Professional Information</Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
              • Full name, email address, and phone number{'\n'}
              • Government-issued ID for verification (stored securely){'\n'}
              • Profile photo and bio{'\n'}
              • Location data for service matching{'\n'}
              • Services offered and categories{'\n'}
              • Availability schedule{'\n'}
              • Portfolio/job pictures{'\n'}
              • Payment information (MTN Money/Orange Money details)
            </Text>
          </View>

          <View style={styles.subSection}>
            <Text style={[styles.subTitle, { color: theme.text }]}>Performance & Financial Data</Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
              • Booking history and completion rates{'\n'}
              • Customer ratings and reviews{'\n'}
              • Earnings and transaction history{'\n'}
              • Wallet balance and withdrawal records{'\n'}
              • Response times and availability patterns
            </Text>
          </View>

          <View style={styles.subSection}>
            <Text style={[styles.subTitle, { color: theme.text }]}>Usage Data</Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
              • Device information and operating system{'\n'}
              • App usage patterns and preferences{'\n'}
              • Communication records with customers{'\n'}
              • Location tracking during active jobs (with consent)
            </Text>
          </View>
        </View>

        {/* ID Verification & Security */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#FCD11622' }]}>
              <Ionicons name="id-card-outline" size={24} color="#FCD116" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>ID Verification & Document Security</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            <Text style={[styles.bold, { color: theme.text }]}>Government ID Verification:</Text>{'\n'}
            • Your ID card images are encrypted and stored securely{'\n'}
            • Used solely for identity verification purposes{'\n'}
            • Not shared with third parties except as required by law{'\n'}
            • Retained for the duration of your account plus 7 years for legal compliance{'\n\n'}
            <Text style={[styles.bold, { color: theme.text }]}>Certificate & Gallery Requirements:</Text>{'\n'}
            • Professional certificates may be requested for certain service categories{'\n'}
            • Portfolio images are reviewed to ensure quality and professionalism{'\n'}
            • All images must be original work and not infringe on others' copyright{'\n'}
            • We reserve the right to remove inappropriate or unprofessional content
          </Text>
        </View>

        {/* How We Use Your Information */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#6366F122' }]}>
              <Ionicons name="settings-outline" size={24} color="#6366F1" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>How We Use Your Information</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            We use your information to:{'\n\n'}
            • Verify your identity and qualifications{'\n'}
            • Match you with customers seeking your services{'\n'}
            • Process payments and manage your wallet{'\n'}
            • Display your profile, ratings, and portfolio to potential clients{'\n'}
            • Send booking requests and updates{'\n'}
            • Provide customer support{'\n'}
            • Improve our platform and services{'\n'}
            • Ensure platform safety and prevent fraud{'\n'}
            • Comply with legal and regulatory requirements
          </Text>
        </View>

        {/* Data Sharing */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#10b98122' }]}>
              <Ionicons name="people-outline" size={24} color="#10b981" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Sharing & Disclosure</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            We share your information with:{'\n\n'}
            • <Text style={[styles.bold, { color: theme.text }]}>Customers:</Text> Name, services offered, ratings, and portfolio to facilitate bookings{'\n'}
            • <Text style={[styles.bold, { color: theme.text }]}>Payment Processors:</Text> MTN Money, Orange Money for transaction processing{'\n'}
            • <Text style={[styles.bold, { color: theme.text }]}>Service Providers:</Text> Cloud hosting, analytics, and customer support tools{'\n'}
            • <Text style={[styles.bold, { color: theme.text }]}>Legal Authorities:</Text> When required by law or to protect rights and safety{'\n\n'}
            We never sell your personal data to third parties for marketing purposes.
          </Text>
        </View>

        {/* Your Rights & Control */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#007A5E22' }]}>
              <Ionicons name="hand-left-outline" size={24} color="#007A5E" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Rights & Control</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            As a handyman on our platform, you have the right to:{'\n\n'}
            • Access and update your profile information{'\n'}
            • Control your availability and service areas{'\n'}
            • Manage your portfolio and remove images{'\n'}
            • Request a copy of your data{'\n'}
            • Delete your account (subject to legal retention requirements){'\n'}
            • Opt-out of non-essential communications{'\n'}
            • Request correction of inaccurate information{'\n\n'}
            To exercise these rights, contact us through the app or email privacy@handymanconnect.cm
          </Text>
        </View>

        {/* Financial Privacy */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#10b98122' }]}>
              <Ionicons name="wallet-outline" size={24} color="#10b981" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Financial Privacy</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            • Your payment details and wallet information are encrypted{'\n'}
            • Financial transactions are logged for accounting and legal compliance{'\n'}
            • Earnings data is visible only to you and platform administrators{'\n'}
            • Withdrawal information is shared only with payment processors{'\n'}
            • Tax documentation may be provided as required by Cameroonian law{'\n\n'}
            Platform commission: 30% of each transaction. You receive 70% of the gross amount.
          </Text>
        </View>

        {/* Data Security */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#f59e0b22' }]}>
              <Ionicons name="lock-closed-outline" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Security</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            We implement comprehensive security measures:{'\n\n'}
            • End-to-end encryption for sensitive data (IDs, payment info){'\n'}
            • Secure cloud storage with regular security audits{'\n'}
            • Regular data backups and disaster recovery plans{'\n'}
            • Limited employee access to personal information{'\n'}
            • Secure authentication and access controls{'\n\n'}
            However, no system is completely secure. Please notify us immediately of any unauthorized access to your account.
          </Text>
        </View>

        {/* Professional Conduct & Monitoring */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#CE112622' }]}>
              <Ionicons name="eye-outline" size={24} color="#CE1126" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Professional Conduct & Monitoring</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            To maintain platform quality, we monitor:{'\n\n'}
            • Customer reviews and ratings for quality assurance{'\n'}
            • Booking completion rates and cancellation patterns{'\n'}
            • Communication logs for safety and policy compliance{'\n'}
            • Profile accuracy and verification status{'\n\n'}
            Your activity data helps us maintain a trustworthy platform and may be used in dispute resolution.
          </Text>
        </View>

        {/* Children's Privacy */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#6366F122' }]}>
              <Ionicons name="person-outline" size={24} color="#6366F1" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Age Requirement</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            You must be at least 18 years old to register as a handyman on our platform. By creating an account, 
            you confirm that you meet this age requirement. We do not knowingly allow minors to provide services through our platform.
          </Text>
        </View>

        {/* Changes to Policy */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#f59e0b22' }]}>
              <Ionicons name="refresh-outline" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Changes to This Policy</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            We may update this Privacy Policy to reflect changes in our practices or legal requirements. 
            We will notify you of significant changes through the app or via email. Continued use of the platform 
            after changes constitutes acceptance of the updated policy.
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
            If you have questions about this Privacy Policy, please contact us:{'\n\n'}
            📧 Email: arnoldctn@gmail.com{'\n'}
            📍 Location: Dschang, Cameroon{'\n'}
            📞 Support: Available through the app{'\n'}
            ⏱️ Response time: Within 48 hours
          </Text>
        </View>

        {/* Report Bad Behavior */}
        <TouchableOpacity 
          style={[styles.reportBtn, { backgroundColor: '#CE1126' }]}
          onPress={() => router.push('/chat/support?source=privacy&type=report')}
        >
          <Ionicons name="warning-outline" size={22} color="white" />
          <Text style={styles.reportBtnText}>Report Bad Behavior or Privacy Concern</Text>
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
  subSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  subTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
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