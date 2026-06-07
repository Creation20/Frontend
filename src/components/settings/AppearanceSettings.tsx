import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { THEME_KEYS, THEMES } from '../../constants/themes';
import { FONT_OPTIONS, FONT_FAMILY_MAP } from '../../constants/fonts';

const THEME_ICONS: Record<string, string> = {
  default: 'white-balance-sunny',
  dark: 'moon-waning-crescent',
  night: 'weather-night',
  cream: 'coffee',
  highContrast: 'contrast-box',
  blueOverlay: 'water',
};

const TINT_OPTIONS = [
  { label: 'None', color: null, icon: 'block-helper' },
  { label: 'Rose', color: '#FFB6C1', icon: 'circle' },
  { label: 'Aqua', color: '#7FFFD4', icon: 'circle' },
  { label: 'Mint', color: '#98FB98', icon: 'circle' },
  { label: 'Peach', color: '#FFDAB9', icon: 'circle' },
  { label: 'Lavender', color: '#E6E6FA', icon: 'circle' },
  { label: 'Gold', color: '#FFFACD', icon: 'circle' },
];

export function AppearanceSettings({ settings, updateSetting, theme }: any) {
  return (
    <View style={styles.container}>
      {/* Theme Selector */}
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: theme.text }]}>Reading Theme</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeList}>
          {THEME_KEYS.map((key) => {
            const t = THEMES[key];
            const isActive = settings.theme === key;
            return (
              <TouchableOpacity key={key} onPress={() => updateSetting('theme', key)} activeOpacity={0.8} style={[styles.themeChip, { backgroundColor: t.background, borderColor: isActive ? t.primary : 'transparent', borderWidth: isActive ? 2 : 0 }]}>
                <MaterialCommunityIcons name={THEME_ICONS[key] as any} size={24} color={isActive ? t.primary : t.textSecondary} />
                <Text style={[styles.themeLabel, { color: t.text }]}>{t.label}</Text>
                {isActive && <View style={[styles.themeCheck, { backgroundColor: t.primary }]}><Ionicons name="checkmark" size={10} color="#FFF" /></View>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Visual Overlays */}
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: theme.text }]}>Visual Overlays (Irlen Filters)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeList}>
          {TINT_OPTIONS.map((tint) => {
            const isActive = settings.screenTint === tint.color;
            return (
              <TouchableOpacity key={tint.label} onPress={() => updateSetting('screenTint', tint.color)} activeOpacity={0.8} style={[styles.themeChip, { backgroundColor: tint.color || theme.surface, borderColor: isActive ? theme.primary : theme.border, borderWidth: isActive ? 2 : 1 }]}>
                <MaterialCommunityIcons name={tint.icon as any} size={24} color={isActive ? theme.primary : tint.color ? 'rgba(0,0,0,0.1)' : theme.textMuted} />
                <Text style={[styles.themeLabel, { color: theme.text }]}>{tint.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Font Family */}
      <View style={styles.settingItem}>
        <Text style={[styles.settingLabel, { color: theme.text }]}>Font Family</Text>
        <View style={styles.fontList}>
          {FONT_OPTIONS.map((font) => {
            const isActive = settings.fontFamily === font.key;
            const previewFont = FONT_FAMILY_MAP[font.key] || 'System';
            return (
              <TouchableOpacity key={font.key} onPress={() => updateSetting('fontFamily', font.key)} activeOpacity={0.8} style={[styles.fontChip, { backgroundColor: isActive ? theme.primaryLight : theme.surface, borderColor: isActive ? theme.primary : theme.border, borderWidth: 1.5 }]}>
                <Text style={[styles.fontChipLabel, { color: isActive ? theme.primary : theme.text }]}>{font.label}</Text>
                <Text style={[styles.fontChipSample, { color: isActive ? theme.primary : theme.textMuted, fontFamily: previewFont }]}>Aa</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  settingItem: { gap: 10 },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  themeList: { gap: 8, paddingVertical: 4 },
  themeChip: { width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4, position: 'relative' },
  themeLabel: { fontSize: 10, fontWeight: '600' },
  themeCheck: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  fontList: { gap: 8 },
  fontChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 1.5 },
  fontChipLabel: { fontSize: 14, fontWeight: '600' },
  fontChipSample: { fontSize: 18 },
});
