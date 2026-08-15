import axios from 'axios'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const DJANGO_PORT = 8000
const YOUR_LAN_IP = process.env.EXPO_PUBLIC_API_URL

function getBaseURL() {
  if (Platform.OS === 'web') return `http://localhost:${DJANGO_PORT}`
  // Fallback if env var missing
  if (!YOUR_LAN_IP) {
    console.warn('[HandymanAPI] EXPO_PUBLIC_API_URL not set – falling back to http://10.0.2.2:8000')
    return 'http://10.0.2.2:8000'
  }
  return YOUR_LAN_IP
}

const handymanApi = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Attach token ────────────────────────────
handymanApi.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('handyman_access_token')
  if (token){
     config.headers.Authorization = `Bearer ${token}`
  }

  // ✅ DEBUG + FIX FormData
  if (config.data instanceof FormData) {
    console.log('[API] Detected FormData, preparing multipart...');
    delete config.headers['Content-Type']; // Let axios set it
    config.transformRequest = [(data) => data]; // Do not serialize
    console.log('[API] Request URL:', config.baseURL + config.url);
    console.log('[API] Request Data entries:', config.data._parts); // Log contents
  }
  
  return config
})

// ── Debug Response ────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

handymanApi.interceptors.response.use(
  res => {
    console.log('[HandymanAPI] Response Success:', res.status, res.config.url);
    return res;
  },
  async error => {
    const original = error.config

    const isAuthEndpoint = original?.url?.includes('/signin/') || original?.url?.includes('/signup/') || original?.url?.includes('/token/refresh/')

    if (error.response?.status === 401 && original && !original._retry && !isAuthEndpoint) {
      console.log('[HandymanAPI] 401 detected, attempting token refresh...')

      if (isRefreshing) {
        console.log('[HandymanAPI] Token refresh already in progress, queuing request')
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
        const refresh = await AsyncStorage.getItem('handyman_refresh_token')
        console.log('[HandymanAPI] Refresh token:', refresh ? 'present' : 'MISSING')

        if (!refresh) {
          throw new Error('No refresh token available')
        }

        console.log('[HandymanAPI] Attempting to refresh token...')
        const res = await axios.post(`${getBaseURL()}/users/token/refresh/`, { refresh })
        const newAccess = res.data.access
        console.log('[HandymanAPI] Token refresh successful')

        await AsyncStorage.setItem('handyman_access_token', newAccess)
        if (res.data.refresh) {
          await AsyncStorage.setItem('handyman_refresh_token', res.data.refresh)
        }
        processQueue(null, newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return handymanApi(original)
      } catch (e) {
        console.error('[HandymanAPI] Token refresh failed:', e.message)
        processQueue(e, null)
        await AsyncStorage.multiRemove([
          'handyman_access_token', 'handyman_refresh_token', 'handyman'
        ])
        if (typeof global.__forceHandymanLogout === 'function') {
          console.log('[HandymanAPI] Forcing handyman logout due to auth failure')
          global.__forceHandymanLogout()
        }
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }

    console.error('[API] Response Error:', error.message);
    if (error.response) {
      console.error('[API] Response Data:', error.response.data);
      console.error('[API] Response Status:', error.response.status);
    }
    return Promise.reject(error)
  }
)

export default handymanApi