import {
  View, Text, Image, StyleSheet,
  TouchableOpacity, ScrollView
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import useHandymanGlobal from '@/services/handymanGlobal'
import { useRouter } from 'expo-router'

const SHIFTS = {
  morning:   { label: 'Morning',   icon: 'sunny-outline',         color: '#f59e0b' },
  afternoon: { label: 'Afternoon', icon: 'partly-sunny-outline',  color: '#f97316' },
  evening:   { label: 'Evening',   icon: 'moon-outline',          color: '#6366F1' },
  full_day:  { label: 'Full Day',  icon: 'calendar-outline',      color: '#10b981' },
  flexible:  { label: 'Flexible',  icon: 'time-outline',          color: '#8b5cf6' },
}

export default function HandymanProfileScreen() {
  const router   = useRouter()
  const logout   = useHandymanGlobal(s => s.logout)
  const handyman = useHandymanGlobal(s => s.handyman)

  function resolveAvatar(thumbnail) {
    if (!thumbnail) return null
    if (thumbnail.startsWith('http')) return thumbnail
    return `http://192.168.1.XXX:8000/media/${thumbnail}`
  }
  const avatarUrl = resolveAvatar(handyman?.thumbnail)

  async function handleLogout() {
    await logout()
    router.replace('/handyman/SignIn')
  }

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>

      {/* Government ID verification */}
      <TouchableOpacity
          style={[
            styles.verifyCard,
            handyman?.is_verified && styles.verifyCardDone,
          ]}
          onPress={() => {
            if (!handyman?.is_verified) router.push('/handyman/VerifyId')
          }}
          disabled={handyman?.is_verified}
        >
          <Ionicons
            name={handyman?.is_verified ? 'shield-checkmark' : 'id-card-outline'}
            size={28}
            color={handyman?.is_verified ? '#059669' : '#f59e0b'}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.verifyTitle}>
              {handyman?.is_verified ? 'Government ID verified' : 'Verify government ID'}
            </Text>
            <Text style={styles.verifySub}>
              {handyman?.is_verified
                ? 'Your identity has been confirmed.'
                : 'Required to appear in search and accept bookings.'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#9ca3af" />
        </TouchableOpacity>

      {/* ── Hero ──────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.avatarWrapper}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {handyman?.username?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.pencilBtn}
            onPress={() => router.push('/handyman/EditProfile')}
          >
            <Ionicons name="pencil" size={14} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroName}>{handyman?.username}</Text>
        <Text style={styles.heroEmail}>{handyman?.email}</Text>

        {/* Verified badge */}
        <View style={[
          styles.verifiedBadge,
          { backgroundColor: handyman?.is_verified ? '#d1fae5' : '#fef3c7' }
        ]}>
          <Ionicons
            name={handyman?.is_verified ? 'shield-checkmark' : 'shield-outline'}
            size={14}
            color={handyman?.is_verified ? '#065f46' : '#92400e'}
          />
          <Text style={[
            styles.verifiedText,
            { color: handyman?.is_verified ? '#065f46' : '#92400e' }
          ]}>
            {handyman?.is_verified ? 'Verified' : 'Pending Verification'}
          </Text>
        </View>
      </View>

      {/* ── Info cards ────────────────────────────── */}
      <View style={styles.body}>

        {/* Contact */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Info</Text>
          <InfoRow icon="call-outline"     color="#6366F1" label={handyman?.phone    ?? 'Not set'} />
          <InfoRow icon="mail-outline"     color="#10b981" label={handyman?.email    ?? 'Not set'} />
          <InfoRow icon="location-outline" color="#f59e0b"
            label={
              typeof handyman?.location === 'object'
                ? handyman?.location?.location ?? 'Not set'
                : handyman?.location ?? 'Not set'
            }
          />
        </View>

        {/* Bio */}
        {handyman?.bio && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.bioText}>{handyman.bio}</Text>
          </View>
        )}

        {/* Services */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Services Offered</Text>
          {handyman?.services?.length > 0 ? (
            <View style={styles.chipRow}>
              {handyman.services.map((s, i) => (
                <View key={i} style={styles.chip}>
                  <Ionicons name="construct-outline" size={13} color="#6366F1" />
                  <Text style={styles.chipText}>{s.name ?? s}</Text>
                </View>
              ))}
            </View>
          ) : (
            <EmptyRow text="No services added yet" />
          )}
        </View>

        {/* Availability */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Availability</Text>
          {handyman?.availability &&
          Object.values(handyman.availability).some(v => v.length > 0) ? (
            Object.entries(handyman.availability)
              .filter(([_, shifts]) => shifts.length > 0)
              .map(([day, shifts]) => (
                <View key={day} style={styles.availRow}>
                  <Text style={styles.availDay}>
                    {day.slice(0,3).toUpperCase()}
                  </Text>
                  <View style={styles.shiftChips}>
                    {shifts.map((shift, i) => {
                      const s = SHIFTS[shift] ?? { label: shift, icon:'time-outline', color:'#9ca3af' }
                      return (
                        <View key={i} style={[styles.shiftChip, { backgroundColor: s.color + '22' }]}>
                          <Ionicons name={s.icon} size={12} color={s.color} />
                          <Text style={[styles.shiftChipText, { color: s.color }]}>
                            {s.label}
                          </Text>
                        </View>
                      )
                    })}
                  </View>
                </View>
              ))
          ) : (
            <EmptyRow text="No availability set" />
          )}
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settings</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/handyman/EditProfile')}
          >
            <View style={[styles.menuIcon, { backgroundColor:'#e0e7ff' }]}>
              <Ionicons name="create-outline" size={18} color="#6366F1" />
            </View>
            <Text style={styles.menuLabel}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/handyman/PINSettings')}
          >
            <View style={[styles.menuIcon, { backgroundColor:'#fee2e2' }]}>
              <Ionicons name="keypad-outline" size={18} color="#ef4444" />
            </View>
            <Text style={styles.menuLabel}>App PIN Lock</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  )
}

function InfoRow({ icon, color, label }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.infoText}>{label}</Text>
    </View>
  )
}

