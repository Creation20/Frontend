import React, { useRef, useEffect } from 'react';
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
  const wordPositions = useRef<Record<number, number>>({});

  useEffect(() => {
    if (currentWordIndex >= 0 && wordPositions.current[currentWordIndex] !== undefined) {
      onWordLayout?.(currentWordIndex, wordPositions.current[currentWordIndex]);
    }
  }, [currentWordIndex, onWordLayout]);

  // Executive POS Colors: Muted, professional palette
  const getPOSStyle = (pos: POS, isHighlighted: boolean): any => {
    if (!settings.grammarHighlightingEnabled) return {};
    
    // In Audio mode, we don't show POS colors to reduce cognitive load
    if (currentWordIndex !== -1) return {};

    const styles: Record<POS, any> = {
      noun: { color: '#0B6E6E', borderBottomWidth: 1.5, borderBottomColor: '#0B6E6E30' },
      verb: { color: '#3B82F6', borderBottomWidth: 1.5, borderBottomColor: '#3B82F630' },
      adjective: { color: '#F59E0B', borderBottomWidth: 1.5, borderBottomColor: '#F59E0B30' },
      conjunction: { color: '#8B5CF6', borderBottomWidth: 1.5, borderBottomColor: '#8B5CF630' },
      other: {},
    };
    return styles[pos] || {};
  };

  return (
    <View style={styles.container}>
      {words.map((word, idx) => {
        const isHighlighted = idx === currentWordIndex;
        const pos = getPartOfSpeech(word);
        const posStyle = getPOSStyle(pos, isHighlighted);

        return (
          <View 
            key={idx} 
            onLayout={(e) => {
              wordPositions.current[idx] = e.nativeEvent.layout.y;
              if (idx === currentWordIndex) onWordLayout?.(idx, e.nativeEvent.layout.y);
            }}
            style={styles.wordWrapper}
          >
            <TouchableOpacity
              onPress={() => onWordPress?.(word, idx)}
              activeOpacity={0.7}
              style={[
                styles.touchable,
                { backgroundColor: isHighlighted ? theme.primary + '15' : 'transparent', borderRadius: 6 }
              ]}
            >
              {settings.bionicReadingEnabled ? (
                <BionicText 
                  word={word} 
                  theme={theme} 
                  isHighlighted={isHighlighted} 
                  posStyle={posStyle} 
                />
              ) : (
                <Text
                  style={[
                    styles.wordText,
                    {
                      fontFamily: theme.fontFamily,
                      fontSize: theme.fontSize,
                      lineHeight: theme.fontSize * theme.lineHeight,
                      color: isHighlighted ? theme.primary : (posStyle.color ?? theme.text),
                    },
                    posStyle
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

function BionicText({ word, theme, isHighlighted, posStyle }: any) {
  const { bold, normal } = bionicSplit(word);
  const color = isHighlighted ? theme.primary : (posStyle.color ?? theme.text);
  
  return (
    <Text style={[
      { fontSize: theme.fontSize, lineHeight: theme.fontSize * theme.lineHeight },
      posStyle
    ]}>
      <Text style={[styles.boldPart, { fontFamily: theme.fontFamily, color, fontWeight: '900' }]}>
        {bold}
      </Text>
      <Text style={{ fontFamily: theme.fontFamily, color, opacity: isHighlighted ? 1 : 0.85 }}>
        {normal}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  wordWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  touchable: { paddingHorizontal: 2, paddingVertical: 1 },
  wordText: { textAlign: 'center' },
  boldPart: { },
  space: { opacity: 0 },
});
