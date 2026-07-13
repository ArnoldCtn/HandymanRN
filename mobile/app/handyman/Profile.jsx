import {
  View, Text, Image, StyleSheet,
  TouchableOpacity, ScrollView
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import useHandymanGlobal from '@/services/handymanGlobal'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/use-theme-color'
import useSettingsStore from '@/services/settingsStore'

const SHIFTS = {
  morning:   { label: 'Morning',   icon: 'sunny-outline',         color: '#f59e0b' },
  afternoon: { label: 'Afternoon', icon: 'partly-sunny-outline',  color: '#f97316' },
  evening:   { label: 'Evening',   icon: 'moon-outline',          color: '#6366F1' },
  full_day:  { label: 'Full Day',  icon: 'calendar-outline',      color: '#10b981' },
  flexible:  { label: 'Flexible',  icon: 'time-outline',          color: '#8b5cf6' },
}

export default function HandymanProfileScreen() {
  const { t, i18n } = useTranslation()
  const theme = useAppTheme()
  const router   = useRouter()
  const logout   = useHandymanGlobal(s => s.logout)
  const handyman = useHandymanGlobal(s => s.handyman)

  const { theme: themePref, setTheme, language: langPref, setLanguage } = useSettingsStore()

  function resolveAvatar(thumbnail) {
    if (!thumbnail) return null
    if (thumbnail.startsWith('http')) return thumbnail
    return thumbnail
  }
  const avatarUrl = resolveAvatar(handyman?.thumbnail)

  async function handleLogout() {
    await logout()
    router.replace('/handyman/SignIn')
  }

  const styles = createStyles(theme)

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
            color={handyman?.is_verified ? theme.success : theme.accent}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.verifyTitle}>
              {handyman?.is_verified ? t('handyman_profile.id_verified', 'Government ID verified') : t('handyman_profile.verify_id', 'Verify government ID')}
            </Text>
            <Text style={styles.verifySub}>
              {handyman?.is_verified
                ? t('handyman_profile.id_confirmed', 'Your identity has been confirmed.')
                : t('handyman_profile.id_required', 'Required to appear in search and accept bookings.')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.textSecondary} />
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

        {handyman?.average_rating && (
          <TouchableOpacity 
            style={styles.ratingBadge}
            onPress={() => router.push('/handyman/Reviews')}
          >
            <Ionicons name="star" size={16} color={theme.accent} />
            <Text style={styles.ratingValue}>{Number(handyman.average_rating).toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({handyman.total_ratings ?? 0} {t('handyman_profile.reviews', 'reviews')})</Text>
          </TouchableOpacity>
        )}

        {/* Verified badge */}
        <View style={[
          styles.verifiedBadge,
          { backgroundColor: handyman?.is_verified ? theme.success + '22' : theme.accent + '22' }
        ]}>
          <Ionicons
            name={handyman?.is_verified ? 'shield-checkmark' : 'shield-outline'}
            size={14}
            color={handyman?.is_verified ? theme.success : theme.accent}
          />
          <Text style={[
            styles.verifiedText,
            { color: handyman?.is_verified ? theme.success : theme.accent }
          ]}>
            {handyman?.is_verified ? t('handyman_profile.verified', 'Verified') : t('handyman_profile.pending', 'Pending Verification')}
          </Text>
        </View>
      </View>

      {/* ── Info cards ────────────────────────────── */}
      <View style={styles.body}>

        {/* Contact */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('handyman_profile.contact_info', 'Contact Info')}</Text>
          <InfoRow theme={theme} icon="call-outline"     color={theme.primary} label={handyman?.phone    ?? t('common.not_set')} />
          <InfoRow theme={theme} icon="mail-outline"     color={theme.success} label={handyman?.email    ?? t('common.not_set')} />
          <InfoRow theme={theme} icon="location-outline" color={theme.accent}
            label={
              typeof handyman?.location === 'object'
                ? handyman?.location?.location ?? t('common.not_set')
                : handyman?.location ?? t('common.not_set')
            }
          />
          <InfoRow theme={theme} icon="person-outline"   color="#8b5cf6" label={handyman?.gender ? (handyman.gender.charAt(0).toUpperCase() + handyman.gender.slice(1)) : t('common.not_set')} />
          <InfoRow theme={theme} icon="calendar-outline" color="#ec4899" label={handyman?.birth_date ?? t('common.not_set')} />
        </View>

        {/* Bio */}
        {handyman?.bio && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('handyman_profile.about', 'About')}</Text>
            <Text style={styles.bioText}>{handyman.bio}</Text>
          </View>
        )}

        {/* Services with Categories */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('handyman_profile.services', 'Services Offered')}</Text>
          {handyman?.services?.length > 0 ? (
            <View style={styles.servicesContainer}>
              {handyman.services.map((service, i) => {
                const serviceCategories = handyman?.categories?.filter(cat => {
                  const catServiceId = typeof cat === 'object' ? (cat.service ?? cat.service_id) : null
                  return catServiceId === service.id
                }) || []
                
                return (
                  <View key={i} style={styles.serviceGroup}>
                    <View style={styles.serviceHeader}>
                      <Ionicons name="construct-outline" size={16} color={theme.primary} />
                      <Text style={styles.serviceName}>{service.name ?? service}</Text>
                    </View>
                    
                    {serviceCategories.length > 0 ? (
                      <View style={styles.categoriesList}>
                        {serviceCategories.map((cat, catIndex) => (
                          <View key={catIndex} style={styles.categoryItem}>
                            <Ionicons name="pricetag-outline" size={12} color={theme.accent} />
                            <Text style={styles.categoryName}>
                              {typeof cat === 'object' ? cat.name : cat}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noCategoriesText}>
                        {t('handyman_profile.no_categories', 'No categories selected')}
                      </Text>
                    )}
                  </View>
                )
              })}
            </View>
          ) : (
            <EmptyRow theme={theme} text={t('handyman_profile.no_services', 'No services added yet')} />
          )}
        </View>

        {/* Availability */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('handyman_profile.availability', 'Availability')}</Text>
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
                      const s = SHIFTS[shift] ?? { label: shift, icon:'time-outline', color:theme.textSecondary }
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
            <EmptyRow theme={theme} text={t('handyman_profile.no_availability', 'No availability set')} />
          )}
        </View>

        {/* Job Pictures Button and Prompt */}
        <View style={styles.card}>
           <Text style={styles.cardTitle}>{t('handyman_profile.portfolio', 'Portfolio')}</Text>
           <Text style={styles.glowingText}>{t('handyman_profile.glowing_prompt', 'Provide clean, clear pics of you working')}</Text>
           <TouchableOpacity
            style={styles.jobPicsBtn}
            onPress={() => router.push('/handyman/JobPictures')}
          >
            <Ionicons name="images-outline" size={20} color="white" />
            <Text style={styles.jobPicsBtnText}>{t('handyman_profile.manage_pics', 'Manage Job Pictures')}</Text>
          </TouchableOpacity>
        </View>

        {/* App Preferences */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('settings.preferences', 'Preferences')}</Text>
          
          <Text style={styles.settingLabel}>{t('settings.language', 'Language')}</Text>
          <View style={styles.settingRow}>
            <TouchableOpacity 
              style={[styles.settingBtn, langPref === 'en' && styles.settingBtnActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.settingBtnText, langPref === 'en' && styles.settingBtnTextActive]}>{t('settings.english', 'English')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.settingBtn, langPref === 'fr' && styles.settingBtnActive]}
              onPress={() => setLanguage('fr')}
            >
              <Text style={[styles.settingBtnText, langPref === 'fr' && styles.settingBtnTextActive]}>{t('settings.french', 'French')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.settingLabel, { marginTop: 16 }]}>{t('settings.display_mode', 'Display Mode')}</Text>
          <View style={styles.settingRow}>
            <TouchableOpacity 
              style={[styles.settingBtn, themePref === 'light' && styles.settingBtnActive]}
              onPress={() => setTheme('light')}
            >
              <Ionicons name="sunny-outline" size={16} color={themePref === 'light' ? 'white' : theme.textSecondary} />
              <Text style={[styles.settingBtnText, themePref === 'light' && styles.settingBtnTextActive]}>{t('settings.light', 'Light')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.settingBtn, themePref === 'dark' && styles.settingBtnActive]}
              onPress={() => setTheme('dark')}
            >
              <Ionicons name="moon-outline" size={16} color={themePref === 'dark' ? 'white' : theme.textSecondary} />
              <Text style={[styles.settingBtnText, themePref === 'dark' && styles.settingBtnTextActive]}>{t('settings.dark', 'Dark')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.settingBtn, themePref === 'system' && styles.settingBtnActive]}
              onPress={() => setTheme('system')}
            >
              <Ionicons name="settings-outline" size={16} color={themePref === 'system' ? 'white' : theme.textSecondary} />
              <Text style={[styles.settingBtnText, themePref === 'system' && styles.settingBtnTextActive]}>{t('settings.system', 'System')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('handyman_profile.account', 'Account & Financials')}</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/wallet?source=handyman')}
          >
            <View style={[styles.menuIcon, { backgroundColor: theme.success + '22' }]}>
              <Ionicons name="wallet-outline" size={18} color={theme.success} />
            </View>
            <Text style={styles.menuLabel}>{t('handyman_profile.wallet', 'My Wallet')}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/handyman/EditProfile')}
          >
            <View style={[styles.menuIcon, { backgroundColor: theme.primary + '22' }]}>
              <Ionicons name="create-outline" size={18} color={theme.primary} />
            </View>
            <Text style={styles.menuLabel}>{t('handyman_profile.edit_profile', 'Edit Profile')}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/handyman/PINSettings')}
          >
            <View style={[styles.menuIcon, { backgroundColor: theme.error + '22' }]}>
              <Ionicons name="keypad-outline" size={18} color={theme.error} />
            </View>
            <Text style={styles.menuLabel}>{t('handyman_profile.pin_lock', 'App PIN Lock')}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Legal & Policies */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legal & Policies</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/handyman/PrivacyPolicy')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#007A5E22' }]}>
              <Ionicons name="shield-outline" size={18} color="#007A5E" />
            </View>
            <Text style={styles.menuLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/handyman/TermsConditions')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#CE112622' }]}>
              <Ionicons name="document-text-outline" size={18} color="#CE1126" />
            </View>
            <Text style={styles.menuLabel}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/chat/support?source=profile&type=report')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#f59e0b22' }]}>
              <Ionicons name="warning-outline" size={18} color="#f59e0b" />
            </View>
            <Text style={styles.menuLabel}>Report Bad Behavior</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutText}>{t('auth.logout', 'Sign Out')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  )
}