function EmptyRow({ text }) {
  return (
    <Text style={{ color:'#9ca3af', fontSize:13, marginTop:4 }}>{text}</Text>
  )
}

const styles = StyleSheet.create({
  root: { flex:1, backgroundColor:'#f9fafb' },

  // Hero
  hero:             { backgroundColor:'#1e293b', alignItems:'center', paddingTop:52, paddingBottom:28, paddingHorizontal:24 },
  avatarWrapper:    { position:'relative', marginBottom:14 },
  avatar:           { width:100, height:100, borderRadius:50, borderWidth:3, borderColor:'#f59e0b' },
  avatarPlaceholder:{ backgroundColor:'#334155', alignItems:'center', justifyContent:'center' },
  avatarInitial:    { color:'white', fontSize:36, fontWeight:'bold' },
  pencilBtn:        { position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:14, backgroundColor:'#f59e0b', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'#1e293b' },
  heroName:         { fontSize:22, fontWeight:'800', color:'white', marginBottom:4 },
  heroEmail:        { fontSize:14, color:'#94a3b8', marginBottom:10 },
  verifiedBadge:    { flexDirection:'row', alignItems:'center', gap:6, paddingVertical:4, paddingHorizontal:12, borderRadius:20 },
  verifiedText:     { fontSize:12, fontWeight:'700' },

  // Body
  body:     { paddingHorizontal:16, paddingTop:16 },

  // Cards
  card:      { backgroundColor:'white', borderRadius:16, padding:16, marginBottom:14, elevation:2, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, shadowOffset:{width:0,height:2} },
  cardTitle: { fontSize:15, fontWeight:'700', color:'#202020', marginBottom:12, borderBottomWidth:1, borderColor:'#f0f0f0', paddingBottom:8 },

  // Info rows
  infoRow:   { flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 },
  infoText:  { fontSize:14, color:'#374151', flex:1 },

  // Bio
  bioText:   { fontSize:14, color:'#374151', lineHeight:22 },

  // Service chips
  chipRow:   { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:      { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#e0e7ff', paddingVertical:5, paddingHorizontal:10, borderRadius:20 },
  chipText:  { fontSize:12, color:'#6366F1', fontWeight:'600' },

  // Availability
  availRow:   { flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 },
  availDay:   { fontSize:12, fontWeight:'800', color:'#374151', width:36 },
  shiftChips: { flexDirection:'row', flexWrap:'wrap', gap:6, flex:1 },
  shiftChip:  { flexDirection:'row', alignItems:'center', gap:4, paddingVertical:3, paddingHorizontal:8, borderRadius:12 },
  shiftChipText: { fontSize:11, fontWeight:'600' },

  // Settings menu
  menuRow:   { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, borderBottomWidth:1, borderColor:'#f9fafb' },
  menuIcon:  { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
  menuLabel: { flex:1, fontSize:14, fontWeight:'600', color:'#202020' },

  // Logout
  logoutBtn:  { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor:'#1e293b', paddingVertical:14, borderRadius:14, marginBottom:10 },
  logoutText: { color:'white', fontSize:15, fontWeight:'700' },

  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  verifyCardDone: {
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
  },
  verifyTitle: { fontSize: 15, fontWeight: '700', color: '#202020' },
  verifySub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
})