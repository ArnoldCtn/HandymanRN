import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
  RefreshControl, ScrollView,
  TouchableOpacity
} from 'react-native'
import api from '@/services/api'
import ServiceCarousel from '@/components/ServiceCarousel'
import useGlobal from '@/services/global'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'

export default function RequestScreen() {
  const [services,       setServices]       = useState([])
  const [recentReviews,  setRecentReviews]  = useState([])
  const [loading,        setLoading]        = useState(true)
  const [refreshing,     setRefreshing]     = useState(false)

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

  useEffect(() => { fetchServices() }, [])

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366F1" />

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchServices() }}
        />
      }
    >
      <View style={styles.heroLeft}>
         <Text style={styles.heroGreet}>
            {new Date().getHours() < 12 ? 'Good morning' :
             new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'} 👋
          </Text>
          <Text style={styles.heroName} numberOfLines={1}>
            {user?.username ?? 'user'}
          </Text>
      </View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <ServiceCarousel services={services} />
      </View>

      

      <View style={styles.aboutSection}>
        <View style={styles.aboutHeader}>
          <Text style={styles.title}>About HandymanWest</Text>
          <Text style={styles.description}>
            Your trusted partner for finding reliable handymen in the West Region, Cameroon
          </Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.featureList}>
          {[
            { title: 'Browse Services', icon: 'construct-outline', desc: 'Explore our wide range of professional services' },
            { title: 'Find Nearby Pros', icon: 'location-outline', desc: 'Connect with verified handymen in your area' },
            { title: 'Book & Pay', icon: 'card-outline', desc: 'Secure booking and seamless payment system' }
          ].map((item, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={item.icon} size={32} color="white" style={styles.featureIcon} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureText}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Why Choose Us */}
        <View style={styles.whySection}>
          <Text style={styles.whyTitle}>Why Choose HandymanWest?</Text>
          <View style={styles.whyGrid}>
            {[
              { icon: 'shield-checkmark-outline', title: 'Trusted Handymen', desc: 'All professionals are verified and background-checked' },
              { icon: 'phone-portrait-outline', title: 'Easy-to-Use', desc: 'Intuitive app design for seamless experience' },
              { icon: 'lock-closed-outline', title: 'Secure Payments', desc: 'Safe and encrypted payment processing' },
              { icon: 'headset-outline', title: '7/7 Support', desc: 'Round-the-clock customer assistance' }
            ].map((item, i) => (
              <View key={i} style={styles.whyCard}>
                <View style={styles.whyIconContainer}>
                  <Ionicons name={item.icon} size={24} color="#3b82f6" />
                </View>
                <Text style={styles.whyCardTitle}>{item.title}</Text>
                <Text style={styles.whyCardDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
          
          <TouchableOpacity style={styles.ctaButton}>
            <Ionicons name="arrow-forward" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.ctaText}>Explore Services</Text>
          </TouchableOpacity>
        </View>


        {/* ── Recent Community Reviews ──────────────── */}
      <View style={styles.reviewSection}>
        <Text style={styles.sectionLabel}>Recent Community Reviews</Text>
        {recentReviews.length > 0 ? (
          recentReviews.map((item, i) => (
            <View key={item.id} style={styles.reviewCardSmall}>
              <View style={styles.reviewTop}>
                <Ionicons name="star" size={14} color="#f59e0b" />
                <Text style={styles.reviewRating}>{item.rating}/10</Text>
                <Text style={styles.reviewTarget}>for handyman: {item.handyman_info?.username}</Text>
              </View>
              <Text style={styles.reviewTextSmall} numberOfLines={2}>
                "{item.review || 'No comment left'}"
              </Text>
              <Text style={styles.reviewAuthor}>By user: {item.user_info?.username}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noReviewsText}>No reviews yet</Text>
        )}
      </View>

        {/* Support Button at Bottom */}
        <View style={styles.supportContainer}>
          <TouchableOpacity 
            style={styles.supportBtn}
            onPress={() => router.push('/chat/support')}
          >
            <Ionicons name="headset-outline" size={24} color="white" />
            <Text style={styles.supportBtnText}>Need Help? Contact Admin</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.footerBrand}>
            <Ionicons name="build-outline" size={32} color="white" />
            <Text style={styles.footerBrandText}>HandymanWest</Text>
          </View>
          <View style={styles.footerContact}>
            <View style={styles.footerContactItem}>
              <Ionicons name="mail-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              <Text style={styles.footerText}>arnodlctn@gmail.com</Text>
            </View>
            <View style={styles.footerContactItem}>
              <Ionicons name="call-outline" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              <Text style={styles.footerText}>+237 675 828 711</Text>
            </View>
          </View>
          <Text style={styles.copy}>© 2024 HandymanWest. All rights reserved.</Text>
        </View>
      </View>

      {/* You can add more sections below e.g. Featured, Nearby etc */}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header:      { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight:'black', color: '#202020' },

  heroGreet:            { fontSize:13, color:'#94a3b8', marginBottom:4 },
  heroName:             { fontSize:24, fontWeight:'800', color:'white', marginBottom:10 },
  heroLeft:                 { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1e293b', paddingHorizontal:20, paddingTop:10, paddingBottom:10 },
 
  // About Section Styles
  aboutSection: { 
    backgroundColor: '#f0f9ff', 
    paddingHorizontal: 20, 
    paddingVertical: 30,
    borderRadius: 20,
    margin: 20,
    marginHorizontal: 16
  },
  aboutHeader: { marginBottom: 30 },
  title: { 
    color: '#1e40af', 
    fontSize: 28, 
    fontWeight: '900', 
    textAlign: 'center', 
    marginBottom: 12 
  },
  description: { 
    color: '#64748b', 
    textAlign: 'center', 
    fontSize: 16, 
    lineHeight: 24,
    paddingHorizontal: 20
  },
  
  // Feature Cards
  featureList: { gap: 16, marginBottom: 30 },
  featureCard: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6
  },
  featureIconContainer: { 
    backgroundColor: '#3b82f6', 
    width: 60, 
    height: 60, 
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  featureIcon: {},
  featureContent: { flex: 1 },
  featureTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1e293b',
    marginBottom: 4
  },
  featureText: { 
    fontSize: 14, 
    color: '#64748b',
    lineHeight: 20
  },

  // Why Choose Us Section
  whySection: { 
    marginTop: 20,
    paddingHorizontal: 20
  },
  whyTitle: { 
    color: '#1e40af', 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center',
    marginBottom: 24
  },
  whyGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginBottom: 30
  },
  whyCard: { 
    backgroundColor: 'white',
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4
  },
  whyIconContainer: { 
    backgroundColor: '#eff6ff',
    width: 50, 
    height: 50, 
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  whyCardTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 6
  },
  whyCardDesc: { 
    fontSize: 12, 
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16
  },

  // CTA Button
  ctaButton: { 
    backgroundColor: '#3b82f6', 
    padding: 16, 
    borderRadius: 12, 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  ctaText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },

  // Footer
  footer: { 
    backgroundColor: '#1e293b', 
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginTop: 20
  },
  footerContent: { alignItems: 'center' },
  footerBrand: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  footerBrandText: { 
    color: 'white', 
    fontSize: 20, 
    fontWeight: 'bold',
    marginLeft: 8
  },
  footerContact: { marginBottom: 16 },
  footerContactItem: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 6
  },
  footerText: { 
    color: '#94a3b8', 
    fontSize: 14 
  },
  copy: { 
    color: '#64748b', 
    fontSize: 12,
    textAlign: 'center'
  },
  supportContainer: { paddingHorizontal: 0, marginTop: 30, marginBottom: 10 },
  supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1e40af', paddingVertical: 16, borderRadius: 14, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  supportBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

  // Reviews
  reviewSection: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  reviewCardSmall: { backgroundColor: 'white', borderRadius: 14, padding: 14, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#f59e0b', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  reviewRating: { fontSize: 13, fontWeight: '800', color: '#92400e' },
  reviewTarget: { fontSize: 12, color: '#64748b' },
  reviewTextSmall: { fontSize: 13, color: '#4b5563', lineHeight: 18, fontStyle: 'italic' },
  reviewAuthor: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textAlign: 'right', marginTop: 4 },
  noReviewsText: { textAlign: 'center', color: '#94a3b8', fontSize: 14, marginVertical: 20 },
  })