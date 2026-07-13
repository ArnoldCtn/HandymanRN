import { Image, Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import useGlobal from '@/services/global'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '@/hooks/use-theme-color'
import useSettingsStore from '@/services/settingsStore'

export default function ProfileScreen() {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const router  = useRouter()
  const logout  = useGlobal(state => state.logout)
  const user    = useGlobal(state => state.user)

  const { theme: themePref, setTheme, language: langPref, setLanguage } = useSettingsStore()

  function resolveAvatar(thumbnail) {
    if (!thumbnail) return null
    if (thumbnail.startsWith('http')) return thumbnail
    return thumbnail
  }
  const avatarUrl = resolveAvatar(user?.thumbnail)

  async function handleLogout() {
    await logout()
    router.replace('/(auth)/SignIn')
  }

  const styles = createStyles(theme)

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Avatar + pencil */}
      <View style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.pencilBtn}
          onPress={() => router.push('/(auth)/EditProfile')}
        >
          <Ionicons name="pencil" size={15} color="white" />
        </TouchableOpacity>
      </View>

      <Text style={styles.username}>{user?.username}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      {user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}

      {/* Edit profile button */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => router.push('/(auth)/EditProfile')}
      >
        <Ionicons name="create-outline" size={20} color={theme.primary} />
        <Text style={styles.editBtnText}>{t('handyman_profile.edit_profile')}</Text>
      </TouchableOpacity>

      <View style={styles.menuSection}>
        {/* Wallet button */}
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/wallet')}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: theme.primary + '11' }]}>
            <Ionicons name="wallet-outline" size={20} color={theme.primary} />
          </View>
          <Text style={styles.menuText}>{t('handyman_profile.wallet')}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/(auth)/PINSettings')}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: theme.error + '11' }]}>
            <Ionicons name="keypad-outline" size={20} color={theme.error} />
          </View>
          <Text style={styles.menuText}>{t('handyman_profile.pin_lock')}</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* App Preferences */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>{t('settings.preferences')}</Text>
        
        <Text style={styles.settingLabel}>{t('settings.language')}</Text>
        <View style={styles.settingRow}>
          <TouchableOpacity 
            style={[styles.settingBtn, langPref === 'en' && styles.settingBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.settingBtnText, langPref === 'en' && styles.settingBtnTextActive]}>{t('settings.english')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingBtn, langPref === 'fr' && styles.settingBtnActive]}
            onPress={() => setLanguage('fr')}
          >
            <Text style={[styles.settingBtnText, langPref === 'fr' && styles.settingBtnTextActive]}>{t('settings.french')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.settingLabel, { marginTop: 16 }]}>{t('settings.display_mode')}</Text>
        <View style={styles.settingRow}>
          <TouchableOpacity 
            style={[styles.settingBtn, themePref === 'light' && styles.settingBtnActive]}
            onPress={() => setTheme('light')}
          >
            <Ionicons name="sunny-outline" size={16} color={themePref === 'light' ? 'white' : theme.textSecondary} />
            <Text style={[styles.settingBtnText, themePref === 'light' && styles.settingBtnTextActive]}>{t('settings.light')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingBtn, themePref === 'dark' && styles.settingBtnActive]}
            onPress={() => setTheme('dark')}
          >
            <Ionicons name="moon-outline" size={16} color={themePref === 'dark' ? 'white' : theme.textSecondary} />
            <Text style={[styles.settingBtnText, themePref === 'dark' && styles.settingBtnTextActive]}>{t('settings.dark')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingBtn, themePref === 'system' && styles.settingBtnActive]}
            onPress={() => setTheme('system')}
          >
            <Ionicons name="settings-outline" size={16} color={themePref === 'system' ? 'white' : theme.textSecondary} />
            <Text style={[styles.settingBtnText, themePref === 'system' && styles.settingBtnTextActive]}>{t('settings.system')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Legal & Policies */}
      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Legal & Policies</Text>
        
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/(auth)/PrivacyPolicy')}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#007A5E11' }]}>
            <Ionicons name="shield-outline" size={20} color="#007A5E" />
          </View>
          <Text style={styles.menuText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/(auth)/TermsConditions')}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#CE112611' }]}>
            <Ionicons name="document-text-outline" size={20} color="#CE1126" />
          </View>
          <Text style={styles.menuText}>Terms & Conditions</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/chat/support?source=profile&type=report')}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#f59e0b11' }]}>
            <Ionicons name="warning-outline" size={20} color="#f59e0b" />
          </View>
          <Text style={styles.menuText}>Report Bad Behavior</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="white" />
        <Text style={styles.logoutText}> {t('auth.logout')}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  container:        { alignItems:'center', paddingVertical: 60, backgroundColor: theme.background },
  avatarWrapper:    { position:'relative', marginBottom:16 },
  avatar:           { width:110, height:110, borderRadius:55, borderWidth: 3, borderColor: theme.surface },
  avatarPlaceholder:{ width:110, height:110, borderRadius:55, backgroundColor: theme.primary, alignItems:'center', justifyContent:'center', borderWidth: 3, borderColor: theme.surface },
  avatarInitial:    { color:'white', fontSize:36, fontWeight:'bold' },
  pencilBtn:        { position:'absolute', bottom:0, right:0, width:30, height:30, borderRadius:15, backgroundColor: theme.primary, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor: theme.surface },
  username:         { fontSize:26, fontWeight:'700', color: theme.text },
  email:            { fontSize:15, color: theme.textSecondary, marginTop:4 },
  phone:            { fontSize:14, color: theme.textSecondary, marginTop:2 },
  editBtn:          { flexDirection:'row', alignItems:'center', marginTop:20, paddingVertical:10, paddingHorizontal:24, borderRadius:20, borderWidth:1.5, borderColor: theme.primary, backgroundColor: theme.surface },
  editBtnText:      { color: theme.primary, fontWeight:'600', marginLeft:6 },
  
  menuSection: { width: '100%', paddingHorizontal: 20, marginTop: 30 },
  menuRow: { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:14, paddingHorizontal:16, backgroundColor: theme.surface, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  menuIconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex:1, fontSize:15, fontWeight:'600', color: theme.text },
  
  settingsCard: { width: '90%', backgroundColor: theme.card, borderRadius: 20, padding: 20, marginTop: 20, borderWidth: 1, borderColor: theme.border },
  settingsTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 8 },
  settingLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
  settingRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  settingBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
  settingBtnActive: { backgroundColor: theme.primary, borderColor: theme.primary },
  settingBtnText: { fontSize: 13, color: theme.text, fontWeight: '500' },
  settingBtnTextActive: { color: 'white', fontWeight: '700' },

  logout:           { flexDirection:'row', height:50, borderRadius:25, alignItems:'center', justifyContent:'center', paddingHorizontal:28, backgroundColor: theme.primary, marginTop: 30, elevation: 4, shadowColor: theme.shadow, shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 4 } },
  logoutText:       { color: 'white', fontWeight:'600' },
})
