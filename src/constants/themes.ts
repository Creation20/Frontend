export type ThemeKey =
  | 'default'
  | 'dark'
  | 'cream'
  | 'highContrast'
  | 'blueOverlay'
  | 'night';

export interface Theme {
  key: ThemeKey;
  label: string;
  icon: string; // Now used for MaterialCommunityIcons names
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  accent: string;
  accentLight: string;
  highlight: string;
  highlightText: string;
  chunkBorder: string;
  focusRuler: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  card: string;
  shadow: string;
  success: string;
  warning: string;
  error: string;
  overlay: string;
}

export const THEMES: Record<ThemeKey, Theme> = {
  default: {
    key: 'default',
    label: 'Default',
    icon: 'white-balance-sunny',
    background: '#F8F9FE',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E8EBF5',
    text: '#1A1D2E',
    textSecondary: '#4A5068',
    textMuted: '#9BA3BF',
    primary: '#0B6E6E',
    primaryLight: '#E6F4F4',
    accent: '#F59E0B',
    accentLight: '#FEF3C7',
    highlight: '#F59E0B',
    highlightText: '#1A1D2E',
    chunkBorder: '#D1FAE5',
    focusRuler: 'rgba(11, 110, 110, 0.12)',
    tabBar: '#FFFFFF',
    tabBarActive: '#0B6E6E',
    tabBarInactive: '#9BA3BF',
    card: '#FFFFFF',
    shadow: 'rgba(26, 29, 46, 0.08)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    overlay: 'rgba(26, 29, 46, 0.6)',
  },
  dark: {
    key: 'dark',
    label: 'Dark',
    icon: 'moon-waning-crescent',
    background: '#0F1117',
    surface: '#1A1D2E',
    surfaceElevated: '#242736',
    border: '#2E3148',
    text: '#E8EBF5',
    textSecondary: '#9BA3BF',
    textMuted: '#5A6080',
    primary: '#14A3A3',
    primaryLight: '#0B2E2E',
    accent: '#F59E0B',
    accentLight: '#3D2E00',
    highlight: '#F59E0B',
    highlightText: '#0F1117',
    chunkBorder: '#1A3A2E',
    focusRuler: 'rgba(20, 163, 163, 0.15)',
    tabBar: '#1A1D2E',
    tabBarActive: '#14A3A3',
    tabBarInactive: '#5A6080',
    card: '#1A1D2E',
    shadow: 'rgba(0, 0, 0, 0.4)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
  cream: {
    key: 'cream',
    label: 'Cream',
    icon: 'coffee',
    background: '#FBF6EE',
    surface: '#FFFDF8',
    surfaceElevated: '#FFFDF8',
    border: '#E8DEC8',
    text: '#2C1810',
    textSecondary: '#6B4F3A',
    textMuted: '#A08060',
    primary: '#8B5E3C',
    primaryLight: '#F0E6D8',
    accent: '#D97706',
    accentLight: '#FEF3C7',
    highlight: '#FBBF24',
    highlightText: '#2C1810',
    chunkBorder: '#DDE8C0',
    focusRuler: 'rgba(139, 94, 60, 0.12)',
    tabBar: '#FFFDF8',
    tabBarActive: '#8B5E3C',
    tabBarInactive: '#A08060',
    card: '#FFFDF8',
    shadow: 'rgba(44, 24, 16, 0.08)',
    success: '#65A30D',
    warning: '#D97706',
    error: '#DC2626',
    overlay: 'rgba(44, 24, 16, 0.6)',
  },
  highContrast: {
    key: 'highContrast',
    label: 'High Contrast',
    icon: 'contrast-box',
    background: '#000000',
    surface: '#000000',
    surfaceElevated: '#111111',
    border: '#FFFFFF',
    text: '#FFFFFF',
    textSecondary: '#EEEEEE',
    textMuted: '#BBBBBB',
    primary: '#FFFF00',
    primaryLight: '#333300',
    accent: '#00FFFF',
    accentLight: '#003333',
    highlight: '#FFFF00',
    highlightText: '#000000',
    chunkBorder: '#00FF00',
    focusRuler: 'rgba(255, 255, 0, 0.2)',
    tabBar: '#000000',
    tabBarActive: '#FFFF00',
    tabBarInactive: '#777777',
    card: '#111111',
    shadow: 'rgba(255, 255, 255, 0.1)',
    success: '#00FF00',
    warning: '#FFFF00',
    error: '#FF0000',
    overlay: 'rgba(0, 0, 0, 0.9)',
  },
  blueOverlay: {
    key: 'blueOverlay',
    label: 'Blue Tint',
    icon: 'water',
    background: '#EEF4FF',
    surface: '#F5F8FF',
    surfaceElevated: '#FFFFFF',
    border: '#C5D5F0',
    text: '#1A2A4A',
    textSecondary: '#3A5080',
    textMuted: '#8A9DC0',
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    accent: '#7C3AED',
    accentLight: '#EDE9FE',
    highlight: '#93C5FD',
    highlightText: '#1A2A4A',
    chunkBorder: '#BFDBFE',
    focusRuler: 'rgba(37, 99, 235, 0.12)',
    tabBar: '#F5F8FF',
    tabBarActive: '#2563EB',
    tabBarInactive: '#8A9DC0',
    card: '#FFFFFF',
    shadow: 'rgba(26, 42, 74, 0.1)',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    overlay: 'rgba(26, 42, 74, 0.6)',
  },
  night: {
    key: 'night',
    label: 'Night',
    icon: 'weather-night',
    background: '#0A0E1A',
    surface: '#131728',
    surfaceElevated: '#1C2135',
    border: '#252B44',
    text: '#D4C9FF',
    textSecondary: '#9B8FCC',
    textMuted: '#4A4570',
    primary: '#8B5CF6',
    primaryLight: '#1E1040',
    accent: '#EC4899',
    accentLight: '#3D0020',
    highlight: '#8B5CF6',
    highlightText: '#FFFFFF',
    chunkBorder: '#1E3040',
    focusRuler: 'rgba(139, 92, 246, 0.15)',
    tabBar: '#131728',
    tabBarActive: '#8B5CF6',
    tabBarInactive: '#4A4570',
    card: '#131728',
    shadow: 'rgba(0, 0, 0, 0.5)',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },
};

export const THEME_KEYS: ThemeKey[] = [
  'default',
  'dark',
  'cream',
  'highContrast',
  'blueOverlay',
  'night',
];
