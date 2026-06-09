import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from './useToast';

export const useSupportNotification = (isHandyman) => {
  const showToast = useToast();
  const ws = useRef(null);

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      try {
        const token = await AsyncStorage.getItem(isHandyman ? 'handyman_access_token' : 'access_token');
        const userStr = await AsyncStorage.getItem(isHandyman ? 'handyman' : 'user');
        if (!token || !userStr) return;

        const user = JSON.parse(userStr);
        const room = isHandyman ? `support_h_${user.id}` : `support_${user.id}`;

        const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
        const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
        const wsHost = baseUrl.replace(/^https?:\/\//, '').split('/')[0];
        
        if (!wsHost) {
          console.log('[SupportNotif] No host found for WS');
          return;
        }

        const wsUrl = `${wsProtocol}://${wsHost}/ws/support/${room}/?token=${token}`;
        
        console.log('[SupportNotif] Connecting to:', wsUrl);
        ws.current = new WebSocket(wsUrl);

        ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const msg = data.message;
          
          // Only show toast if it's from admin
          if (msg.is_from_admin && mounted) {
            showToast(`Support: ${msg.message}`, 'success');
          }
        };

        ws.current.onerror = (e) => {
          console.log('[SupportNotif] WS Error:', e.message);
        };

        ws.current.onclose = (e) => {
          console.log('[SupportNotif] WS Closed:', e.reason);
        };
      } catch (err) {
        console.log('[SupportNotif] Connection error:', err);
      }
    };

    connect();

    return () => {
      mounted = false;
      if (ws.current) ws.current.close();
    };
  }, [isHandyman]);
};
