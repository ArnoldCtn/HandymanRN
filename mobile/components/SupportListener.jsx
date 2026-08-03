import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSupportNotification } from '../hooks/useSupportNotification';

export const SupportListener = () => {
  const [isHandyman, setIsHandyman] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const handymanToken = await AsyncStorage.getItem('handyman_access_token');
        setIsHandyman(!!handymanToken);
      } catch (e) {
        console.error('[SupportListener] Error:', e);
      }
    };
    checkRole();
  }, []);

  try {
    useSupportNotification(isHandyman);
  } catch (e) {
    console.error('[SupportListener] WS error:', e);
  }

  return null;
};