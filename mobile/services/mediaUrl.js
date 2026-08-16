import { Platform } from 'react-native';

const DJANGO_PORT = 8000;

export function getApiBaseURL() {
  if (Platform.OS === 'web') return `http://localhost:${DJANGO_PORT}`;
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    console.warn('[MediaURL] EXPO_PUBLIC_API_URL not set - falling back to http://10.0.2.2:8000');
    return 'http://10.0.2.2:8000';
  }
  return url.replace(/\/+$/, '');
}

export function resolveMediaUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = getApiBaseURL();
  const separator = pathOrUrl.startsWith('/') ? '' : '/';
  return `${base}${separator}${pathOrUrl}`;
}
