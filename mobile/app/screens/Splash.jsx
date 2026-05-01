import { StatusBar, StyleSheet, Text, View, Animated } from 'react-native'
import {React,  useEffect, useLayoutEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Title from '@/components/Title'


export default function SplashScreen() {

    // useLayoutEffect(() => {
    //     navigation.setOptions({
    //         headerShown: true
    //     })
    // },)

    const translateY = new Animated.Value(0)
    const duration = 800

        useEffect(() => {
            Animated.loop(
            Animated.sequence([
            Animated.timing(translateY,{
                toValue:200,
                duration:duration,
                useNativeDriver:true
            }),
            Animated.timing(translateY,{
                toValue:0,
                duration:duration,
                useNativeDriver:true
            })
            ])
        ).start()

        },)

  return (
    <SafeAreaView style={{flex:1,alignItems:'center',justifyContent:'center'}}>
      {/* <Text style={styles.head}>SplashScreen</Text> */}
      <StatusBar barStyle={'light-content'} />

      <Animated.View style={{transform:[{translateY}]}}>
        {/* <Text style={{color:'gray',textAlign:'center',fontSize:48,fontFamily:'Consolas'}} >
            RealTimeChat
        </Text> */}
        <Title text='RealTimeChat'  />
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
    head: {
    color:'white',
  },
})