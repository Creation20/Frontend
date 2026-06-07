export type FontFamily =
  | 'OpenDyslexic'
  | 'Lexend'
  | 'Inter'
  | 'Arial'
  | 'TimesNewRoman'
  | 'CourierNew';

export interface FontOption {
  key: FontFamily;
  label: string;
  description: string;
  sample: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    key: 'OpenDyslexic',
    label: 'OpenDyslexic',
    description: 'Designed specifically for dyslexic readers',
    sample: 'The quick brown fox',
  },
  {
    key: 'Lexend',
    label: 'Lexend',
    description: 'Reduces visual stress while reading',
    sample: 'The quick brown fox',
  },
  {
    key: 'Inter',
    label: 'Inter',
    description: 'Clear and modern sans-serif font',
    sample: 'The quick brown fox',
  },
];

// Map font key to actual font family name used in StyleSheet
export const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  OpenDyslexic: 'OpenDyslexic',
  Lexend: 'Lexend_400Regular',
  Inter: 'Inter_400Regular',
  Arial: 'System',
  TimesNewRoman: 'System',
  CourierNew: 'System',
};
