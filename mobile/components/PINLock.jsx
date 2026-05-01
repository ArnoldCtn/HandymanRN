// components/PINLock.jsx
import { useState } from 'react'
import { View } from 'react-native'
import { PIN } from '@/services/pin'   // default fallback
import PINPad from '@/components/PINPad'

const MAX_ATTEMPTS = 5

export default function PINLockScreen({
  onUnlock,
  title       = 'App Locked',
  subtitle    = 'Enter your 6-digit PIN to continue',
  pinService  = PIN,    // ← accepts any PIN instance
}) {
  const [attempts, setAttempts] = useState(0)
  const [error,    setError]    = useState('')
  const [locked,   setLocked]   = useState(false)
  const [pinKey,   setPinKey]   = useState(0)

  async function handlePIN(entered) {
    if (locked) return
    const ok = await pinService.verify(entered)   // ← uses injected service
    if (ok) {
      setError('')
      onUnlock?.()
    } else {
      const next = attempts + 1
      setAttempts(next)
      setPinKey(k => k + 1)
      if (next >= MAX_ATTEMPTS) {
        setLocked(true)
        setError('Too many attempts. Wait 30 seconds.')
        setTimeout(() => {
          setLocked(false); setAttempts(0)
          setError(''); setPinKey(k => k + 1)
        }, 30000)
      } else {
        setError(`Wrong PIN. ${MAX_ATTEMPTS - next} attempt(s) left.`)
      }
    }
  }

  return (
    <PINPad
      key={pinKey}
      title={title}
      subtitle={subtitle}
      onComplete={handlePIN}
      errorMessage={error}
    />
  )
}