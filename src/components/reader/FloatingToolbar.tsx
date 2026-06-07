import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useReaderStore } from '../../store/useReaderStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useTTS } from '../../hooks/useTTS';

interface FloatingToolbarProps {
  currentText: string;
  onSpeedChange: () => void;
  onFontSizeIncrease: () => void;
  onFontSizeDecrease: () => void;
}

export function FloatingToolbar({
  currentText,
  onSpeedChange,
  onFontSizeIncrease,
  onFontSizeDecrease,
}: FloatingToolbarProps) {
  const theme = useTheme();
  const { settings, updateSetting } = useSettingsStore();
  const {
    isPlaying,
    isTTSLoading,
    showSimplified,
    toggleSimplified,
    currentChunkIndex,
    totalChunks,
    nextChunk,
    prevChunk,
  } = useReaderStore();
  const { toggle } = useTTS();

  const [activeTab, setActiveTab] = useState<'audio' | 'reading'>('audio');

  const isFirstChunk = currentChunkIndex === 0;
  const isLastChunk  = currentChunkIndex >= totalChunks - 1;

  return (
    <View style={styles.wrapper}>
      {/* Tab Pills */}
      <View style={[styles.tabRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('audio')}
          style={[styles.tabPill, activeTab === 'audio' && { backgroundColor: theme.primary }]}
        >
          <Ionicons name="headset-outline" size={14} color={activeTab === 'audio' ? '#FFF' : theme.textMuted} />
          <Text style={[styles.tabPillText, { color: activeTab === 'audio' ? '#FFF' : theme.textMuted }]}>Audio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('reading')}
          style={[styles.tabPill, activeTab === 'reading' && { backgroundColor: theme.primary }]}
        >
          <Ionicons name="book-outline" size={14} color={activeTab === 'reading' ? '#FFF' : theme.textMuted} />
          <Text style={[styles.tabPillText, { color: activeTab === 'reading' ? '#FFF' : theme.textMuted }]}>Reading</Text>
        </TouchableOpacity>
      </View>

      {/* Toolbar Card */}
      <View style={[styles.toolbar, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>

        {/* ── AUDIO TAB ───────────────────────────────────────────────────── */}
        {activeTab === 'audio' && (
          <View style={styles.audioRow}>
            {/* Prev */}
            <TouchableOpacity
              onPress={prevChunk}
              disabled={isFirstChunk}
              style={[styles.navBtn, { borderColor: theme.border, opacity: isFirstChunk ? 0.3 : 1 }]}
            >
              <Ionicons name="play-skip-back" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            {/* Play/Pause */}
            <TouchableOpacity
              onPress={() => toggle(currentText)}
              activeOpacity={0.85}
              style={[styles.playBtn, { backgroundColor: theme.primary }]}
            >
              {isTTSLoading
                ? <ActivityIndicator color="#FFF" size="small" />
                : <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color="#FFF" />
              }
            </TouchableOpacity>

            {/* Next */}
            <TouchableOpacity
              onPress={nextChunk}
              disabled={isLastChunk}
              style={[styles.navBtn, { borderColor: theme.border, opacity: isLastChunk ? 0.3 : 1 }]}
            >
              <Ionicons name="play-skip-forward" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.vDivider, { backgroundColor: theme.border }]} />

            {/* Speed badge */}
            <TouchableOpacity onPress={onSpeedChange} style={[styles.speedBtn, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.speedText, { color: theme.primary }]}>{settings.ttsSpeed.toFixed(1)}×</Text>
            </TouchableOpacity>

            {/* AI simplified toggle */}
            <TouchableOpacity
              onPress={toggleSimplified}
              style={[styles.aiBtn, {
                backgroundColor: showSimplified ? theme.accent + '18' : 'transparent',
                borderColor:     showSimplified ? theme.accent : theme.border,
              }]}
            >
              <MaterialCommunityIcons name="robot-outline" size={16} color={showSimplified ? theme.accent : theme.textMuted} />
              <Text style={[styles.aiBtnText, { color: showSimplified ? theme.accent : theme.textMuted }]}>AI</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── READING TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'reading' && (
          <View style={styles.readingContent}>
            {/* Font size row */}
            <View style={[styles.fontRow, { borderColor: theme.border }]}>
              <Text style={[styles.fontRowLabel, { color: theme.textMuted }]}>Font Size</Text>
              <View style={styles.fontControls}>
                <TouchableOpacity onPress={onFontSizeDecrease} style={[styles.fontBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <Text style={[styles.fontBtnIcon, { color: theme.textSecondary }]}>A−</Text>
                </TouchableOpacity>
                <View style={[styles.fontSizeChip, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.fontSizeNum, { color: theme.primary }]}>{settings.fontSize}</Text>
                  <Text style={[styles.fontSizePx, { color: theme.primary }]}>px</Text>
                </View>
                <TouchableOpacity onPress={onFontSizeIncrease} style={[styles.fontBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                  <Text style={[styles.fontBtnIcon, { color: theme.textSecondary }]}>A+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Toggle cards */}
            <View style={styles.toggleGrid}>
              {/* Bionic Reading */}
              <TouchableOpacity
                onPress={() => updateSetting('bionicReadingEnabled', !settings.bionicReadingEnabled)}
                activeOpacity={0.8}
                style={[styles.toggleCard, {
                  backgroundColor: settings.bionicReadingEnabled ? theme.primary : theme.surface,
                  borderColor:     settings.bionicReadingEnabled ? theme.primary : theme.border,
                }]}
              >
                <View style={[styles.toggleCardIcon, {
                  backgroundColor: settings.bionicReadingEnabled ? 'rgba(255,255,255,0.2)' : theme.primaryLight,
                }]}>
                  <MaterialCommunityIcons
                    name="eye-check-outline"
                    size={20}
                    color={settings.bionicReadingEnabled ? '#FFF' : theme.primary}
                  />
                </View>
                <View style={styles.toggleCardText}>
                  <Text style={[styles.toggleCardTitle, {
                    color: settings.bionicReadingEnabled ? '#FFF' : theme.text,
                  }]}>
                    Bionic
                  </Text>
                  <Text style={[styles.toggleCardSub, {
                    color: settings.bionicReadingEnabled ? 'rgba(255,255,255,0.7)' : theme.textMuted,
                  }]}>
                    Bold anchors
                  </Text>
                </View>
                <View style={[styles.toggleCardDot, {
                  backgroundColor: settings.bionicReadingEnabled ? '#FFF' : theme.border,
                }]} />
              </TouchableOpacity>

              {/* Grammar / POS Colors */}
              <TouchableOpacity
                onPress={() => updateSetting('grammarHighlightingEnabled', !settings.grammarHighlightingEnabled)}
                activeOpacity={0.8}
                style={[styles.toggleCard, {
                  backgroundColor: settings.grammarHighlightingEnabled ? '#7C3AED' : theme.surface,
                  borderColor:     settings.grammarHighlightingEnabled ? '#7C3AED' : theme.border,
                }]}
              >
                <View style={[styles.toggleCardIcon, {
                  backgroundColor: settings.grammarHighlightingEnabled ? 'rgba(255,255,255,0.2)' : '#EDE9FE',
                }]}>
                  <MaterialCommunityIcons
                    name="palette-outline"
                    size={20}
                    color={settings.grammarHighlightingEnabled ? '#FFF' : '#7C3AED'}
                  />
                </View>
                <View style={styles.toggleCardText}>
                  <Text style={[styles.toggleCardTitle, {
                    color: settings.grammarHighlightingEnabled ? '#FFF' : theme.text,
                  }]}>
                    Grammar
                  </Text>
                  <Text style={[styles.toggleCardSub, {
                    color: settings.grammarHighlightingEnabled ? 'rgba(255,255,255,0.7)' : theme.textMuted,
                  }]}>
                    Color POS
                  </Text>
                </View>
                <View style={[styles.toggleCardDot, {
                  backgroundColor: settings.grammarHighlightingEnabled ? '#FFF' : theme.border,
                }]} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },

  // Tab pills
  tabRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: 100,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 100,
    gap: 6,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Toolbar card
  toolbar: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    elevation: 12,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },

  // ── Audio tab ────────────────────────────────────────────────────────────
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  vDivider: { width: 1, height: 28 },
  speedBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  speedText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 5,
  },
  aiBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Reading tab ──────────────────────────────────────────────────────────
  readingContent: { gap: 14 },

  // Font size row
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  fontRowLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  fontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontBtnIcon: {
    fontSize: 12,
    fontWeight: '800',
  },
  fontSizeChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  fontSizeNum: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  fontSizePx: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Toggle cards grid
  toggleGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 10,
  },
  toggleCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleCardText: {
    flex: 1,
    gap: 2,
  },
  toggleCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  toggleCardSub: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  toggleCardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});