import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
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

  const [activeTab, setActiveTab] = useState<'playback' | 'appearance'>('playback');

  const progress = totalChunks > 0
    ? Math.round(((currentChunkIndex + 1) / totalChunks) * 100)
    : 0;

  return (
    <View style={styles.outerContainer}>
      {/* Top Progress Info */}
      <View style={[styles.infoPill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Section {currentChunkIndex + 1} of {totalChunks}
        </Text>
        <View style={styles.infoDivider} />
        <Text style={[styles.infoText, { color: theme.primary, fontWeight: '700' }]}>
          {progress}% read
        </Text>
      </View>

      <View
        style={[
          styles.mainToolbar,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
            shadowColor: theme.shadow,
          },
        ]}
      >
        {/* Tab Switcher */}
        <View style={[styles.tabBar, { backgroundColor: theme.primaryLight }]}>
          <TabButton
            active={activeTab === 'playback'}
            onPress={() => setActiveTab('playback')}
            icon="play-circle-outline"
            label="Playback"
            theme={theme}
          />
          <TabButton
            active={activeTab === 'appearance'}
            onPress={() => setActiveTab('appearance')}
            icon="text-outline"
            label="Reading"
            theme={theme}
          />
        </View>

        <View style={styles.contentRow}>
          {activeTab === 'playback' ? (
            <View style={styles.group}>
              <IconButton
                icon="chevron-back"
                onPress={prevChunk}
                disabled={currentChunkIndex === 0}
                theme={theme}
              />
              
              <TouchableOpacity
                onPress={() => toggle(currentText)}
                activeOpacity={0.8}
                style={[styles.playBtn, { backgroundColor: theme.primary }]}
              >
                {isTTSLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#FFF" />
                )}
              </TouchableOpacity>

              <IconButton
                icon="chevron-forward"
                onPress={nextChunk}
                disabled={currentChunkIndex === totalChunks - 1}
                theme={theme}
              />

              <View style={styles.vDivider} />

              <TouchableOpacity
                onPress={onSpeedChange}
                style={[styles.speedBadge, { backgroundColor: theme.surface }]}
              >
                <Text style={[styles.speedText, { color: theme.primary }]}>
                  {settings.ttsSpeed.toFixed(1)}x
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.group}>
              {/* Appearance Controls */}
              <IconButton
                icon="remove"
                onPress={onFontSizeDecrease}
                theme={theme}
              />
              <View style={styles.fontSizeLabel}>
                <Text style={[styles.fontSizeText, { color: theme.text }]}>
                  {settings.fontSize}
                </Text>
              </View>
              <IconButton
                icon="add"
                onPress={onFontSizeIncrease}
                theme={theme}
              />

              <View style={styles.vDivider} />

              {/* AI & Bionic Toggles */}
              <ToggleButton
                icon="robot-outline"
                active={showSimplified}
                onPress={toggleSimplified}
                theme={theme}
                activeColor={theme.accent}
              />
              <ToggleButton
                icon="eye-check-outline"
                active={settings.bionicReadingEnabled}
                onPress={() => updateSetting('bionicReadingEnabled', !settings.bionicReadingEnabled)}
                theme={theme}
                activeColor={theme.primary}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function TabButton({ active, onPress, icon, label, theme }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tabBtn,
        active && { backgroundColor: theme.surfaceElevated }
      ]}
    >
      <Ionicons name={icon} size={16} color={active ? theme.primary : theme.textMuted} />
      <Text style={[styles.tabLabel, { color: active ? theme.primary : theme.textMuted }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function IconButton({ icon, onPress, disabled, theme }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.iconBtn, { backgroundColor: theme.surface }]}
    >
      <Ionicons name={icon} size={20} color={disabled ? theme.textMuted : theme.textSecondary} />
    </TouchableOpacity>
  );
}

function ToggleButton({ icon, active, onPress, theme, activeColor }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.toggleBtn,
        { 
          backgroundColor: active ? (activeColor + '15') : theme.surface,
          borderColor: active ? activeColor : theme.border
        }
      ]}
    >
      <MaterialCommunityIcons 
        name={icon} 
        size={20} 
        color={active ? activeColor : theme.textMuted} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
  },
  infoDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  mainToolbar: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 8,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentRow: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  vDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  speedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  speedText: {
    fontSize: 13,
    fontWeight: '800',
  },
  fontSizeLabel: {
    minWidth: 32,
    alignItems: 'center',
  },
  fontSizeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  }
});
