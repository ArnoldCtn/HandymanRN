import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from './useToast';
import { getValidAccessToken, isWsAuthFailure } from '../services/wsAuth';

export const useSupportNotification = (isHandyman) => {
  const showToast = useToast();
  const ws = useRef(null);
  const isHandymanBool = Boolean(isHandyman); // ✅ Guard primitive boolean

  useEffect(() => {

    if (isHandyman === null) return;

    let mounted = true;
    let retryCount = 0;
    let retryTimer = null;
    const MAX_RETRIES = 2;

    const connect = async () => {
      try {
        const userKey = isHandymanBool ? 'handyman' : 'user';

        const token = await getValidAccessToken(isHandymanBool);
        const userStr = await AsyncStorage.getItem(userKey);
        if (!token || !userStr || !mounted) return;

        const user = JSON.parse(userStr);
        const userId = user?.id || user?.pk;
        if (!userId) return;

        const room = isHandymanBool ? `support_h_${userId}` : `support_${userId}`;
        const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
        const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
        const wsHost = baseUrl.replace(/^https?:\/\//, '').split('/')[0];

        if (!wsHost) return;

        const wsUrl = `${wsProtocol}://${wsHost}/ws/support/${room}/?token=${token}`;

        // Close existing connection before creating a new one
        if (ws.current) {
          ws.current.close();
        }

        console.log('[SupportNotif] Connecting to:', wsUrl);
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onmessage = (event) => {
          if (!mounted) return;
          try {
            const data = JSON.parse(event.data);
            const msg = data?.message;
            if (msg?.is_from_admin) {
              showToast(`Support: ${msg.message}`, 'success');
            }
          } catch (err) {
            console.log('[SupportNotif] Message parse error:', err);
          }
        };

        socket.onerror = (e) => {
          console.log('[SupportNotif] WS Error:', e.message);
        };

        socket.onopen = () => {
          retryCount = 0;
        };

        socket.onclose = (e) => {
          console.log('[SupportNotif] WS Closed:', e.reason);
          if (!mounted) return;
          if (isWsAuthFailure(e) && retryCount < MAX_RETRIES) {
            retryCount += 1;
            console.log(`[SupportNotif] Retrying in ${retryCount * 2}s (${retryCount}/${MAX_RETRIES})`);
            retryTimer = setTimeout(() => {
              if (mounted) connect();
            }, retryCount * 2000);
          }
        };
      } catch (err) {
        console.log('[SupportNotif] Connection error:', err);
      }
    };

    connect();

    return () => {
      mounted = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [isHandymanBool]); // ✅ Stable boolean dependency
};
