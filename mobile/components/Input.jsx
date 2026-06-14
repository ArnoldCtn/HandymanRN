import { StyleSheet, Text, View, TextInput } from 'react-native'
import React from 'react'
import { useAppTheme } from '@/hooks/use-theme-color'

export default function Input({ 
  title, value, setValue, error, setError, 
  secureTextEntry, keyboardType, maxLength,
  multiline, numberOfLines, ...props 
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={{ color: theme.primary, marginVertical: 6, paddingLeft: 16, fontWeight: '600' }}>
        {title}</Text>
      <TextInput
        style={{
          backgroundColor: theme.card,
          color: theme.text,
          borderRadius: multiline ? 16 : 26,
          height: multiline ? (numberOfLines ? numberOfLines * 24 + 20 : 100) : 56,
          paddingHorizontal: 16,
          paddingTop: multiline ? 12 : 0,
          fontSize: 16,
          borderColor: error ? theme.error : theme.border,
          borderWidth: 1.5,
          textAlignVertical: multiline ? 'top' : 'center'
        }}
        autoCapitalize='none'
        autoComplete='off'
        value={value}
        allowFontScaling={false}
        maxLength={maxLength}
        keyboardType={keyboardType}
        placeholderTextColor={theme.textSecondary}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onChangeText={text => {
          setValue(text)
          if (error) {
            setError('')
          }
        }}
        secureTextEntry={secureTextEntry}
        {...props}
      />
      {error ? (
        <Text style={{ color: theme.error, marginVertical: 6, paddingLeft: 16, fontSize: 12 }}>
          {error}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 5,
  }
})