import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
// import Constants from 'expo-constants';
// import AsyncStorage from '@react-native-async-storage/async-storage'


// ─── CONFIG ──────────────────────────────────────────────
const DJANGO_PORT = 8000;
const YOUR_LAN_IP = process.env.EXPO_PUBLIC_API_URL; // <-- Replace with your PC's IPv4 from Step 1
// ─────────────────────────────────────────────────────────

function getBaseURL() {
  if (Platform.OS === 'web') return `http://localhost:${DJANGO_PORT}`
  return YOUR_LAN_IP
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('access_token')
  console.log('[User API] Token from storage:', token ? 'present' : 'MISSING');
  if (token) {
    config.headers.Authorization = `Bearer ${token}` 
  }

  // ✅ Same FormData fix for client api
  if (config.data instanceof FormData) {
    console.log('[User API] Detected FormData, setting up for multipart');
    // For Android, completely remove Content-Type and let axios set it
    delete config.headers['Content-Type']
    // Also remove transformRequest if it exists
    delete config.transformRequest
  }

  console.log('[User API] Request config:', {
    url: config.url,
    method: config.method,
    hasAuth: !!config.headers.Authorization,
    baseURL: config.baseURL,
    dataType: config.data?.constructor?.name
  });

  return config
})

// ── Auto-refresh user token ──────────────────────
let isRefreshing = false
let failedQueue  = []

function processQueue(error, token = null) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  res => {
    console.log('[User API] Response:', res.status, res.config.url);
    return res;
  },
  async error => {
    console.log('[User API] Error:', error.code, error.message);
    console.log('[User API] Error config:', error.config?.url);
    const original = error.config
    // Don't try to refresh if we're on a sign-in endpoint
    const isSignIn = original.url.includes('/signin/') || original.url.includes('/signup/')
    
    if (error.response?.status === 401 && !original._retry && !isSignIn) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing    = true
      try {
        const refresh = await AsyncStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const res = await axios.post(`${getBaseURL()}/users/token/refresh/`, { refresh })
        const newAccess = res.data.access
        await AsyncStorage.setItem('access_token', newAccess)
        if (res.data.refresh) {
          await AsyncStorage.setItem('refresh_token', res.data.refresh)
        }
        processQueue(null, newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch (e) {
        processQueue(e, null)
        await AsyncStorage.multiRemove([
          'access_token', 'refresh_token', 'user'
        ])
        if (typeof global.__forceUserLogout === 'function') {
          global.__forceUserLogout()
        }
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

// Optional: log which URL is being used (helps debugging)
console.log('[API] baseURL:', getBaseURL());

export default api;