import { Platform } from 'react-native';

const tintColorLight = '#6366F1';
const tintColorDark = '#818cf8';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#6b7280',
    background: '#f9fafb',
    surface: '#ffffff',
    card: '#ffffff',
    border: '#f0f0f0',
    primary: '#6366F1',
    accent: '#f59e0b',
    error: '#ef4444',
    success: '#10b981',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    shadow: '#000000',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9ca3af',
    background: '#0f172a',
    surface: '#1e293b',
    card: '#1e293b',
    border: '#334155',
    primary: '#818cf8',
    accent: '#fbbf24',
    error: '#f87171',
    success: '#34d399',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    shadow: '#000000',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