function InfoRow({ theme, icon, color, label }) {
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 }}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={{ fontSize:14, color: theme.text, flex:1 }}>{label}</Text>
    </View>
  )
}

function EmptyRow({ theme, text }) {
  return (
    <Text style={{ color: theme.textSecondary, fontSize:13, marginTop:4 }}>{text}</Text>
  )
}

const createStyles = (theme) => StyleSheet.create({
  root: { flex:1, backgroundColor: theme.background },

  // Hero
  hero:             { backgroundColor: theme.surface, alignItems:'center', paddingTop:52, paddingBottom:28, paddingHorizontal:24, borderBottomWidth: 1, borderColor: theme.border },
  avatarWrapper:    { position:'relative', marginBottom:14 },
  avatar:           { width:100, height:100, borderRadius:50, borderWidth:3, borderColor: theme.accent },
  avatarPlaceholder:{ backgroundColor: theme.border, alignItems:'center', justifyContent:'center' },
  avatarInitial:    { color: theme.text, fontSize:36, fontWeight:'bold' },
  pencilBtn:        { position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:14, backgroundColor: theme.accent, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor: theme.surface },
  heroName:         { fontSize:22, fontWeight:'800', color: theme.text, marginBottom:4 },
  heroEmail:        { fontSize:14, color: theme.textSecondary, marginBottom:10 },
  ratingBadge:      { flexDirection:'row', alignItems:'center', gap:4, backgroundColor: theme.accent + '11', paddingVertical:4, paddingHorizontal:10, borderRadius:12, marginBottom:10, borderWidth:1, borderColor: theme.accent + '22' },
  ratingValue:      { fontSize:14, fontWeight:'700', color: theme.accent },
  ratingCount:      { fontSize:12, color: theme.accent, opacity:0.8 },
  verifiedBadge:    { flexDirection:'row', alignItems:'center', gap:6, paddingVertical:4, paddingHorizontal:12, borderRadius:20 },
  verifiedText:     { fontSize:12, fontWeight:'700' },

  // Body
  body:     { paddingHorizontal:16, paddingTop:16 },

  // Cards
  card:      { backgroundColor: theme.card, borderRadius:16, padding:16, marginBottom:14, elevation:2, shadowColor: theme.shadow, shadowOpacity:0.05, shadowRadius:8, shadowOffset:{width:0,height:2} },
  cardTitle: { fontSize:15, fontWeight:'700', color: theme.text, marginBottom:12, borderBottomWidth:1, borderColor: theme.border, paddingBottom:8 },

  // Info rows
  infoRow:   { flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 },
  infoText:  { fontSize:14, color: theme.text, flex:1 },

  // Bio
  bioText:   { fontSize:14, color: theme.text, lineHeight:22 },

  // Service chips
  chipRow:   { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:      { flexDirection:'row', alignItems:'center', gap:5, backgroundColor: theme.primary + '11', paddingVertical:5, paddingHorizontal:10, borderRadius:20 },
  chipText:  { fontSize:12, color: theme.primary, fontWeight:'600' },

  // Services with categories
  servicesContainer: { gap:12 },
  serviceGroup: { backgroundColor: theme.background, padding:12, borderRadius:12, borderWidth:1, borderColor: theme.border },
  serviceHeader: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:8 },
  serviceName: { fontSize:14, fontWeight:'700', color: theme.text, flex:1 },
  categoriesList: { marginLeft:24, gap:6 },
  categoryItem: { flexDirection:'row', alignItems:'center', gap:6, marginVertical:2 },
  categoryName: { fontSize:13, color: theme.textSecondary, fontWeight:'500' },
  noCategoriesText: { fontSize:12, color: theme.textSecondary, fontStyle:'italic', marginLeft:24, marginTop:4 },

  // Availability
  availRow:   { flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 },
  availDay:   { fontSize:12, fontWeight:'800', color: theme.text, width:36 },
  shiftChips: { flexDirection:'row', flexWrap:'wrap', gap:6, flex:1 },
  shiftChip:  { flexDirection:'row', alignItems:'center', gap:4, paddingVertical:3, paddingHorizontal:8, borderRadius:12 },
  shiftChipText: { fontSize:11, fontWeight:'600' },

  // Settings menu
  menuRow:   { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12, borderBottomWidth:1, borderColor: theme.border },
  menuIcon:  { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
  menuLabel: { flex:1, fontSize:14, fontWeight:'600', color: theme.text },

  // Logout
  logoutBtn:  { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, backgroundColor: theme.primary, paddingVertical:14, borderRadius:14, marginBottom:10 },
  logoutText: { color:'white', fontSize:15, fontWeight:'700' },

  verifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.accent + '44',
    backgroundColor: theme.accent + '11',
  },
  verifyCardDone: {
    borderColor: theme.success + '44',
    backgroundColor: theme.success + '11',
  },
  verifyTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
  verifySub: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },

  glowingText: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: theme.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  jobPicsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 5,
  },
  jobPicsBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },

  settingLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
  settingRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  settingBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  settingBtnActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  settingBtnText: { fontSize: 13, color: theme.text, fontWeight: '500' },
  settingBtnTextActive: { color: 'white', fontWeight: '700' },
})
