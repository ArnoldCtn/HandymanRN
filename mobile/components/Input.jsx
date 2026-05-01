import { StyleSheet, Text, View,TextInput } from 'react-native'
import React from 'react'

export default function Input({title,value,setValue,error,setError,secureTextEntry,keyboardType,maxLength}){
  return (
    <View>
      <Text style={{color:'blue', marginVertical:6,paddingLeft:16}}>
        {title}</Text>
      <TextInput
      style={{backgroundColor:'#e1e2e4',borderRadius:26, height:56,
        paddingHorizontal:16, fontSize:16,
        borderColor:error ? '#ff5555' : 'transparent',
        borderWidth:2 
      }} 
      autoCapitalize='none'
      autoComplete='off'
      value={value}
      allowFontScaling={false}
      maxLength={maxLength}
      keyboardType={keyboardType}
      onChangeText={text => {setValue(text) 
      if(error){
        setError('')
      } 
      }}
      secureTextEntry={secureTextEntry}/>
      <Text style={{color:'red', marginVertical:6,paddingLeft:16}}>
        {error}</Text>
    </View>
  )
}

const styles = StyleSheet.create({})