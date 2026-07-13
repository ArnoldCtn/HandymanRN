import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// ─── CONFIG ──────────────────────────────────────────────
const DJANGO_PORT = 8000;
const YOUR_LAN_IP = process.env.EXPO_PUBLIC_API_URL; 
// ─────────────────────────────────────────────────────────

function getBaseURL() {
  if (Platform.OS === 'web') return `http://localhost:${DJANGO_PORT}`
  // Fallback to a default localhost address for development if env var is missing
  if (!YOUR_LAN_IP) {
    console.warn('[API] EXPO_PUBLIC_API_URL not set – falling back to http://10.0.2.2:8000')
    return 'http://10.0.2.2:8000'
  }
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

  // ✅ IMPROVED FormData handling
  if (config.data instanceof FormData) {
    console.log('[User API] Detected FormData, setting up for multipart');
    // Remove default Content-Type so axios can set it with the correct boundary
    delete config.headers['Content-Type'];
    // This is the crucial fix for React Native FormData
    config.transformRequest = [(data) => data];
  }

  console.log('[User API] Request config:', {
    url: config.url,
    method: config.method,
    hasAuth: !!config.headers.Authorization,
    baseURL: config.baseURL,
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
    return res;
  },
  async error => {
    const original = error.config
    // Don't try to refresh if we're on a sign-in endpoint
    const isSignIn = original.url.includes('/signin/') || original.url.includes('/signup/')
    
    if (error.response?.status === 401 && !original._retry && !isSignIn) {
      console.log('[User API] 401 detected, attempting token refresh...')
      
      if (isRefreshing) {
        console.log('[User API] Token refresh already in progress, queuing request')
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
        console.log('[User API] Refresh token:', refresh ? 'present' : 'MISSING')
        
        if (!refresh) {
          throw new Error('No refresh token available')
        }
        
        console.log('[User API] Attempting to refresh token...')
        const res = await axios.post(`${getBaseURL()}/users/token/refresh/`, { refresh })
        const newAccess = res.data.access
        console.log('[User API] Token refresh successful')
        
        await AsyncStorage.setItem('access_token', newAccess)
        if (res.data.refresh) {
          await AsyncStorage.setItem('refresh_token', res.data.refresh)
        }
        processQueue(null, newAccess)
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      } catch (e) {
        console.error('[User API] Token refresh failed:', e.message)
        processQueue(e, null)
        await AsyncStorage.multiRemove([
          'access_token', 'refresh_token', 'user'
        ])
        if (typeof global.__forceUserLogout === 'function') {
          console.log('[User API] Forcing logout due to auth failure')
          global.__forceUserLogout()
        }
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    
    // Log other errors with more detail
    if (error.response) {
      console.error(`[User API] Error ${error.response.status}:`, error.response.data)
    } else if (error.request) {
      console.error('[User API] No response received:', error.request)
    } else {
      console.error('[User API] Request setup error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default api;