import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeKey } from '../constants/themes';
import { FontFamily } from '../constants/fonts';

export interface ReadingSettings {
  // Theme & Visual
  theme: ThemeKey;
  fontFamily: FontFamily;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  screenTint: string | null; // Irlen Filters / Visual Stress overlays

  // Reading Modes
  bionicReadingEnabled: boolean;
  focusRulerEnabled: boolean;
  focusRulerColor: string;
  marginGuideEnabled: boolean;
  distractionFreeMode: boolean;
  simplifiedTextDefault: boolean;
  grammarHighlightingEnabled: boolean; // Color-code nouns, verbs, etc.

  // Chunk Settings
  chunkingEnabled: boolean;
  chunkSize: 'small' | 'medium' | 'large'; // 1, 2, 3 sentences per chunk

  // TTS Settings
  ttsEnabled: boolean;
  ttsSpeed: number; // 0.25 – 2.0
  ttsPitch: number; // 0.5 – 2.0
  highlightingEnabled: boolean;
  highlightColor: string;

  // Accessibility
  reducedMotion: boolean;
  largeTargets: boolean; // Larger touch targets

  // Daily Goal
  dailyGoalMinutes: number;
}

interface SettingsStore {
  settings: ReadingSettings;
  updateSetting: <K extends keyof ReadingSettings>(
    key: K,
    value: ReadingSettings[K]
  ) => void;
  updateSettings: (partial: Partial<ReadingSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: ReadingSettings = {
  theme: 'default',
  fontFamily: 'Lexend',
  fontSize: 18,
  lineHeight: 1.8,
  letterSpacing: 0.5,
  wordSpacing: 0,
  screenTint: null,
  bionicReadingEnabled: false,
  focusRulerEnabled: false,
  focusRulerColor: 'rgba(11, 110, 110, 0.15)',
  marginGuideEnabled: false,
  distractionFreeMode: false,
  simplifiedTextDefault: false,
  grammarHighlightingEnabled: false,
  chunkingEnabled: true,
  chunkSize: 'medium',
  ttsEnabled: false,
  ttsSpeed: 0.9,
  ttsPitch: 1.0,
  highlightingEnabled: true,
  highlightColor: '#F59E0B',
  reducedMotion: false,
  largeTargets: false,
  dailyGoalMinutes: 20,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'lexiaid-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
