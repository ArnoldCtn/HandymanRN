import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import useSettingsStore from '@/services/settingsStore';

export function useAppColorScheme() {
  const systemColorScheme = useColorScheme();
  const themePreference = useSettingsStore(s => s.theme);
  return themePreference === 'system' ? systemColorScheme : themePreference;
}

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useAppColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function useAppTheme() {
  const theme = useAppColorScheme() ?? 'light';
  return Colors[theme];
}
