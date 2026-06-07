import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { bionicSplit, getPartOfSpeech, POS } from '../../utils/text.utils';
import { useSettingsStore } from '../../store/useSettingsStore';

interface ReaderTextProps {
  text: string;
  currentWordIndex: number;
  onWordPress?: (word: string, index: number) => void;
  onWordLayout?: (index: number, y: number) => void;
}

export function ReaderText({ text, currentWordIndex, onWordPress, onWordLayout }: ReaderTextProps) {
  const theme = useTheme();
  const { settings } = useSettingsStore();
  const words = text.trim().split(/\s+/);
  
  // Store the Y position of every word to allow instant lookup for synchronization
  const wordPositions = useRef<Record<number, number>>({});

  useEffect(() => {
    // When the active word changes, report its stored position to the parent (for Ruler sync)
    if (currentWordIndex >= 0 && wordPositions.current[currentWordIndex] !== undefined) {
      onWordLayout?.(currentWordIndex, wordPositions.current[currentWordIndex]);
    }
  }, [currentWordIndex, onWordLayout]);

  const getPOSColor = (pos: POS): string | undefined => {
    if (!settings.grammarHighlightingEnabled) return undefined;
    const colors: Record<POS, string> = {
      noun: '#3B82F6', verb: '#10B981', adjective: '#F59E0B', conjunction: '#EC4899', other: theme.text,
    };
    return colors[pos];
  };

  return (
    <View style={styles.container}>
      {words.map((word, idx) => {
        const isHighlighted = idx === currentWordIndex;
        const pos = getPartOfSpeech(word);
        const posColor = getPOSColor(pos);

        return (
          <View 
            key={idx} 
            onLayout={(e) => {
              // Capture the vertical position relative to the ReaderText container
              wordPositions.current[idx] = e.nativeEvent.layout.y;
              // If this is the current word (on initial load), report it
              if (idx === currentWordIndex) onWordLayout?.(idx, e.nativeEvent.layout.y);
            }}
            style={styles.wordWrapper}
          >
            <TouchableOpacity
              onPress={() => onWordPress?.(word, idx)}
              activeOpacity={0.7}
              style={[
                styles.touchable,
                { backgroundColor: isHighlighted ? theme.highlight : 'transparent', borderRadius: 4 }
              ]}
            >
              {settings.bionicReadingEnabled ? (
                <BionicText word={word} theme={theme} isHighlighted={isHighlighted} posColor={posColor} />
              ) : (
                <Text
                  style={[
                    styles.wordText,
                    {
                      fontFamily: theme.fontFamily,
                      fontSize: theme.fontSize,
                      lineHeight: theme.fontSize * theme.lineHeight,
                      color: isHighlighted ? theme.highlightText : (posColor ?? theme.text),
                    },
                  ]}
                >
                  {word}
                </Text>
              )}
            </TouchableOpacity>
            <Text style={[styles.space, { fontSize: theme.fontSize }]}> </Text>
          </View>
        );
      })}
    </View>
  );
}

function BionicText({ word, theme, isHighlighted, posColor }: any) {
  const { bold, normal } = bionicSplit(word);
  const color = isHighlighted ? theme.highlightText : (posColor ?? theme.text);
  return (
    <Text style={{ fontSize: theme.fontSize, lineHeight: theme.fontSize * theme.lineHeight }}>
      <Text style={[styles.boldPart, { fontFamily: theme.fontFamily, color }]}>{bold}</Text>
      <Text style={{ fontFamily: theme.fontFamily, color }}>{normal}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  wordWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  touchable: { paddingHorizontal: 2 },
  wordText: { textAlign: 'center' },
  boldPart: { fontWeight: '800' },
  space: { opacity: 0 },
});
