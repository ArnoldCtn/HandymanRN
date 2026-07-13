import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image, ActivityIndicator
} from 'react-native'
import { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import useHandymanGlobal from '@/services/handymanGlobal'
import handymanApi from '@/services/handymanApi'

// Cameroon flag colors
const CAMEROON_COLORS = {
  green: '#007A5E',
  red: '#CE1126',
  yellow: '#FCD116',
}

const TIPS = [
  { icon: 'shield-checkmark-outline', color: CAMEROON_COLORS.green, title: 'Stay Verified',   body: 'Keep your profile complete so clients trust you faster.' },
  { icon: 'hammer-outline',           color: CAMEROON_COLORS.yellow, title: 'List All Skills',  body: 'Handymen with more services get 3× more bookings.' },
  { icon: 'location-outline',         color: '#6366F1', title: 'Set Location',     body: 'Clients search by location — always keep yours accurate.' },
  { icon: 'time-outline',             color: CAMEROON_COLORS.red, title: 'Update Hours',     body: 'Available handymen appear first in search results.' },
]

export default function HandymanDashboard() {
  const router   = useRouter()
  const handyman = useHandymanGlobal(s => s.handyman)
  const [recentReviews, setRecentReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [stats, setStats] = useState({
    jobs_done: 0,
    pending_jobs: 0,
    total_earnings: 0,
    average_rating: 0,
    total_ratings: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    async function fetchDashboardStats() {
      if (!handyman?.id) return
      try {
        const res = await handymanApi.get('/handymen/me/dashboard-stats/')
        if (res.data) {
          setStats(res.data)
        }
      } catch (e) {
        console.log('[Dashboard] Error fetching stats:', e)
      } finally {
        setLoadingStats(false)
      }
    }
    fetchDashboardStats()
  }, [handyman?.id])

  useEffect(() => {
    async function fetchRecentReviews() {
      if (!handyman?.id) return
      try {
        const res = await handymanApi.get(`/ratings/handyman/${handyman.id}/?limit=5`)
        setRecentReviews(res.data.results || res.data || [])
      } catch (e) {
        console.log('[Dashboard] Error fetching reviews:', e)
      } finally {
        setLoadingReviews(false)
      }
    }
    fetchRecentReviews()
  }, [handyman?.id])

  function resolveAvatar(thumbnail) {
    if (!thumbnail) return null
    if (thumbnail.startsWith('http')) return thumbnail
    return `http://192.168.1.XXX:8000/media/${thumbnail}`
  }
  const avatarUrl = resolveAvatar(handyman?.thumbnail)

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero header with Cameroon colors ───────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroDate}>{dateStr}</Text>
          <Text style={styles.heroGreet}>
            {today.getHours() < 12 ? 'Good morning' :
             today.getHours() < 18 ? 'Good afternoon' : 'Good evening'} 👋
          </Text>
          <Text style={styles.heroName} numberOfLines={1}>
            {handyman?.username ?? 'Handyman'}
          </Text>

          {/* Availability badge */}
          <View style={[
            styles.availBadge,
            { backgroundColor: handyman?.is_available ? '#d1fae5' : '#fee2e2' }
          ]}>
            <View style={[
              styles.availDot,
              { backgroundColor: handyman?.is_available ? '#10b981' : '#ef4444' }
            ]} />
            <Text style={[
              styles.availText,
              { color: handyman?.is_available ? '#065f46' : '#991b1b' }
            ]}>
              {handyman?.is_available ? 'Available for jobs' : 'Not available'}
            </Text>
          </View>
        </View>

        {/* Avatar with Cameroon flag accent */}
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.heroAvatar} />
        ) : (
          <View style={[styles.heroAvatar, styles.heroAvatarPlaceholder]}>
            <Text style={styles.heroAvatarInitial}>
              {handyman?.username?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
      </View>

      {/* ── Verification banner ───────────────────── */}
      {!handyman?.is_verified && (
        <View style={styles.verifyBanner}>
          <Ionicons name="alert-circle-outline" size={20} color="#92400e" />
          <Text style={styles.verifyText}>
            Your account is pending admin verification.
          </Text>
        </View>
      )}

      {/* ── Today's Summary ────────────────────────── */}
      <Text style={styles.sectionLabel}>Today's Summary</Text>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {loadingStats ? '—' : stats.jobs_done}
            </Text>
            <Text style={styles.summaryLabel}>Jobs Done</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {loadingStats ? '—' : stats.pending_jobs}
            </Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {loadingStats ? '—' : `${stats.average_rating}⭐`}
            </Text>
            <Text style={styles.summaryLabel}>Rating</Text>
          </View>
        </View>
        <View style={styles.earningsRow}>
          <Ionicons name="wallet" size={20} color={CAMEROON_COLORS.green} />
          <Text style={styles.earningsLabel}>Total Earnings:</Text>
          <Text style={styles.earningsValue}>
            {loadingStats ? '—' : `${stats.total_earnings.toLocaleString()} XAF`}
          </Text>
        </View>
      </View>

      {/* ── Profile Health ─────────────────────────── */}
      <Text style={styles.sectionLabel}>Profile Health</Text>
      <View style={styles.healthCard}>
        {[
          { label: 'Photo',        done: !!handyman?.thumbnail },
          { label: 'Phone',        done: !!handyman?.phone },
          { label: 'Bio',          done: !!handyman?.bio },
          { label: 'Services',     done: (handyman?.services?.length ?? 0) > 0 },
          { label: 'Location',     done: !!handyman?.location },
          { label: 'Availability', done: !!handyman?.availability && Object.values(handyman?.availability ?? {}).some(v => v.length > 0) },
        ].map((item, i) => (
          <View key={i} style={styles.healthRow}>
            <Ionicons
              name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={item.done ? CAMEROON_COLORS.green : '#d1d5db'}
            />
            <Text style={[
              styles.healthLabel,
              { color: item.done ? '#202020' : '#9ca3af' }
            ]}>
              {item.label}
            </Text>
            {!item.done && (
              <TouchableOpacity
                onPress={() => router.push('/handyman/EditProfile')}
              >
                <Text style={styles.healthFix}>Add →</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* ── Pro tips ──────────────────────────────── */}
      <Text style={styles.sectionLabel}>Pro Tips</Text>
      {TIPS.map((tip, i) => (
        <View key={i} style={styles.tipCard}>
          <View style={[styles.tipIcon, { backgroundColor: tip.color + '22' }]}>
            <Ionicons name={tip.icon} size={20} color={tip.color} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            <Text style={styles.tipBody}>{tip.body}</Text>
          </View>
        </View>
      ))}

      {/* ── Recent Reviews ────────────────────────── */}
      <View style={styles.rowBetween}>
        <Text style={styles.sectionLabel}>Recent Reviews</Text>
        <TouchableOpacity onPress={() => router.push('/handyman/Reviews')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.reviewsList}>
        {loadingReviews ? (
          <ActivityIndicator color={CAMEROON_COLORS.yellow} style={{ marginVertical: 20 }} />
        ) : recentReviews.length > 0 ? (
          recentReviews.map((item, i) => (
            <View key={item.id} style={styles.miniReviewCard}>
              <View style={styles.miniReviewHeader}>
                <Ionicons name="star" size={12} color={CAMEROON_COLORS.yellow} />
                <Text style={styles.miniRating}>{item.rating}/10</Text>
                <Text style={styles.miniUser}>by {item.user_info?.username || 'Anonymous'}</Text>
              </View>
              {item.review ? (
                <Text style={styles.miniText} numberOfLines={2}>{item.review}</Text>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.noReviews}>No ratings yet</Text>
        )}
      </View>

      {/* Support Button at Bottom */}
      <View style={styles.supportContainer}>
        <TouchableOpacity 
          style={styles.supportBtn}
          onPress={() => router.push('/chat/support?source=handyman')}
        >
          <Ionicons name="headset-outline" size={24} color="white" />
          <Text style={styles.supportBtnText}>Need Help? Contact Admin</Text>
        </TouchableOpacity>
      </View>

      {/* Footer with Cameroon touch */}
      <View style={styles.footer}>
        <View style={styles.footerFlag}>
          <View style={[styles.footerFlagStripe, { backgroundColor: CAMEROON_COLORS.green }]} />
          <View style={[styles.footerFlagStripe, { backgroundColor: CAMEROON_COLORS.red }]} />
          <View style={[styles.footerFlagStripe, { backgroundColor: CAMEROON_COLORS.yellow }]} />
        </View>
        <Text style={styles.footerText}>© 2026 Handyman Connect Cameroon. All rights reserved.</Text>
        <Text style={styles.footerSubText}>Quality service at your fingertips</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor:'#f9fafb' },

  // Hero
  hero:                 { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1e293b', paddingHorizontal:20, paddingTop:52, paddingBottom:28 },
  heroLeft:             { flex:1, marginRight:12 },
  heroDate:             { fontSize:11, color:CAMEROON_COLORS.yellow, marginBottom:4, fontWeight:'600' },
  heroGreet:            { fontSize:13, color:'#94a3b8', marginBottom:4 },
  heroName:             { fontSize:24, fontWeight:'800', color:'white', marginBottom:10 },
  availBadge:           { flexDirection:'row', alignItems:'center', gap:6, alignSelf:'flex-start', paddingVertical:4, paddingHorizontal:10, borderRadius:20 },
  availDot:             { width:8, height:8, borderRadius:4 },
  availText:            { fontSize:12, fontWeight:'600' },
  heroAvatar:           { width:70, height:70, borderRadius:35, borderWidth:3, borderColor:CAMEROON_COLORS.yellow },
  heroAvatarPlaceholder:{ backgroundColor:'#334155', alignItems:'center', justifyContent:'center' },
  heroAvatarInitial:    { color:'white', fontSize:28, fontWeight:'bold' },

  // Verify
  verifyBanner: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#fef3c7', marginHorizontal:16, marginTop:14, padding:12, borderRadius:12, borderWidth:1, borderColor:'#fde68a' },
  verifyText:   { flex:1, fontSize:13, color:'#92400e', fontWeight:'500' },

  // Sections
  sectionLabel: { fontSize:14, fontWeight:'700', color:'#9ca3af', letterSpacing:1, textTransform:'uppercase', marginHorizontal:16, marginTop:24, marginBottom:12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  viewAll: { fontSize: 13, color: CAMEROON_COLORS.yellow, fontWeight: '700', marginTop: 12 },

  // Summary Card
  summaryCard: { backgroundColor:'white', marginHorizontal:16, borderRadius:16, padding:16, elevation:2, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, shadowOffset:{width:0,height:2}, borderLeftWidth:4, borderLeftColor:CAMEROON_COLORS.green },
  summaryRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-around', marginBottom:16 },
  summaryItem: { flex:1, alignItems:'center' },
  summaryValue: { fontSize:22, fontWeight:'800', color:'#202020', marginBottom:4 },
  summaryLabel: { fontSize:12, color:'#9ca3af', fontWeight:'600' },
  summaryDivider: { width:1, height:40, backgroundColor:'#e5e7eb' },
  earningsRow: { flexDirection:'row', alignItems:'center', gap:8, paddingTop:12, borderTopWidth:1, borderTopColor:'#f0f0f0' },
  earningsLabel: { fontSize:14, color:'#6b7280', fontWeight:'600' },
  earningsValue: { fontSize:16, fontWeight:'800', color:CAMEROON_COLORS.green, marginLeft:'auto' },

  // Reviews List
  reviewsList: { paddingHorizontal: 16 },
  miniReviewCard: { backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  miniReviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  miniRating: { fontSize: 12, fontWeight: '700', color: '#92400e' },
  miniUser: { fontSize: 11, color: '#9ca3af' },
  miniText: { fontSize: 13, color: '#4b5563', fontStyle: 'italic' },
  noReviews: { textAlign: 'center', color: '#9ca3af', fontSize: 13, marginVertical: 10 },

  // Health
  healthCard:   { backgroundColor:'white', marginHorizontal:16, borderRadius:16, padding:16, elevation:2, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, shadowOffset:{width:0,height:2} },
  healthRow:    { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:8, borderBottomWidth:1, borderColor:'#f0f0f0' },
  healthLabel:  { flex:1, fontSize:14, fontWeight:'500' },
  healthFix:    { fontSize:12, color:CAMEROON_COLORS.yellow, fontWeight:'700' },

  // Tips
  tipCard:      { flexDirection:'row', alignItems:'flex-start', gap:12, backgroundColor:'white', marginHorizontal:16, marginBottom:10, borderRadius:14, padding:14, elevation:1, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:6, shadowOffset:{width:0,height:1} },
  tipIcon:      { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },
  tipTitle: { fontSize:14, fontWeight:'700', color:'#202020', marginBottom:3 },
  tipBody: { fontSize:12, color:'#6b7280', lineHeight:18 },

  supportContainer: { paddingHorizontal: 16, marginTop: 30, marginBottom: 20 },
  supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1e293b', paddingVertical: 16, borderRadius: 14, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  supportBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

  footer: { marginTop: 40, alignItems: 'center', paddingBottom: 20 },
  footerFlag: { flexDirection: 'row', width: 120, height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  footerFlagStripe: { flex: 1 },
  footerText: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  footerSubText: { fontSize: 10, color: '#d1d5db', marginTop: 4 },
})