
import { StyleSheet, Text } from 'react-native'
import React from 'react'

export default function Title({text,color}) {
  return (
     <Text style={{
        // color:color,
        textAlign:'center',
        fontSize:48,
        fontFamily:'Consolas',
        color:color,
        marginBottom:30,
      }}>
        {text}
      </Text>
  )
}

const styles = StyleSheet.create({})