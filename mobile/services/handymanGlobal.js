import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import handymanApi from './handymanApi'

const useHandymanGlobal = create((set) => ({

  initialized:   false,
  authenticated: false,
  handyman:      {},

  init: async () => {
    try {
      const token      = await AsyncStorage.getItem('handyman_access_token')
      const str        = await AsyncStorage.getItem('handyman')
      const handyman   = str ? JSON.parse(str) : {}
      if (token) {
        set({ initialized:true, authenticated:true, handyman })
      } else {
        set({ initialized:true, authenticated:false, handyman:{} })
      }
    } catch (e) {
      set({ initialized:true, authenticated:false, handyman:{} })
    }
  },

  login: (handyman) => set({ authenticated:true, handyman }),

  updateHandyman: (data) => set({ handyman: data }),

  logout: async () => {
    try {
      const token = await AsyncStorage.getItem('handyman_access_token')
      if (token) {
        await handymanApi.post('/handymen/me/offline/', {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
    } catch (e) {
      console.log('[HandymanLogout] offline error:', e.message)
    }
    try {
      await AsyncStorage.multiRemove([
        'handyman_access_token', 'handyman_refresh_token', 'handyman'
      ])
    } catch (e) {}
    set({ authenticated:false, handyman:{} })
  }
}))

export default useHandymanGlobal