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
handymanApi.interceptors.response.use(
  res => {
    console.log('[API] Response Success:', res.status, res.config.url);
    return res;
  },
  async error => {
    console.error('[API] Response Error:', error.message);
    if (error.response) {
      console.error('[API] Response Data:', error.response.data);
      console.error('[API] Response Status:', error.response.status);
    }
    return Promise.reject(error)
  }
)

export default handymanApi