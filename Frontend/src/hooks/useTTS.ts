import * as Speech from 'expo-speech';
import { useCallback, useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useReaderStore } from '../store/useReaderStore';
import { useSettingsStore } from '../store/useSettingsStore';

export function useTTS() {
  const { settings } = useSettingsStore();
  const { isPlaying, setIsPlaying, setIsTTSLoading, setCurrentWord } =
    useReaderStore();
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>(undefined);
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Intelligently select the best available voice
  useEffect(() => {
    async function setupVoice() {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        if (voices.length > 0) {
          // Heuristic for "human" sounding voices
          // Prioritize 'enhanced' or 'premium' quality voices
          const preferredVoices = voices.filter(v => 
            v.language.startsWith('en') && 
            (v.quality === Speech.VoiceQuality.Enhanced || 
             v.name.toLowerCase().includes('enhanced') || 
             v.name.toLowerCase().includes('premium'))
          );

          // Specific platform favorites
          const topPick = preferredVoices.find(v => 
            v.name.toLowerCase().includes('samantha') || 
            v.name.toLowerCase().includes('alex') || 
            v.name.toLowerCase().includes('google')
          ) || preferredVoices[0] || voices.find(v => v.language.startsWith('en'));

          if (topPick) {
            setSelectedVoice(topPick.identifier);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch voices:', e);
      }
    }
    setupVoice();
  }, []);

  const stopWordTimer = useCallback(() => {
    if (wordTimerRef.current) {
      clearInterval(wordTimerRef.current);
      wordTimerRef.current = null;
    }
  }, []);

  const simulateWordHighlight = useCallback(
    (words: string[], rate: number) => {
      stopWordTimer();
      let index = 0;
      // Average ms per word based on speech rate (roughly 150 WPM at 1x)
      const baseWPM = 150;
      const adjustedWPM = baseWPM * rate;
      const msPerWord = (60 / adjustedWPM) * 1000;

      setCurrentWord(0);
      wordTimerRef.current = setInterval(() => {
        index++;
        if (index >= words.length) {
          stopWordTimer();
          setCurrentWord(-1);
        } else {
          setCurrentWord(index);
        }
      }, msPerWord);
    },
    [stopWordTimer, setCurrentWord]
  );

  const speak = useCallback(
    (text: string) => {
      Speech.stop();
      stopWordTimer();

      const words = text.trim().split(/\s+/);
      setIsTTSLoading(true);

      Speech.speak(text, {
        rate: settings.ttsSpeed,
        pitch: settings.ttsPitch,
        language: 'en-US',
        voice: selectedVoice,
        onStart: () => {
          setIsTTSLoading(false);
          setIsPlaying(true);
          if (settings.highlightingEnabled) {
            simulateWordHighlight(words, settings.ttsSpeed);
          }
        },
        onDone: () => {
          setIsPlaying(false);
          setCurrentWord(-1);
          stopWordTimer();
        },
        onStopped: () => {
          setIsPlaying(false);
          setCurrentWord(-1);
          stopWordTimer();
        },
        onError: () => {
          setIsPlaying(false);
          setIsTTSLoading(false);
          setCurrentWord(-1);
          stopWordTimer();
        },
      });
    },
    [
      settings.ttsSpeed,
      settings.ttsPitch,
      settings.highlightingEnabled,
      selectedVoice,
      setIsPlaying,
      setIsTTSLoading,
      setCurrentWord,
      simulateWordHighlight,
      stopWordTimer,
    ]
  );

  const stop = useCallback(() => {
    Speech.stop();
    stopWordTimer();
    setIsPlaying(false);
    setCurrentWord(-1);
  }, [stopWordTimer, setIsPlaying, setCurrentWord]);

  const toggle = useCallback(
    (text: string) => {
      if (isPlaying) {
        stop();
      } else {
        speak(text);
      }
    },
    [isPlaying, speak, stop]
  );

  return { speak, stop, toggle, isPlaying };
}
