import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

export default function Button({title,onPress}){
  return (
    <TouchableOpacity style={{backgroundColor:'#202020',
      height:50, borderRadius:26, alignItems:'center', justifyContent:'center', marginVertical:20
    }} onPress={onPress}>
      <Text style={{ color:'white', fontSize:16, fontWeight:'black'}}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({})