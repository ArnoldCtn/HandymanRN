import { Image, Text, View, StyleSheet, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import useGlobal from '@/services/global'
import { useRouter } from 'expo-router'

export default function ProfileScreen() {
  const router  = useRouter()
  const logout  = useGlobal(state => state.logout)
  const user    = useGlobal(state => state.user)   // ← Zustand only, no AsyncStorage

  function resolveAvatar(thumbnail) {
    if (!thumbnail) return null
    if (thumbnail.startsWith('http')) return thumbnail
    return `http://192.168.1.XXX:8000/media/${thumbnail}`
  }
  const avatarUrl = resolveAvatar(user?.thumbnail)

  async function handleLogout() {
    await logout()
    router.replace('/(auth)/SignIn')
  }

  return (
    <View style={styles.container}>
      
      {/* Support Button at top */}
      {/* <TouchableOpacity 
        style={styles.supportTopBtn}
        onPress={() => router.push('/chat/support')}
      >
        <Ionicons name="help-circle-outline" size={20} color="#6366F1" />
        <Text style={styles.supportTopText}>Contact Support</Text>
      </TouchableOpacity> */}

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
          onPress={() => router.push('/(auth)/Home/EditProfile')}
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
        <Ionicons name="create-outline" size={20} color="#6366F1" />
        <Text style={styles.editBtnText}>Edit Profile</Text>
      </TouchableOpacity>


      {/* Wallet button */}
      <TouchableOpacity
        style={styles.menuRow}
        onPress={() => router.push('/wallet')}
      >
        <Ionicons name="wallet-outline" size={20} color="#6366F1" />
        <Text style={styles.menuText}>My Wallet</Text>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </TouchableOpacity>

      <TouchableOpacity
  style={styles.menuRow}
  onPress={() => router.push('/(auth)/PINSettings')}
>
  <Ionicons name="keypad-outline" size={20} color="#6366F1" />
  <Text style={styles.menuText}>App PIN Lock</Text>
  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
</TouchableOpacity>


      {/* Logout */}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#d0d0d0" />
        <Text style={styles.logoutText}> Logout</Text>
      </TouchableOpacity>

    </View>
  )
}

const styles = StyleSheet.create({
  container:        { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#fff' },
  avatarWrapper:    { position:'relative', marginBottom:16 },
  avatar:           { width:110, height:110, borderRadius:55 },
  avatarPlaceholder:{ width:110, height:110, borderRadius:55, backgroundColor:'#6366F1', alignItems:'center', justifyContent:'center' },
  avatarInitial:    { color:'white', fontSize:36, fontWeight:'bold' },
  pencilBtn:        { position:'absolute', bottom:0, right:0, width:30, height:30, borderRadius:15, backgroundColor:'#6366F1', alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:'white' },
  username:         { fontSize:26, fontWeight:'700', color:'#202020' },
  email:            { fontSize:15, color:'gray', marginTop:4 },
  phone:            { fontSize:14, color:'#9ca3af', marginTop:2 },
  editBtn:          { flexDirection:'row', alignItems:'center', marginTop:20, paddingVertical:10, paddingHorizontal:24, borderRadius:20, borderWidth:1.5, borderColor:'#6366F1' },
  editBtnText:      { color:'#6366F1', fontWeight:'600', marginLeft:6 },
  logout:           { flexDirection:'row', height:50, borderRadius:25, alignItems:'center', justifyContent:'center', paddingHorizontal:28, backgroundColor:'#202020', marginTop:14 },
  logoutText:       { color:'#d0d0d0', fontWeight:'600' },
  menuRow: { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:14, paddingHorizontal:16, backgroundColor:'#fff', borderRadius:12, marginTop:10 },
menuText: { flex:1, fontSize:15, fontWeight:'600', color:'#202020' },
  supportTopBtn: { position: 'absolute', top: 60, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  supportTopText: { fontSize: 13, fontWeight: '600', color: '#6366F1' },
})