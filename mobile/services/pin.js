// services/pin.js
import AsyncStorage from '@react-native-async-storage/async-storage'

function hashPIN(pin) {
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    hash = ((hash << 5) - hash) + pin.charCodeAt(i)
    hash |= 0
  }
  return String(hash)
}

// ── Factory — returns a PIN manager for a given namespace ──
function createPIN(namespace) {
  const KEY_HASH    = `${namespace}_pin_hash`
  const KEY_ENABLED = `${namespace}_pin_enabled`

  return {
    async isEnabled() {
      const val = await AsyncStorage.getItem(KEY_ENABLED)
      return val === 'true'
    },
    async set(pin) {
      await AsyncStorage.setItem(KEY_HASH,    hashPIN(pin))
      await AsyncStorage.setItem(KEY_ENABLED, 'true')
    },
    async verify(pin) {
      const stored = await AsyncStorage.getItem(KEY_HASH)
      return stored === hashPIN(pin)
    },
    async disable() {
      await AsyncStorage.multiRemove([KEY_HASH, KEY_ENABLED])
    },
    async isSet() {
      const hash = await AsyncStorage.getItem(KEY_HASH)
      return !!hash
    }
  }
}

// ── Two separate PIN instances — never clash ──────────────
export const PIN         = createPIN('client')    // client uses client_pin_*
export const HANDYMAN_PIN = createPIN('handyman') // handyman uses handyman_pin_*