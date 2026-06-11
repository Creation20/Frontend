import { useEffect } from 'react';
import { useUserStore } from '../store/useUserStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function useAdaptiveFormatting() {
  const { user } = useUserStore();
  const { settings, updateSettings } = useSettingsStore();

  useEffect(() => {
    if (user.wpmHistory.length === 0) return;

    const avgWPM = user.wpmHistory.reduce((a, b) => a + b, 0) / user.wpmHistory.length;
    const avgComp = user.comprehensionHistory.reduce((a, b) => a + b, 0) / user.comprehensionHistory.length;

    // Rule-based adaptive logic
    // If average WPM is low and comprehension is low, maybe the text is too dense
    if (avgWPM < 110 && avgComp < 75) {
      if (settings.fontSize < 22) {
        updateSettings({
          fontSize: Math.min(settings.fontSize + 1, 24),
          lineHeight: Math.min(settings.lineHeight + 0.1, 2.2),
          letterSpacing: Math.min(settings.letterSpacing + 0.1, 1.0),
        });
      }
    } 
    // If performance is high, we can normalize if they were in "extra large" mode
    else if (avgWPM > 140 && avgComp > 85) {
      if (settings.fontSize > 18) {
        updateSettings({
          fontSize: Math.max(settings.fontSize - 0.5, 18),
          lineHeight: Math.max(settings.lineHeight - 0.05, 1.6),
        });
      }
    }
  }, [user.wpmHistory, user.comprehensionHistory]);
}
