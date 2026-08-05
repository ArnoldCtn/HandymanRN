import { StatusBar, StyleSheet, Text, View, Animated } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Title from '@/components/Title'


export default function SplashScreen() {
  const translateY = new Animated.Value(0)
  const duration = 800

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: 200,
          duration: duration,
          useNativeDriver: true
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration,
          useNativeDriver: true
        })
      ])
    ).start()
  }, [])

  return (
    <SafeAreaView style={{flex:1,alignItems:'center',justifyContent:'center'}}>
      <StatusBar barStyle={'light-content'} />
      <Animated.View style={{transform:[{translateY}]}}>
        <Title text='RealTimeChat' />
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    head: {
    color:'white',
  },
})