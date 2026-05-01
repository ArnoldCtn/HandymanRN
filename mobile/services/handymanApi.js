import axios from 'axios'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const DJANGO_PORT = 8000
const YOUR_LAN_IP = process.env.EXPO_PUBLIC_API_URL

function getBaseURL() {
  if (Platform.OS === 'web') return `http://localhost:${DJANGO_PORT}`
  return YOUR_LAN_IP
}

const handymanApi = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Attach token ────────────────────────────
handymanApi.interceptors.request.use(async config => {
  // Use the same keys that SignIn.jsx uses
  const token = await AsyncStorage.getItem('handyman_access_token')
  console.log('[API] Token from storage:', token ? 'present' : 'MISSING');
  if (token){
     config.headers.Authorization = `Bearer ${token}`
  }
  // 2. ✅ KEY FIX — if data is FormData, delete the JSON Content-Type
  //    so axios auto-sets multipart/form-data with the correct boundary
  if (config.data instanceof FormData) {
    console.log('[API] Detected FormData, setting up for multipart');
    delete config.headers['Content-Type']
    // On Android, axios needs this to not re-serialize FormData
    // config.transformRequest = [(data) => data]
     if (Platform.OS !== 'web') {
      config.transformRequest = [(data) => data]
    }
  }
  console.log('[API] Request config:', {
    url: config.url,
    method: config.method,
    hasAuth: !!config.headers.Authorization,
    dataType: config.data?.constructor?.name
  });
  return config
})

// ── Auto-refresh handyman token ──────────────────────
let isRefreshing = false
let failedQueue  = []

function processQueue(error, token = null) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

handymanApi.interceptors.response.use(
  res => {
    console.log('[API] Response:', res.status, res.config.url);
    return res;
  },
  async error => {
    console.log('[API] Error:', error.code, error.message);
    console.log('[API] Error config:', error.config?.url);
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return handymanApi(original)
        })
      }
      original._retry = true
      isRefreshing    = true
      try {
        // Use the same keys that SignIn.jsx uses
        const refresh = await AsyncStorage.getItem('handyman_refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const res = await axios.post(`${getBaseURL()}/handymen/token/refresh/`, { refresh })
        const newAccess = res.data.access
        await AsyncStorage.setItem('handyman_access_token', newAccess)
        if (res.data.refresh) {
          await AsyncStorage.setItem('handyman_refresh_token', res.data.refresh)
        }
        processQueue(null, newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return handymanApi(original)
      } catch (e) {
        processQueue(e, null)
        await AsyncStorage.multiRemove([
          'handyman_access_token', 'handyman_refresh_token', 'handyman'
        ])
        if (typeof global.__forceHandymanLogout === 'function') {
          global.__forceHandymanLogout()
        }
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default handymanApi