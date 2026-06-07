import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ProgressBarProps {
  progress: number; // 0–100
  height?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  height = 6,
  color,
  backgroundColor,
  style,
}: ProgressBarProps) {
  const theme = useTheme();
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: backgroundColor ?? theme.border,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            height,
            backgroundColor: color ?? theme.primary,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
