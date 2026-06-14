
import { StyleSheet, Text } from 'react-native'
import React from 'react'
import { useAppTheme } from '@/hooks/use-theme-color'

export default function Title({ text, color }) {
  const theme = useAppTheme();

  return (
    <Text style={{
      textAlign: 'center',
      fontSize: 48,
      fontFamily: 'Consolas',
      color: color || theme.text,
      marginBottom: 30,
    }}>
      {text}
    </Text>
  )
}

const styles = StyleSheet.create({})