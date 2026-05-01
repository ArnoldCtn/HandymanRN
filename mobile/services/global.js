
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


// import { create } from 'zustand';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const useGlobal = create((set, get) => ({
//   authenticated: false,
//   user: {},

//   // Load persisted state when app starts
//   initializeAuth: async () => {
//     try {
//       const storedUser = await AsyncStorage.getItem('user');
//       if (storedUser) {
//         const parsedUser = JSON.parse(storedUser);
//         set({ authenticated: true, user: parsedUser });
//       }
//     } catch (e) {
//       console.log('Failed to load auth from storage:', e);
//     }
//   },

//   login: (userData) => {
//     set({ authenticated: true, user: userData });
//   },

//   logout: async () => {
//     try {
//       await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
//     } catch (e) {
//       console.log('Failed to clear storage:', e);
//     }
//     set({ authenticated: false, user: {} });
//   },
// }));

// export default useGlobal;


// import { create } from 'zustand'

// const useGlobal = create((set) => ({
    
//     // AUthenetication

//     authenticated:false,
//     user:{},

//     login:(user) => {
//         set((state) => ({
//             authenticated:true,
//             user:user
//         }))
//     },

//     logout: () => {
//         set((state) => ({
//             authenticated:false,
//             user:{}
//         }))
//     }

    
// }))


// export default useGlobal