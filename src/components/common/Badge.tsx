import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'muted';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'primary', size = 'sm', style }: BadgeProps) {
  const theme = useTheme();

  const colors: Record<BadgeVariant, { bg: string; text: string }> = {
    primary: { bg: theme.primaryLight, text: theme.primary },
    accent: { bg: theme.accentLight, text: theme.accent },
    success: { bg: '#D1FAE5', text: '#065F46' },
    warning: { bg: '#FEF3C7', text: '#92400E' },
    error: { bg: '#FEE2E2', text: '#991B1B' },
    muted: { bg: theme.border, text: theme.textMuted },
  };

  const c = colors[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          paddingHorizontal: size === 'sm' ? 8 : 12,
          paddingVertical: size === 'sm' ? 3 : 5,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: c.text, fontSize: size === 'sm' ? 11 : 13 }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
