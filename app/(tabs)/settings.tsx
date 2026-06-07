import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { Toggle } from '../../src/components/common/Toggle';
import { Card } from '../../src/components/common/Card';
import { AppearanceSettings } from '../../src/components/settings/AppearanceSettings';

export default function SettingsScreen() {
  const theme = useTheme();
  const { settings, updateSetting, resetSettings } = useSettingsStore();
  const [expandedSection, setExpandedSection] = useState<string | null>('appearance');

  const toggleSection = (key: string) => {
    setExpandedSection((prev) => (prev === key ? null : key));
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all reading settings to defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetSettings },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Customize your reading experience
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Live Preview */}
        <Card style={[styles.preview, { borderColor: theme.border }]}>
          <View style={styles.previewLabel}>
            <Ionicons name="eye-outline" size={14} color={theme.primary} />
            <Text style={[styles.previewLabelText, { color: theme.primary }]}>Live Preview</Text>
          </View>
          <Text
            style={[
              styles.previewText,
              {
                color: theme.text,
                fontFamily: theme.fontFamily,
                fontSize: settings.fontSize,
                lineHeight: settings.fontSize * settings.lineHeight,
                letterSpacing: settings.letterSpacing,
              },
            ]}
          >
            {settings.bionicReadingEnabled ? (
              <><Text style={{ fontWeight: '800' }}>Stu</Text>dents with <Text style={{ fontWeight: '800' }}>dys</Text>lexia <Text style={{ fontWeight: '800' }}>de</Text>serve <Text style={{ fontWeight: '800' }}>bet</Text>ter <Text style={{ fontWeight: '800' }}>read</Text>ing <Text style={{ fontWeight: '800' }}>sup</Text>port.</>
            ) : (
              'Students with dyslexia deserve better reading support.'
            )}
          </Text>
        </Card>

        {/* Appearance Section */}
        <SettingsSection title="Appearance & Theme" icon="color-palette-outline" expanded={expandedSection === 'appearance'} onToggle={() => toggleSection('appearance')} theme={theme}>
          <AppearanceSettings settings={settings} updateSetting={updateSetting} theme={theme} />
        </SettingsSection>

        {/* Typography Section */}
        <SettingsSection title="Typography" icon="text-outline" expanded={expandedSection === 'typography'} onToggle={() => toggleSection('typography')} theme={theme}>
          <SliderRow label="Font Size" value={settings.fontSize} min={14} max={32} step={1} displayValue={`${settings.fontSize}px`} onValueChange={(v) => updateSetting('fontSize', v)} theme={theme} />
          <SliderRow label="Line Height" value={settings.lineHeight} min={1.0} max={3.0} step={0.1} displayValue={`${settings.lineHeight.toFixed(1)}×`} onValueChange={(v) => updateSetting('lineHeight', parseFloat(v.toFixed(1)))} theme={theme} />
          <SliderRow label="Letter Spacing" value={settings.letterSpacing} min={0} max={4} step={0.25} displayValue={`${settings.letterSpacing}px`} onValueChange={(v) => updateSetting('letterSpacing', parseFloat(v.toFixed(2)))} theme={theme} />
        </SettingsSection>

        {/* Reading Modes Section */}
        <SettingsSection title="Reading Modes" icon="book-outline" expanded={expandedSection === 'reading'} onToggle={() => toggleSection('reading')} theme={theme}>
          <ToggleRow label="Bionic Reading" description="Bolds the first syllable of each word" value={settings.bionicReadingEnabled} onToggle={(v) => updateSetting('bionicReadingEnabled', v)} theme={theme} />
          <ToggleRow label="Focus Ruler" description="Highlights a line and masks surroundings" value={settings.focusRulerEnabled} onToggle={(v) => updateSetting('focusRulerEnabled', v)} theme={theme} />
          <ToggleRow label="Visual Grammar Aid" description="Color-code Nouns, Verbs, and Adjectives" value={settings.grammarHighlightingEnabled} onToggle={(v) => updateSetting('grammarHighlightingEnabled', v)} theme={theme} />
          <ToggleRow label="Semantic Chunking" description="Break text into smaller sections" value={settings.chunkingEnabled} onToggle={(v) => updateSetting('chunkingEnabled', v)} theme={theme} />
          
          {/* Chunk Size Selector - RESTORED */}
          {settings.chunkingEnabled && (
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Chunk Size</Text>
              <View style={styles.chipRow}>
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => updateSetting('chunkSize', size)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: settings.chunkSize === size ? theme.primary : theme.surface,
                        borderColor: settings.chunkSize === size ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: settings.chunkSize === size ? '#FFF' : theme.textSecondary }]}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <ToggleRow label="Distraction-Free Mode" description="Hide UI elements while reading" value={settings.distractionFreeMode} onToggle={(v) => updateSetting('distractionFreeMode', v)} theme={theme} />
        </SettingsSection>

        {/* TTS Section - RESTORED */}
        <SettingsSection title="Text-to-Speech" icon="volume-high-outline" expanded={expandedSection === 'tts'} onToggle={() => toggleSection('tts')} theme={theme}>
          <ToggleRow label="Enable Word Highlighting" description="Highlight words as they are read" value={settings.highlightingEnabled} onToggle={(v) => updateSetting('highlightingEnabled', v)} theme={theme} />
          <SliderRow label="Reading Speed" value={settings.ttsSpeed} min={0.25} max={2.0} step={0.25} displayValue={`${settings.ttsSpeed.toFixed(2)}×`} onValueChange={(v) => updateSetting('ttsSpeed', parseFloat(v.toFixed(2)))} theme={theme} />
          <SliderRow label="Pitch" value={settings.ttsPitch} min={0.5} max={2.0} step={0.1} displayValue={`${settings.ttsPitch.toFixed(1)}`} onValueChange={(v) => updateSetting('ttsPitch', parseFloat(v.toFixed(1)))} theme={theme} />
        </SettingsSection>

        {/* Reset Button */}
        <TouchableOpacity onPress={handleReset} activeOpacity={0.8} style={[styles.resetBtn, { borderColor: theme.error, backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="refresh-outline" size={18} color="#EF4444" />
          <Text style={styles.resetBtnText}>Reset All Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SettingsSection({ title, icon, expanded, onToggle, theme, children }: any) {
  return (
    <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIcon, { backgroundColor: theme.primaryLight }]}><Ionicons name={icon as any} size={16} color={theme.primary} /></View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
      </TouchableOpacity>
      {expanded && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function ToggleRow({ label, description, value, onToggle, theme }: any) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={[styles.toggleLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>{description}</Text>
      </View>
      <Toggle value={value} onToggle={onToggle} />
    </View>
  );
}

function SliderRow({ label, value, min, max, step, displayValue, onValueChange, theme }: any) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.toggleLabel, { color: theme.text }]}>{label}</Text>
        <View style={[styles.sliderValueBadge, { backgroundColor: theme.primaryLight }]}><Text style={[styles.sliderValue, { color: theme.primary }]}>{displayValue}</Text></View>
      </View>
      <Slider value={value} minimumValue={min} maximumValue={max} step={step} onValueChange={onValueChange} minimumTrackTintColor={theme.primary} maximumTrackTintColor={theme.border} thumbTintColor={theme.primary} style={styles.slider} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  scroll: { padding: 16, gap: 12 },
  preview: { padding: 20, gap: 10 },
  previewLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  previewLabelText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  previewText: { fontSize: 16, lineHeight: 28 },
  section: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 16 },
  settingItem: { gap: 10 },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleDesc: { fontSize: 12, lineHeight: 18 },
  sliderRow: { gap: 8 },
  sliderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderValueBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sliderValue: { fontSize: 12, fontWeight: '700' },
  slider: { marginHorizontal: -8 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  chipText: { fontSize: 13, fontWeight: '700' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, borderWidth: 1.5, gap: 8, marginTop: 4 },
  resetBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});
