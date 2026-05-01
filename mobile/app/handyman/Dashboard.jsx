import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image
} from 'react-native'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import useHandymanGlobal from '@/services/handymanGlobal'

const QUICK_ACTIONS = [
  { icon: 'toggle-outline',      label: 'Availability',  color: '#10b981', bg: '#d1fae5', route: '/(auth_handyman)/Home/EditProfile' },
  { icon: 'construct-outline',   label: 'My Services',   color: '#6366F1', bg: '#e0e7ff', route: '/(auth_handyman)/Home/EditProfile' },
  { icon: 'location-outline',    label: 'My Location',   color: '#f59e0b', bg: '#fef3c7', route: '/(auth_handyman)/Home/EditProfile' },
  { icon: 'keypad-outline',      label: 'PIN Lock',      color: '#ef4444', bg: '#fee2e2', route: '/(auth_handyman)/PINSettings'       },
]

const STAT_CARDS = [
  { label: 'Jobs Done',    value: '—', icon: 'checkmark-circle-outline', color: '#10b981' },
  { label: 'Rating',       value: '—', icon: 'star-outline',             color: '#f59e0b' },
  { label: 'Pending',      value: '—', icon: 'time-outline',             color: '#6366F1' },
  { label: 'Earnings',     value: '—', icon: 'wallet-outline',           color: '#ef4444' },
]

const TIPS = [
  { icon: 'shield-checkmark-outline', color: '#10b981', title: 'Stay Verified',   body: 'Keep your profile complete so clients trust you faster.' },
  { icon: 'hammer-outline',           color: '#f59e0b', title: 'List All Skills',  body: 'Handymen with more services get 3× more bookings.' },
  { icon: 'location-outline',         color: '#6366F1', title: 'Set Location',     body: 'Clients search by location — always keep yours accurate.' },
  { icon: 'time-outline',             color: '#ef4444', title: 'Update Hours',     body: 'Available handymen appear first in search results.' },
]

export default function HandymanDashboard() {
  const router   = useRouter()
  const handyman = useHandymanGlobal(s => s.handyman)

  function resolveAvatar(thumbnail) {
    if (!thumbnail) return null
    if (thumbnail.startsWith('http')) return thumbnail
    return `http://192.168.1.XXX:8000/media/${thumbnail}`
  }
  const avatarUrl = resolveAvatar(handyman?.thumbnail)

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero header ─────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroGreet}>
            {new Date().getHours() < 12 ? 'Good morning' :
             new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'} 👋
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

        {/* Avatar */}
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

      {/* ── Stat cards ────────────────────────────── */}
      <Text style={styles.sectionLabel}>Overview</Text>
      <View style={styles.statsGrid}>
        {STAT_CARDS.map((s, i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: s.color + '22' }]}>
              <Ionicons name={s.icon} size={22} color={s.color} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Quick actions ─────────────────────────── */}
      <Text style={styles.sectionLabel}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((a, i) => (
          <TouchableOpacity
            key={i}
            style={styles.actionCard}
            onPress={() => router.push(a.route)}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
              <Ionicons name={a.icon} size={26} color={a.color} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Profile completeness ──────────────────── */}
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
              color={item.done ? '#10b981' : '#d1d5db'}
            />
            <Text style={[
              styles.healthLabel,
              { color: item.done ? '#202020' : '#9ca3af' }
            ]}>
              {item.label}
            </Text>
            {!item.done && (
              <TouchableOpacity
                onPress={() => router.push('/(auth_handyman)/Home/EditProfile')}
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

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor:'#f9fafb' },

  // Hero
  hero:                 { flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1e293b', paddingHorizontal:20, paddingTop:52, paddingBottom:28 },
  heroLeft:             { flex:1, marginRight:12 },
  heroGreet:            { fontSize:13, color:'#94a3b8', marginBottom:4 },
  heroName:             { fontSize:24, fontWeight:'800', color:'white', marginBottom:10 },
  availBadge:           { flexDirection:'row', alignItems:'center', gap:6, alignSelf:'flex-start', paddingVertical:4, paddingHorizontal:10, borderRadius:20 },
  availDot:             { width:8, height:8, borderRadius:4 },
  availText:            { fontSize:12, fontWeight:'600' },
  heroAvatar:           { width:70, height:70, borderRadius:35, borderWidth:3, borderColor:'#f59e0b' },
  heroAvatarPlaceholder:{ backgroundColor:'#334155', alignItems:'center', justifyContent:'center' },
  heroAvatarInitial:    { color:'white', fontSize:28, fontWeight:'bold' },

  // Verify
  verifyBanner: { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'#fef3c7', marginHorizontal:16, marginTop:14, padding:12, borderRadius:12, borderWidth:1, borderColor:'#fde68a' },
  verifyText:   { flex:1, fontSize:13, color:'#92400e', fontWeight:'500' },

  // Sections
  sectionLabel: { fontSize:14, fontWeight:'700', color:'#9ca3af', letterSpacing:1, textTransform:'uppercase', marginHorizontal:16, marginTop:24, marginBottom:12 },

  // Stats
  statsGrid:    { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:8 },
  statCard:     { width:'50%', paddingHorizontal:8, marginBottom:12 },
  statIconBox:  { width:44, height:44, borderRadius:12, alignItems:'center', justifyContent:'center', marginBottom:8 },
  statValue:    { fontSize:22, fontWeight:'800', color:'#202020' },
  statLabel:    { fontSize:12, color:'#9ca3af', marginTop:2 },

  // Actions
  actionsGrid:  { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:8 },
  actionCard:   { width:'50%', paddingHorizontal:8, marginBottom:12 },
  actionIcon:   { width:56, height:56, borderRadius:16, alignItems:'center', justifyContent:'center', marginBottom:8 },
  actionLabel:  { fontSize:14, fontWeight:'600', color:'#202020' },

  // Health
  healthCard:   { backgroundColor:'white', marginHorizontal:16, borderRadius:16, padding:16, elevation:2, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, shadowOffset:{width:0,height:2} },
  healthRow:    { flexDirection:'row', alignItems:'center', gap:10, paddingVertical:8, borderBottomWidth:1, borderColor:'#f0f0f0' },
  healthLabel:  { flex:1, fontSize:14, fontWeight:'500' },
  healthFix:    { fontSize:12, color:'#f59e0b', fontWeight:'700' },

  // Tips
  tipCard:      { flexDirection:'row', alignItems:'flex-start', gap:12, backgroundColor:'white', marginHorizontal:16, marginBottom:10, borderRadius:14, padding:14, elevation:1, shadowColor:'#000', shadowOpacity:0.04, shadowRadius:6, shadowOffset:{width:0,height:1} },
  tipIcon:      { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },
  tipTitle:     { fontSize:14, fontWeight:'700', color:'#202020', marginBottom:3 },
  tipBody:      { fontSize:12, color:'#6b7280', lineHeight:18 },
})