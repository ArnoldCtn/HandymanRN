import { useEffect, useRef, useState } from 'react'
import {
  Animated, StyleSheet, Text,
  TouchableOpacity, Vibration, View
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'

const KEYS = [
  ['1','2','3'],
  ['4','5','6'],
  ['7','8','9'],
  ['', '0','⌫'],
]

export default function PINPad({
  title        = 'Enter PIN',
  subtitle     = '',
  onComplete,
  onCancel,
  showCancel   = false,
  errorMessage = '',
}) {
  const [digits,   setDigits]   = useState([])
  const [waiting,  setWaiting]  = useState(false)  // ← blocks input while parent processes
  const shakeAnim = useRef(new Animated.Value(0)).current

  // ── Reset digits when error message changes (wrong PIN) ──
  useEffect(() => {
    if (errorMessage) {
      Vibration.vibrate(200)
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10,  duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,   duration: 50, useNativeDriver: true }),
      ]).start(() => {
        setDigits([])     // ← clear after shake so user can retry
        setWaiting(false) // ← unblock input
      })
    }
  }, [errorMessage])

  // ── Auto-submit at 6 digits ──────────────────────────
  useEffect(() => {
    if (digits.length === 6 && !waiting) {
      setWaiting(true)         // ← block further input while parent decides
      onComplete?.(digits.join(''))
      // Don't clear here — parent controls what happens next via errorMessage or unmount
    }
  }, [digits])

  function pressKey(key) {
    if (waiting) return       // ← ignore taps while processing
    if (key === '')   return
    if (key === '⌫') { setDigits(d => d.slice(0, -1)); return }
    if (digits.length >= 6) return
    setDigits(d => [...d, key])
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {/* Dot indicators */}
      <Animated.View style={[styles.dots, { transform:[{ translateX: shakeAnim }] }]}>
        {[0,1,2,3,4,5].map(i => (
          <View
            key={i}
            style={[styles.dot, digits.length > i && styles.dotFilled]}
          />
        ))}
      </Animated.View>

      {/* Error */}
      {errorMessage
        ? <Text style={styles.errorText}>{errorMessage}</Text>
        : <Text style={styles.errorText}> </Text>  // ← keeps layout stable
      }

      {/* Keypad */}
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key, ki) => (
            <TouchableOpacity
              key={ki}
              style={[
                styles.key,
                key === '' && styles.keyEmpty,
                waiting && key !== '' && styles.keyDisabled,
              ]}
              onPress={() => pressKey(key)}
              activeOpacity={key === '' ? 1 : 0.6}
              disabled={key === '' || waiting}
            >
              {key === '⌫'
                ? <Ionicons name="backspace-outline" size={24} color="#202020" />
                : <Text style={styles.keyText}>{key}</Text>
              }
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {showCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:   { flex:1, alignItems:'center', justifyContent:'center', backgroundColor:'#fff', padding:24 },
  title:       { fontSize:22, fontWeight:'700', color:'#202020', marginBottom:6 },
  subtitle:    { fontSize:14, color:'gray', marginBottom:24, textAlign:'center' },
  dots:        { flexDirection:'row', gap:16, marginBottom:8 },
  dot:         { width:16, height:16, borderRadius:8, borderWidth:2, borderColor:'#6366F1', backgroundColor:'transparent' },
  dotFilled:   { backgroundColor:'#6366F1' },
  errorText:   { color:'#ef4444', fontSize:13, marginBottom:12, height:18 },
  row:         { flexDirection:'row', marginVertical:6 },
  key:         { width:80, height:80, borderRadius:40, alignItems:'center', justifyContent:'center', backgroundColor:'#f3f4f6', marginHorizontal:10 },
  keyEmpty:    { backgroundColor:'transparent' },
  keyDisabled: { opacity: 0.4 },
  keyText:     { fontSize:26, fontWeight:'600', color:'#202020' },
  cancelBtn:   { marginTop:24 },
  cancelText:  { color:'#6366F1', fontSize:15 },
})