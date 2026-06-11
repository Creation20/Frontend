import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Lexend_300Light,
  Lexend_400Regular,
  Lexend_500Medium,
  Lexend_600SemiBold,
  Lexend_700Bold,
} from '@expo-google-fonts/lexend';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { THEMES } from '../src/constants/themes';

export default function RootLayout() {
  const { settings } = useSettingsStore();
  const theme = THEMES[settings.theme] ?? THEMES.default;

  const [fontsLoaded, fontError] = useFonts({
    Lexend_300Light,
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    'OpenDyslexic': require('../assets/fonts/OpenDyslexic-Regular.otf'),
    'OpenDyslexicBold': require('../assets/fonts/OpenDyslexic-Bold.otf'),
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B6E6E', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          style={
            settings.theme === 'dark' ||
            settings.theme === 'night' ||
            settings.theme === 'highContrast'
              ? 'light'
              : 'dark'
          }
          backgroundColor={theme.background}
        />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>

        {settings.screenTint && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: settings.screenTint,
                opacity: 0.12,
                zIndex: 999,
              },
            ]}
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
