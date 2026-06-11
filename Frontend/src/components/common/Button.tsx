import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const theme = useTheme();

  const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
    primary: { bg: theme.primary, text: '#FFFFFF' },
    secondary: {
      bg: theme.primaryLight,
      text: theme.primary,
    },
    ghost: { bg: 'transparent', text: theme.text, border: theme.border },
    danger: { bg: '#EF4444', text: '#FFFFFF' },
    accent: { bg: theme.accent, text: '#1A1D2E' },
  };

  const sizeStyles: Record<Size, { paddingH: number; paddingV: number; fontSize: number; radius: number }> = {
    sm: { paddingH: 14, paddingV: 8, fontSize: 13, radius: 10 },
    md: { paddingH: 20, paddingV: 13, fontSize: 15, radius: 14 },
    lg: { paddingH: 28, paddingV: 16, fontSize: 17, radius: 16 },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
          borderRadius: s.radius,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[
              styles.label,
              { color: v.text, fontSize: s.fontSize },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  iconLeft: { marginRight: 2 },
  iconRight: { marginLeft: 2 },
});
