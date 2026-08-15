import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Token helpers for WebSocket connections ────────────────────────
// WebSockets don't go through the axios 401-refresh interceptor, so the
// stored access token can be expired when we try to connect. This helper
// returns a non-expired access token, refreshing it if necessary.

function getBaseURL() {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) return 'http://10.0.2.2:8000';
  return url;
}

function tokenKeys(isHandyman) {
  return isHandyman
    ? { access: 'handyman_access_token', refresh: 'handyman_refresh_token' }
    : { access: 'access_token', refresh: 'refresh_token' };
}

function decodePayload(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function isExpired(token, skewSeconds = 30) {
  const payload = decodePayload(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

export const getValidAccessToken = async (isHandyman = false) => {
  const keys = tokenKeys(isHandyman);

  try {
    const access = await AsyncStorage.getItem(keys.access);
    if (access && !isExpired(access)) return access;

    const refresh = await AsyncStorage.getItem(keys.refresh);
    if (!refresh) return null;

    const res = await fetch(`${getBaseURL()}/users/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.access) return null;

    await AsyncStorage.setItem(keys.access, data.access);
    if (data.refresh) {
      await AsyncStorage.setItem(keys.refresh, data.refresh);
    }
    return data.access;
  } catch {
    return null;
  }
};

export const isWsAuthFailure = (event) => {
  if (event && typeof event === 'object') {
    if (event.code === 1006) return true;
    if (typeof event.reason === 'string' && /403|access denied|forbidden|unauthorized/i.test(event.reason)) return true;
  }
  return false;
};
