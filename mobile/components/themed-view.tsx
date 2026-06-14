import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'background' | 'surface' | 'card' | 'border';
};

export function ThemedView({ style, lightColor, darkColor, type = 'background', ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, type);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
