import { THEMES, Theme, ThemeKey } from '../constants/themes';
import { useSettingsStore } from '../store/useSettingsStore';
import { FONT_FAMILY_MAP } from '../constants/fonts';

export function useTheme(): Theme & {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
} {
  const { settings } = useSettingsStore();
  const theme = THEMES[settings.theme as ThemeKey] ?? THEMES.default;
  const fontFamily =
    FONT_FAMILY_MAP[settings.fontFamily] ?? 'Lexend_400Regular';

  return {
    ...theme,
    fontFamily,
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    letterSpacing: settings.letterSpacing,
  };
}
