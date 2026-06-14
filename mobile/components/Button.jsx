import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useAppTheme } from '@/hooks/use-theme-color'

export default function Button({ title, onPress }) {
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      style={{
        backgroundColor: theme.primary,
        height: 50,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20
      }}
      onPress={onPress}
    >
      <Text style={{ color: 'white', fontSize: 16, fontWeight: '900' }}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({})