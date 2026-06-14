import React, { useRef, useEffect } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

export default function PulseView({ children, style }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[style, { opacity: fadeAnim }]}>
      {children}
    </Animated.View>
  );
}
