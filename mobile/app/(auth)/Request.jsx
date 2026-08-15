import { useEffect, useState } from 'react'
import {
  View, StyleSheet, ActivityIndicator,
  RefreshControl, ScrollView,
  TouchableOpacity
} from 'react-native'
import api from '@/services/api'
import ServiceCarousel from '@/components/ServiceCarousel'
import useGlobal from '@/services/global'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/use-theme-color'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import PulseView from '@/components/PulseView'

export default function RequestScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [services, setServices] = useState([])
  const [recentReviews, setRecentReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const user = useGlobal(s => s.user)
  const router = useRouter()

  async function fetchServices() {
    try {
      const [sRes, rRes] = await Promise.all([
        api.get('/services/'),
        api.get('/ratings/recent/')
      ])
      setServices(sRes.data)
      setRecentReviews(rRes.data.results || rRes.data || [])
    } catch (e) {
      console.log('[Request] fetch:', e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { console.log('[Request] mounted'); fetchServices() }, [])
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return t('request.good_morning');
    if (hours < 18) return t('request.good_afternoon');
    return t('request.good_evening');
  };

  const styles = createStyles(theme);

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.background }} size="large" color={theme.primary} />

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchServices() }}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.heroLeft}>
          <View>
            <ThemedText type="secondary" style={styles.heroGreet}>
              {getGreeting()} 👋
            </ThemedText>
            <ThemedText type="subtitle" style={styles.heroName} numberOfLines={1}>
              {user?.username ?? 'user'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.headerTitle}>{t('request.explore')}</ThemedText>
        </View>

        <View style={{ marginTop: 20 }}>
          <ServiceCarousel services={services} />
        </View>

        <View style={styles.aboutSection}>
          <View style={styles.aboutHeader}>
            <ThemedText type="subtitle" style={styles.title}>
              {t('request.about_title')}
            </ThemedText>
            <ThemedText type="secondary" style={styles.description}>
              {t('request.about_desc')}
            </ThemedText>
          </View>

          {/* Feature Cards */}
          <View style={styles.featureList}>
            {[
              { title: t('request.feature_browse_title'), icon: 'construct-outline', desc: t('request.feature_browse_desc') },
              { title: t('request.feature_find_title'), icon: 'location-outline', desc: t('request.feature_find_desc') },
              { title: t('request.feature_book_title'), icon: 'card-outline', desc: t('request.feature_book_desc') }
            ].map((item, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={item.icon} size={32} color="white" />
                </View>
                <View style={styles.featureContent}>
                  <ThemedText type="defaultSemiBold" style={styles.featureTitle}>{item.title}</ThemedText>
                  <ThemedText type="secondary" style={styles.featureText}>{item.desc}</ThemedText>
                </View>
              </View>
            ))}
          </View>

          {/* Why Choose Us */}
          <View style={styles.whySection}>
            <ThemedText type="subtitle" style={styles.whyTitle}>
              {t('request.why_title')}
            </ThemedText>
            <View style={styles.whyGrid}>
              {[
                { icon: 'shield-checkmark-outline', title: t('request.why_trusted_title'), desc: t('request.why_trusted_desc') },
                { icon: 'phone-portrait-outline', title: t('request.why_easy_title'), desc: t('request.why_easy_desc') },
                { icon: 'lock-closed-outline', title: t('request.why_secure_title'), desc: t('request.why_secure_desc') },
                { icon: 'headset-outline', title: t('request.why_support_title'), desc: t('request.why_support_desc') }
              ].map((item, i) => (
                <View key={i} style={styles.whyCard}>
                  <View style={styles.whyIconContainer}>
                    <Ionicons name={item.icon} size={24} color={theme.primary} />
                  </View>
                  <ThemedText type="defaultSemiBold" style={styles.whyCardTitle}>{item.title}</ThemedText>
                  <ThemedText type="secondary" style={styles.whyCardDesc}>{item.desc}</ThemedText>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('(auth)/search')}>
              <Ionicons name="arrow-forward" size={20} color="white" style={{ marginRight: 8 }} />
              <ThemedText style={styles.ctaText}>{t('request.explore_services')}</ThemedText>
            </TouchableOpacity>
          </View>


          {/* ── Recent Community Reviews ──────────────── */}
          <View style={styles.reviewSection}>
            <ThemedText type="defaultSemiBold" style={styles.sectionLabel}>{t('request.recent_reviews')}</ThemedText>
            {recentReviews.length > 0 ? (
              recentReviews.map((item, i) => (
                <View key={item.id} style={styles.reviewCardSmall}>
                  <View style={styles.reviewTop}>
                    <Ionicons name="star" size={14} color={theme.accent} />
                    <ThemedText style={[styles.reviewRating, { color: theme.accent }]}>{item.rating}/10</ThemedText>
                    <ThemedText type="secondary" style={styles.reviewTarget}>
                      {t('request.for_handyman', { username: item.handyman_info?.username })}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.reviewTextSmall} numberOfLines={2}>
                    "{item.review || t('request.no_comment')}"
                  </ThemedText>
                  <ThemedText type="secondary" style={styles.reviewAuthor}>
                    {t('request.by_user', { username: item.user_info?.username })}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText type="secondary" style={styles.noReviewsText}>{t('request.no_reviews')}</ThemedText>
            )}
          </View>

          {/* Support Button at Bottom */}
          <View style={styles.supportContainer}>
            <TouchableOpacity
              style={styles.supportBtn}
              onPress={() => router.push('/chat/support')}
            >
              <Ionicons name="headset-outline" size={24} color="white" />
              <ThemedText style={styles.supportBtnText}>{t('request.need_help')}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        {/* Security Notice */}
        <PulseView style={styles.securityNotice}>
          <Ionicons name="shield-outline" size={20} color={theme.accent} />
          <ThemedText style={styles.securityNoticeText}>{t('dashboard.security_notice')}</ThemedText>
        </PulseView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerBrand}>
              <Ionicons name="build-outline" size={32} color={theme.primary} />
              <ThemedText type="subtitle" style={styles.footerBrandText}>{t('request.footer_brand')}</ThemedText>
            </View>
            <View style={styles.footerContact}>
              <View style={styles.footerContactItem}>
                <Ionicons name="mail-outline" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
                <ThemedText type="secondary" style={styles.footerText}>arnodlctn@gmail.com</ThemedText>
              </View>
              <View style={styles.footerContactItem}>
                <Ionicons name="call-outline" size={16} color={theme.textSecondary} style={{ marginRight: 8 }} />
                <ThemedText type="secondary" style={styles.footerText}>+237 675 828 711</ThemedText>
              </View>
            </View>
            <ThemedText type="secondary" style={styles.copy}>{t('request.footer_copy')}</ThemedText>
          </View>
        </View>

      </ScrollView>
    </ThemedView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: theme.text },

  heroGreet: { fontSize: 13, marginBottom: 4 },
  heroName: { fontSize: 24, fontWeight: '800', marginBottom: 10, color: 'white' },
  heroLeft: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, backgroundColor: '#1e293b' },

  // About Section Styles
  aboutSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderRadius: 20,
    margin: 20,
    marginHorizontal: 16,
    backgroundColor: theme.background === '#0f172a' ? '#1e293b' : '#f0f9ff'
  },
  aboutHeader: { marginBottom: 30 },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
    color: theme.primary
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
    color: theme.textSecondary
  },

  // Feature Cards
  featureList: { gap: 16, marginBottom: 30 },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: theme.card
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: theme.primary
  },
  featureContent: { flex: 1 },
  featureTitle: {
    fontSize: 18,
    marginBottom: 4,
    color: theme.text
  },
  featureText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.textSecondary
  },

  // Why Choose Us Section
  whySection: {
    marginTop: 20,
    paddingHorizontal: 20
  },
  whyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: theme.primary
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  whyCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: theme.card
  },
  whyIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: theme.background
  },
  whyCardTitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 6,
    color: theme.text
  },
  whyCardDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    color: theme.textSecondary
  },

  // CTA Button
  ctaButton: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: theme.primary
  },
  ctaText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginTop: 20,
    backgroundColor: theme.surface
  },
  footerContent: { alignItems: 'center' },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  footerBrandText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: theme.text
  },
  footerContact: { marginBottom: 16 },
  footerContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  footerText: {
    fontSize: 14,
    color: theme.textSecondary
  },
  copy: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.textSecondary
  },
  supportContainer: { paddingHorizontal: 0, marginTop: 30, marginBottom: 10 },
  supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, elevation: 4, shadowColor: theme.shadow, shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, backgroundColor: theme.primary },
  supportBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

  // Reviews
  reviewSection: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: { fontSize: 16, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5, color: theme.text },
  reviewCardSmall: { borderRadius: 14, padding: 14, marginBottom: 12, borderLeftWidth: 4, elevation: 2, shadowColor: theme.shadow, shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, backgroundColor: theme.card, borderLeftColor: theme.accent },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  reviewRating: { fontSize: 13, fontWeight: '800' },
  reviewTarget: { fontSize: 12, color: theme.textSecondary },
  reviewTextSmall: { fontSize: 13, color: theme.text, lineHeight: 18, fontStyle: 'italic' },
  reviewAuthor: { fontSize: 11, fontWeight: '700', textAlign: 'right', marginTop: 4, color: theme.textSecondary },
  noReviewsText: { textAlign: 'center', fontSize: 14, marginVertical: 20, color: theme.textSecondary },
  
  securityNotice: {
    backgroundColor: theme.accent + '22',
    padding: 12,
    margin: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.accent + '44'
  },
  securityNoticeText: { fontSize: 12, color: theme.text, flex: 1, fontWeight: '500' }
})
