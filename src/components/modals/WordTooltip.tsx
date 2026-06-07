import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Bookmark } from '../../constants/mockData';
import { useUserStore } from '../../store/useUserStore';
import { generateId, splitSyllables } from '../../utils/text.utils';

interface WordTooltipProps {
  word: string;
  visible: boolean;
  onClose: () => void;
  onBookmark: (bookmark: Bookmark) => void;
  chunkIndex: number;
  wordIndex: number;
}

interface DefinitionData {
  text: string;
  etymology?: string;
  roots?: string[];
}

const MOCK_DEFINITIONS: Record<string, DefinitionData> = {
  mitochondria: {
    text: 'Organelles in eukaryotic cells that produce energy (ATP) through cellular respiration. Often called the "powerhouses of the cell."',
    etymology: 'Greek: mito (thread) + chondrion (granule)',
    roots: ['mito-', 'chondr-'],
  },
  nucleus: {
    text: 'A membrane-bound organelle found in eukaryotic cells that contains the cell\'s genetic material (DNA).',
    etymology: 'Latin: nux (nut/kernel)',
    roots: ['nucle-'],
  },
  membrane: {
    text: 'A thin, flexible layer of tissue that surrounds a cell or organelle, controlling the movement of substances.',
    etymology: 'Latin: membrana (skin/parchment)',
    roots: ['membran-'],
  },
  equilibrium: {
    text: 'A state of balance where opposing forces or processes are equal.',
    etymology: 'Latin: aequus (equal) + libra (balance)',
    roots: ['equi-', 'libra-'],
  },
  dyslexia: {
    text: 'A learning difference that primarily affects reading and spelling, characterized by difficulties with phonological processing.',
    etymology: 'Greek: dys (difficult) + lexis (word)',
    roots: ['dys-', 'lex-'],
  },
  chromosome: {
    text: 'A thread-like structure of nucleic acids and protein found in the nucleus of living cells.',
    etymology: 'Greek: chroma (color) + soma (body)',
    roots: ['chrom-', 'soma-'],
  },
};

function getDefinition(word: string): DefinitionData {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  return (
    MOCK_DEFINITIONS[clean] || {
      text: `"${word}" — Definition not available offline. Connect to internet for AI-powered definitions.`,
    }
  );
}

export function WordTooltip({
  word,
  visible,
  onClose,
  onBookmark,
  chunkIndex,
  wordIndex,
}: WordTooltipProps) {
  const theme = useTheme();
  const { addVocabWord } = useUserStore();
  const [note, setNote] = useState('');
  const [showBookmarkNote, setShowBookmarkNote] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const data = getDefinition(word);
  const syllables = splitSyllables(word);

  // Auto-add to Vocabulary Studio when viewed
  useEffect(() => {
    if (visible && word) {
      addVocabWord(word, data.text, syllables);
    }
  }, [visible, word]);

  const speakWord = () => {
    Speech.speak(word, { rate: 0.8, pitch: 1.0 });
  };

  const handleBookmark = () => {
    if (showBookmarkNote) {
      onBookmark({
        id: generateId('bm'),
        chunkIndex,
        wordIndex,
        note: note.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      setBookmarked(true);
      setShowBookmarkNote(false);
      setNote('');
    } else {
      setShowBookmarkNote(true);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        onPress={onClose}
        activeOpacity={1}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modal,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.wordHeader}>
              <View style={styles.wordTitleGroup}>
                <Text style={[styles.word, { color: theme.primary }]}>{word}</Text>
                <Text style={[styles.syllables, { color: theme.textSecondary }]}>
                  {syllables}
                </Text>
              </View>
              <View style={styles.headerBtns}>
                <TouchableOpacity onPress={speakWord} style={[styles.speakBtn, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="volume-medium" size={18} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {data.etymology && (
              <View style={[styles.etymologyBox, { backgroundColor: theme.primaryLight + '40', borderColor: theme.primaryLight }]}>
                <View style={styles.defLabel}>
                  <MaterialCommunityIcons name="history" size={12} color={theme.primary} />
                  <Text style={[styles.etymologyLabel, { color: theme.primary }]}>
                    Word Origin (Etymology)
                  </Text>
                </View>
                <Text style={[styles.etymologyText, { color: theme.textSecondary }]}>
                  {data.etymology}
                </Text>
                {data.roots && (
                  <View style={styles.rootsRow}>
                    {data.roots.map((root, i) => (
                      <View key={i} style={[styles.rootPill, { backgroundColor: theme.primary }]}>
                        <Text style={styles.rootPillText}>{root}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.defSection}>
              <View style={styles.defLabel}>
                <Ionicons name="book-outline" size={14} color={theme.textMuted} />
                <Text style={[styles.defLabelText, { color: theme.textMuted }]}>
                  Definition
                </Text>
              </View>
              <Text
                style={[
                  styles.definition,
                  {
                    color: theme.text,
                    fontFamily: theme.fontFamily,
                    lineHeight: theme.fontSize * 1.5,
                    fontSize: theme.fontSize * 0.85,
                  },
                ]}
              >
                {data.text}
              </Text>
            </View>

            {showBookmarkNote && (
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (optional)…"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.noteInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
                multiline
              />
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={handleBookmark}
                activeOpacity={0.8}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: bookmarked
                      ? theme.accentLight
                      : theme.primaryLight,
                    flex: 1,
                  },
                ]}
              >
                <Ionicons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                  color={bookmarked ? theme.accent : theme.primary}
                />
                <Text
                  style={[
                    styles.actionBtnText,
                    { color: bookmarked ? theme.accent : theme.primary },
                  ]}
                >
                  {bookmarked
                    ? 'Bookmarked!'
                    : showBookmarkNote
                    ? 'Save Bookmark'
                    : 'Bookmark'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', paddingBottom: 20, paddingHorizontal: 16 },
  keyboardView: { width: '100%' },
  modal: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 14 },
  wordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordTitleGroup: { flex: 1 },
  word: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  syllables: { fontSize: 14, fontWeight: '600', letterSpacing: 2, marginTop: 2 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  speakBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1 },
  etymologyBox: { padding: 12, borderRadius: 16, borderWidth: 1, gap: 6 },
  etymologyLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  etymologyText: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  rootsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  rootPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  rootPillText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  defSection: { gap: 6 },
  defLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  defLabelText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  definition: { fontSize: 15, lineHeight: 24 },
  noteInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 60, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, gap: 6 },
  actionBtnText: { fontSize: 14, fontWeight: '600' },
});
