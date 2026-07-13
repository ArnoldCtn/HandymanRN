import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useAppTheme } from '@/hooks/use-theme-color'

export default function UserPrivacyPolicy() {
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy Policy</Text>
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
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Privacy Matters</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            At Handyman Connect Cameroon, we are committed to protecting your personal information and your right to privacy. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
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
            <Text style={[styles.subTitle, { color: theme.text }]}>Personal Information</Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
              • Name, email address, and phone number{'\n'}
              • Profile photo and bio{'\n'}
              • Location data for service matching{'\n'}
              • Payment information (processed securely through MTN Money/Orange Money)
            </Text>
          </View>

          <View style={styles.subSection}>
            <Text style={[styles.subTitle, { color: theme.text }]}>Usage Data</Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
              • Device information and operating system{'\n'}
              • App usage patterns and preferences{'\n'}
              • Booking history and service preferences{'\n'}
              • Communication records with handymen
            </Text>
          </View>
        </View>

        {/* How We Use Your Information */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#FCD11622' }]}>
              <Ionicons name="settings-outline" size={24} color="#FCD116" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>How We Use Your Information</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            We use your information to:{'\n\n'}
            • Connect you with verified handymen in your area{'\n'}
            • Process bookings and payments securely{'\n'}
            • Send booking confirmations and updates{'\n'}
            • Improve our services and user experience{'\n'}
            • Provide customer support{'\n'}
            • Ensure platform safety and prevent fraud
          </Text>
        </View>

        {/* Data Sharing */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#6366F122' }]}>
              <Ionicons name="people-outline" size={24} color="#6366F1" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Sharing & Disclosure</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            We share your information only when necessary:{'\n\n'}
            • <Text style={[styles.bold, { color: theme.text }]}>With Handymen:</Text> Name, location, and service details to facilitate bookings{'\n'}
            • <Text style={[styles.bold, { color: theme.text }]}>Service Providers:</Text> Payment processors (MTN Money, Orange Money) for transactions{'\n'}
            • <Text style={[styles.bold, { color: theme.text }]}>Legal Requirements:</Text> When required by law or to protect our rights{'\n\n'}
            We never sell your personal data to third parties.
          </Text>
        </View>

        {/* Data Security */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#10b98122' }]}>
              <Ionicons name="lock-closed-outline" size={24} color="#10b981" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Security</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            We implement industry-standard security measures:{'\n\n'}
            • End-to-end encryption for sensitive data{'\n'}
            • Secure servers with regular security audits{'\n'}
            • Regular data backups and disaster recovery{'\n'}
            • Limited access to personal information{'\n\n'}
            However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </Text>
        </View>

        {/* Your Rights */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#007A5E22' }]}>
              <Ionicons name="hand-left-outline" size={24} color="#007A5E" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Rights</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            You have the right to:{'\n\n'}
            • Access your personal data{'\n'}
            • Correct inaccurate information{'\n'}
            • Request deletion of your account{'\n'}
            • Opt-out of marketing communications{'\n'}
            • Export your data in a portable format{'\n\n'}
            To exercise these rights, contact us through the app or email privacy@handymanconnect.cm
          </Text>
        </View>

        {/* Cookies & Tracking */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#f59e0b22' }]}>
              <Ionicons name="cookie-outline" size={24} color="#f59e0b" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Cookies & Tracking</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            We use local storage and similar technologies to:{'\n\n'}
            • Keep you logged in securely{'\n'}
            • Remember your preferences{'\n'}
            • Analyze app performance{'\n\n'}
            You can clear app data through your device settings, but this may log you out.
          </Text>
        </View>

        {/* Children's Privacy */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#CE112622' }]}>
              <Ionicons name="person-outline" size={24} color="#CE1126" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Children's Privacy</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            Our service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. 
            If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
          </Text>
        </View>

        {/* Changes to Policy */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#6366F122' }]}>
              <Ionicons name="refresh-outline" size={24} color="#6366F1" />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Changes to This Policy</Text>
          </View>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page 
            and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
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
            📞 Support: Available through the app
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