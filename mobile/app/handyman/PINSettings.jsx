import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { PIN } from '@/services/pin'
import PINPad from '@/components/PINPad'

// ── Internal steps ──────────────────────────────────────
const STEP = {
  MENU:         'menu',        // main toggle screen
  VERIFY_OLD:   'verify_old',  // enter current PIN to change/disable
  ENTER_NEW:    'enter_new',   // enter new PIN
  CONFIRM_NEW:  'confirm_new', // confirm new PIN
  ENABLE_NEW:   'enable_new',  // first-time PIN setup
  ENABLE_CONF:  'enable_conf', // confirm first-time PIN
}

export default function PINSettingsScreen() {
  const router = useRouter()
  const [step,       setStep]      = useState(STEP.MENU)
  const [pinEnabled, setPinEnabled] = useState(false)
  const [newPIN,     setNewPIN]    = useState('')
  const [error,      setError]     = useState('')

  // Load current state on mount
  useState(() => {
    PIN.isEnabled().then(setPinEnabled)
  })

  // ── Toggle switch ────────────────────────────────────
  async function onToggle() {
    if (pinEnabled) {
      // Need to verify current PIN before disabling
      setStep(STEP.VERIFY_OLD)
    } else {
      // Set up new PIN
      setStep(STEP.ENABLE_NEW)
    }
  }

  // ── Handlers for each step ───────────────────────────
  async function handleVerifyOld(entered) {
    const ok = await PIN.verify(entered)
    if (!ok) { setError('Wrong PIN. Try again.'); return }
    setError('')
    // Came here from disable toggle or change button
    if (pinEnabled) {
      await PIN.disable()
      setPinEnabled(false)
      setStep(STEP.MENU)
      Alert.alert('PIN Disabled', 'Your app PIN has been removed.')
    } else {
      setStep(STEP.ENTER_NEW)
    }
  }

  function handleEnterNew(entered) {
    setNewPIN(entered)
    setError('')
    setStep(STEP.CONFIRM_NEW)
  }

  async function handleConfirmNew(entered) {
    if (entered !== newPIN) {
      setError("PINs don't match. Try again.")
      setStep(STEP.ENTER_NEW)
      return
    }
    await PIN.set(entered)
    setPinEnabled(true)
    setNewPIN('')
    setError('')
    setStep(STEP.MENU)
    Alert.alert('PIN Set', 'Your app PIN is now active.')
  }

  function handleEnableNew(entered) {
    setNewPIN(entered)
    setError('')
    setStep(STEP.ENABLE_CONF)
  }

  async function handleEnableConf(entered) {
    if (entered !== newPIN) {
      setError("PINs don't match. Try again.")
      setStep(STEP.ENABLE_NEW)
      return
    }
    await PIN.set(entered)
    setPinEnabled(true)
    setNewPIN('')
    setError('')
    setStep(STEP.MENU)
    Alert.alert('PIN Enabled', 'App will now lock when backgrounded.')
  }

  // ── Render correct step ──────────────────────────────
  if (step === STEP.VERIFY_OLD) return (
    <PINPad
      key="verify_old"
      title="Verify Current PIN"
      subtitle="Enter your current PIN to continue"
      errorMessage={error}
      onComplete={handleVerifyOld}
      showCancel
      onCancel={() => { setStep(STEP.MENU); setError('') }}
    />
  )

  if (step === STEP.ENTER_NEW || step === STEP.ENABLE_NEW) return (
    <PINPad
      key="enter_new"   
      title="Set New PIN"
      subtitle="Choose a 6-digit PIN"
      errorMessage={error}
      onComplete={step === STEP.ENABLE_NEW ? handleEnableNew : handleEnterNew}
      showCancel
      onCancel={() => { setStep(STEP.MENU); setError('') }}
    />
  )

  if (step === STEP.CONFIRM_NEW || step === STEP.ENABLE_CONF) return (
    <PINPad
      key="confirm_new"
      title="Confirm PIN"
      subtitle="Enter the same PIN again"
      errorMessage={error}
      onComplete={step === STEP.ENABLE_CONF ? handleEnableConf : handleConfirmNew}
      showCancel
      onCancel={() => { setStep(STEP.MENU); setError('') }}
    />
  )

  // ── Main menu ────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#202020" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App PIN Lock</Text>
        <View style={{ width:24 }} />
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View>
            <Text style={styles.rowTitle}>PIN Lock</Text>
            <Text style={styles.rowSub}>
              {pinEnabled ? 'App locks when backgrounded' : 'App is unlocked'}
            </Text>
          </View>
          <Switch
            value={pinEnabled}
            onValueChange={onToggle}
            trackColor={{ false:'#e5e7eb', true:'#a5b4fc' }}
            thumbColor={pinEnabled ? '#6366F1' : '#9ca3af'}
          />
        </View>

        {pinEnabled && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.row}
              onPress={() => { setStep(STEP.VERIFY_OLD); setError('') }}
            >
              <View>
                <Text style={styles.rowTitle}>Change PIN</Text>
                <Text style={styles.rowSub}>Enter current PIN then set a new one</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={{fontWeight:'900'}}>
        Please Dont Share your PIN and always Remember it.
      </Text>
      <Text style={styles.hint}>
        Your PIN is stored locally on this device only.{'\n'}
        It is not sent to any server.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex:1, backgroundColor:'#f9fafb' },
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, backgroundColor:'#fff', borderBottomWidth:1, borderColor:'#f0f0f0',paddingVertical: 15,
    marginVertical: 20, },
  headerTitle: { fontSize:18, fontWeight:'700', color:'#202020' },
  card:        { backgroundColor:'#fff', borderRadius:16, margin:16, paddingHorizontal:16, overflow:'hidden', elevation:2, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:6, shadowOffset:{width:0,height:2} },
  row:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:18 },
  rowTitle:    { fontSize:15, fontWeight:'600', color:'#202020' },
  rowSub:      { fontSize:12, color:'#9ca3af', marginTop:2 },
  divider:     { height:1, backgroundColor:'#f0f0f0' },
  hint:        { fontSize:12, color:'#9ca3af', textAlign:'center', marginTop:8, lineHeight:18, paddingHorizontal:24 },
})