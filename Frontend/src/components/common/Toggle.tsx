import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ToggleProps {
  value: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export function Toggle({ value, onToggle, disabled = false, style, size = 'md' }: ToggleProps) {
  const theme = useTheme();
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;

  const trackW = size === 'sm' ? 40 : 50;
  const trackH = size === 'sm' ? 22 : 28;
  const thumbSize = size === 'sm' ? 16 : 22;
  const thumbOffset = size === 'sm' ? 3 : 3;
  const thumbTravel = trackW - thumbSize - thumbOffset * 2;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  }, [value, translateX]);

  const translateXInterpolated = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [thumbOffset, thumbOffset + thumbTravel],
  });

  return (
    <TouchableOpacity
      onPress={() => onToggle(!value)}
      disabled={disabled}
      activeOpacity={0.85}
      style={style}
    >
      <View
        style={[
          styles.track,
          {
            width: trackW,
            height: trackH,
            borderRadius: trackH / 2,
            backgroundColor: value ? theme.primary : theme.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              top: thumbOffset,
              transform: [{ translateX: translateXInterpolated }],
              shadowColor: '#000',
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'relative',
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
});
