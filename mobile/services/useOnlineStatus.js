// services/useOnlineStatus.js
import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '@/services/api'

async function callStatus(endpoint) {
    try {
        const token = await AsyncStorage.getItem('access_token')
        if (!token) return    // ← don't call if already logged out
        await api.post(endpoint, {}, {
            headers: { Authorization: `Bearer ${token}` }
        })
    } catch (e) {
        console.log('[Status]', endpoint, e.message)
    }
}

export default function useOnlineStatus(isAuthenticated) {
    const appState   = useRef(AppState.currentState)
    const isMounted  = useRef(false)

    useEffect(() => {
        if (!isAuthenticated) return

        isMounted.current = true
        callStatus('/users/me/online/')

        const sub = AppState.addEventListener('change', next => {
            if (appState.current.match(/inactive|background/) && next === 'active') {
                callStatus('/users/me/online/')
            } else if (appState.current === 'active' && next.match(/inactive|background/)) {
                callStatus('/users/me/offline/')
            }
            appState.current = next
        })

        return () => {
            isMounted.current = false
            sub.remove()
            // Don't call offline here — logout() handles it
        }
    }, [isAuthenticated])
}