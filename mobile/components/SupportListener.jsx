import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSupportNotification } from '../hooks/useSupportNotification';

export const SupportListener = () => {
  // Start as null so we don't prematurely attempt a client connection
  const [isHandyman, setIsHandyman] = useState(null);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      try {
        const handymanToken = await AsyncStorage.getItem('handyman_access_token');
        if (mounted) {
          setIsHandyman(!!handymanToken);
        }
      } catch (e) {
        console.error('[SupportListener] Error checking role:', e);
        if (mounted) {
          setIsHandyman(false);
        }
      }
    };

    checkRole();

    return () => {
      mounted = false;
    };
  }, []);

  // Hook will automatically skip connection while isHandyman is null
  useSupportNotification(isHandyman);

  return null;
};