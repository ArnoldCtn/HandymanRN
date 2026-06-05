
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '@/services/api' 

const useGlobal = create((set) => ({

    // ── State ─────────────────────────────────
    initialized: false,
    authenticated: false,
    user: {},

    // ── Called once on app start ──────────────
    init: async () => {
        try {
            const token = await AsyncStorage.getItem('access_token')
            const userStr = await AsyncStorage.getItem('user')
            const user = userStr ? JSON.parse(userStr) : {}

            if (token) {
                set({ initialized: true, authenticated: true, user })
            } else {
                set({ initialized: true, authenticated: false, user: {} })
            }
        } catch (e) {
            console.log('[Global] Init error:', e.message)
            set({ initialized: true, authenticated: false, user: {} })
        }
    },

    // ── Called after successful login/signup ──
    login: (user) => {
        set({ authenticated: true, user })
    },

    // Update user
    updateUser: (updatedUser) => {
    set({ user: updatedUser })
    },

    // ── Called on logout — clears everything ──
   logout: async () => {
    // ── 1. Call offline BEFORE clearing token ──
    try {
        const token = await AsyncStorage.getItem('access_token')
        if (token) {
            await api.post('/users/me/offline/', {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
        }
    } catch (e) {
        console.log('[Logout] offline error:', e.message)
    }

    // ── 2. Now clear storage + state ──
    try {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user'])
    } catch (e) {
        console.log('[Logout] storage clear error:', e.message)
    }

    set({ authenticated: false, user: {} })
},

}))

export default useGlobal

