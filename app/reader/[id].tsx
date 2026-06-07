import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Share,
  PanResponder,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../src/hooks/useTheme';
import { useLibraryStore } from '../../src/store/useLibraryStore';
import { useReaderStore } from '../../src/store/useReaderStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';

import { ReaderText } from '../../src/components/reader/ReaderText';
import { FloatingToolbar } from '../../src/components/reader/FloatingToolbar';
import { AskLexiModal } from '../../src/components/modals/AskLexiModal';
import { FlashcardsModal } from '../../src/components/modals/FlashcardsModal';
import { DeepSummaryModal } from '../../src/components/modals/DeepSummaryModal';
import { ComprehensionQuiz } from '../../src/components/modals/ComprehensionQuiz';
import { WordTooltip } from '../../src/components/modals/WordTooltip';

import { MOCK_QUIZZES } from '../../src/constants/mockData';
import { chunkText } from '../../src/utils/text.utils';
import { readerStyles as styles } from '../../src/components/reader/reader.styles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const RULER_MIN_Y = 110;
const RULER_MAX_Y = SCREEN_HEIGHT - 260;

// Offsets that map ReaderText-local Y → screen Y
const SCROLL_PADDING_TOP = 130;  // scrollContent paddingTop
const NAV_ROW_HEIGHT     = 56;   // contentNav row height approx
const BANNER_HEIGHT      = 0;    // simplified banner (0 when not shown)
const CARD_PADDING_TOP   = 28;   // cardContainer padding

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const theme   = useTheme();

  const { settings, updateSetting } = useSettingsStore();
  const { getDocument, updateProgress, addBookmark } = useLibraryStore();
  const {
    currentChunkIndex,
    currentWordIndex,
    showSimplified,
    showQuiz,
    pendingQuizId,
    activeSound,
    isPlaying,
    setCurrentDocument,
    triggerQuiz,
    dismissQuiz,
    setActiveSound,
    setChatVisible,
    startSession,
    endSession,
    nextChunk,
    prevChunk,
    chunks: currentChunks,
  } = useReaderStore();

  const document      = getDocument(id);
  const scrollViewRef = useRef<ScrollView>(null);
  const soundRef      = useRef<Audio.Sound | null>(null);

  // ── UI Visibility ────────────────────────────────────────────────────────────
  const [uiVisible, setUIVisible] = useState(true);
  const uiAnim      = useRef(new Animated.Value(1)).current;
  const hintAnim    = useRef(new Animated.Value(0)).current;
  const hintTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Modals ───────────────────────────────────────────────────────────────────
  const [wordTooltip,       setWordTooltip]       = useState<{ word: string; wordIndex: number } | null>(null);
  const [flashcardsVisible, setFlashcardsVisible] = useState(false);
  const [deepSummaryVisible,setDeepSummaryVisible]= useState(false);

  // ── Focus Ruler ──────────────────────────────────────────────────────────────
  const rulerY        = useRef(new Animated.Value(260)).current;
  const lastRulerY    = useRef(260);
  const [rulerMode, setRulerMode] = useState<'manual' | 'ai'>('manual');

  // ── KEY FIX: word Y positions stored in a ref accessible to useEffect ────────
  // ReaderText reports each word's local-Y via onWordLayout.
  // We accumulate them here so the ruler-sync useEffect can look them up.
  const wordYPositions = useRef<Record<number, number>>({});

  // Called by ReaderText whenever a word's layout is known
  const handleWordLayout = useCallback((index: number, y: number) => {
    wordYPositions.current[index] = y;
  }, []);

  // ── RULER SYNC: driven by currentWordIndex + isPlaying ───────────────────────
  // This is the correct place to move the ruler — NOT inside handleWordLayout
  // which only fires on layout (mount), not on every word change during TTS.
  useEffect(() => {
    if (!isPlaying || currentWordIndex < 0) {
      if (!isPlaying) setRulerMode('manual');
      return;
    }

    const wordLocalY = wordYPositions.current[currentWordIndex];
    if (wordLocalY === undefined) return;

    setRulerMode('ai');

    // Convert ReaderText-local Y to absolute screen Y
    const screenY = SCROLL_PADDING_TOP + NAV_ROW_HEIGHT + CARD_PADDING_TOP + wordLocalY;
    const clamped = Math.max(RULER_MIN_Y, Math.min(RULER_MAX_Y, screenY));

    Animated.spring(rulerY, {
      toValue:        clamped,
      useNativeDriver: false,
      friction:       10,
      tension:        55,
    }).start();

    lastRulerY.current = clamped;
  }, [currentWordIndex, isPlaying, rulerY]);

  // ── Manual ruler drag ────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setRulerMode('manual'),
      onPanResponderMove: (_, g) => {
        const newY = Math.max(RULER_MIN_Y, Math.min(RULER_MAX_Y, lastRulerY.current + g.dy));
        rulerY.setValue(newY);
      },
      onPanResponderRelease: (_, g) => {
        lastRulerY.current = Math.max(RULER_MIN_Y, Math.min(RULER_MAX_Y, lastRulerY.current + g.dy));
      },
    })
  ).current;

  // ── UI Toggle ────────────────────────────────────────────────────────────────
  const toggleUI = useCallback(() => {
    const next = !uiVisible;
    setUIVisible(next);
    Animated.spring(uiAnim, {
      toValue:        next ? 1 : 0,
      useNativeDriver: false,
      friction:       9,
      tension:        50,
    }).start();

    if (!next) {
      if (hintTimeout.current) clearTimeout(hintTimeout.current);
      Animated.timing(hintAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      hintTimeout.current = setTimeout(() => {
        Animated.timing(hintAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start();
      }, 2000);
    } else {
      Animated.timing(hintAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [uiVisible, uiAnim, hintAnim]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!document) return;
    try { await Share.share({ message: `LexiAid: ${document.title}\n\n${document.simplifiedContent}` }); }
    catch { Alert.alert('Error', 'Export failed'); }
  };

  const handleQuizClose = (score: number, total: number) => {
    dismissQuiz();
    Alert.alert(
      score >= total * 0.7 ? '🎉 Great Job!' : '📚 Keep Practicing',
      `You scored ${score} out of ${total}`,
      [{ text: 'Continue Reading', onPress: nextChunk }]
    );
  };

  const handleSpeedCycle = () => {
    const speeds  = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currIdx = speeds.indexOf(settings.ttsSpeed);
    updateSetting('ttsSpeed', speeds[(currIdx + 1) % speeds.length]);
  };

  const handleFontSizeIncrease = () => updateSetting('fontSize', Math.min(32, settings.fontSize + 2));
  const handleFontSizeDecrease = () => updateSetting('fontSize', Math.max(14, settings.fontSize - 2));

  // ── Initialization ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!document) return;
    const chunks = settings.chunkingEnabled
      ? chunkText(document.content, settings.chunkSize)
      : [document.content];
    // Reset word positions when chunk/document changes
    wordYPositions.current = {};
    setCurrentDocument(document.id, chunks);
    startSession();
    return () => {
      const elapsed = endSession();
      if (elapsed > 5) {
        const newProgress = Math.min(100, Math.round(((currentChunkIndex + 1) / chunks.length) * 100));
        updateProgress(document.id, newProgress, (document.readingTime || 0) + elapsed);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document?.id, settings.chunkingEnabled, settings.chunkSize]);

  // Reset word positions on chunk change
  useEffect(() => {
    wordYPositions.current = {};
  }, [currentChunkIndex]);

  // ── Ambient Sound ────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    async function updateSound() {
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      if (!activeSound || !mounted) return;
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
          { isLooping: true, volume: 0.15 }
        );
        soundRef.current = sound;
        if (mounted) await sound.playAsync();
      } catch {}
    }
    updateSound();
    return () => { mounted = false; soundRef.current?.unloadAsync(); };
  }, [activeSound]);

  if (!document) return null;

  // ── Derived ──────────────────────────────────────────────────────────────────
  const currentText = showSimplified
    ? (document.simplifiedContent ?? '').split('\n\n')[currentChunkIndex] ?? currentChunks[currentChunkIndex] ?? ''
    : currentChunks[currentChunkIndex] ?? '';

  const progress     = currentChunks.length > 0 ? Math.round(((currentChunkIndex + 1) / currentChunks.length) * 100) : 0;
  const rulerHeight  = settings.fontSize * settings.lineHeight + 20;
  const currentQuiz  = MOCK_QUIZZES.find(q => q.id === pendingQuizId);

  const headerTranslateY = uiAnim.interpolate({ inputRange: [0,1], outputRange: [-140, 0] });
  const toolbarTranslateY= uiAnim.interpolate({ inputRange: [0,1], outputRange: [220,  0] });
  const fabScale         = uiAnim.interpolate({ inputRange: [0,1], outputRange: [0,    1] });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        ref={scrollViewRef}
        onScrollBeginDrag={() => { if (settings.distractionFreeMode && uiVisible) toggleUI(); }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Chunk Navigation */}
        <View style={styles.contentNav}>
          <TouchableOpacity
            onPress={prevChunk}
            disabled={currentChunkIndex === 0}
            style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border, opacity: currentChunkIndex === 0 ? 0.35 : 1 }]}
          >
            <Ionicons name="chevron-back" size={16} color={theme.primary} />
            <Text style={[styles.navButtonText, { color: theme.text }]}>Prev</Text>
          </TouchableOpacity>

          <View style={[styles.sectionInfo, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.sectionInfoText, { color: theme.primary }]}>
              {currentChunkIndex + 1} / {currentChunks.length}
            </Text>
          </View>

          <TouchableOpacity
            onPress={nextChunk}
            disabled={currentChunkIndex >= currentChunks.length - 1}
            style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border, opacity: currentChunkIndex >= currentChunks.length - 1 ? 0.35 : 1 }]}
          >
            <Text style={[styles.navButtonText, { color: theme.text }]}>Next</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Tap wrapper */}
        <TouchableOpacity activeOpacity={1} onPress={toggleUI}>
          {showSimplified && (
            <View style={[simplifiedBanner, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '60' }]}>
              <MaterialCommunityIcons name="robot-outline" size={13} color={theme.accent} />
              <Text style={[simplifiedBannerText, { color: theme.accent }]}>AI Simplified · Easier Reading</Text>
            </View>
          )}

          {/* Reading Card */}
          <View style={[styles.cardContainer, {
            backgroundColor: theme.surface,
            borderColor: showSimplified ? theme.accent + '40' : theme.border,
          }]}>
            <ReaderText
              text={currentText}
              currentWordIndex={currentWordIndex}
              onWordPress={(w, i) => setWordTooltip({ word: w, wordIndex: i })}
              onWordLayout={handleWordLayout}
            />
          </View>
        </TouchableOpacity>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => triggerQuiz(`quiz-${document.id}-1`)}
            style={[styles.mainAction, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={theme.primary} />
            <Text style={[styles.mainActionText, { color: theme.text }]}>Quick Quiz</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFlashcardsVisible(true)}
            style={[styles.mainAction, { backgroundColor: theme.primaryLight, borderColor: theme.primary + '40' }]}
          >
            <MaterialCommunityIcons name="cards-outline" size={20} color={theme.primary} />
            <Text style={[styles.mainActionText, { color: theme.primary }]}>Flashcards</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FOCUS RULER (Layer 10) */}
      {settings.focusRulerEnabled && (
        <Animated.View style={[styles.focusOverlay, { opacity: uiVisible ? 1 : 0.55 }]} pointerEvents="box-none">
          <Animated.View pointerEvents="none" style={[styles.mask, { top: 0, height: rulerY }]}>
            <LinearGradient colors={['rgba(0,0,0,0.80)', 'rgba(0,0,0,0.22)']} style={{ flex: 1 }} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.mask, { top: Animated.add(rulerY, rulerHeight), bottom: 0 }]}>
            <LinearGradient colors={['rgba(0,0,0,0.22)', 'rgba(0,0,0,0.80)']} style={{ flex: 1 }} />
          </Animated.View>

          <Animated.View
            style={[styles.ruler, {
              top:    rulerY,
              height: rulerHeight,
              borderColor:     rulerMode === 'ai' ? theme.accent : theme.primary,
              backgroundColor: rulerMode === 'ai' ? 'rgba(245,158,11,0.06)' : 'rgba(11,110,110,0.06)',
            }]}
            pointerEvents="box-none"
          >
            {/* Mode indicator */}
            <View style={styles.rulerLabel} pointerEvents="none">
              <MaterialCommunityIcons
                name={rulerMode === 'ai' ? 'robot-outline' : 'drag-horizontal-variant'}
                size={10}
                color={rulerMode === 'ai' ? theme.accent : theme.primary}
              />
              <Text style={[styles.rulerLabelText, { color: rulerMode === 'ai' ? theme.accent : theme.primary }]}>
                {rulerMode === 'ai' ? 'AI Sync' : 'Manual'}
              </Text>
            </View>

            {/* Drag handle */}
            <View
              {...(rulerMode !== 'ai' ? panResponder.panHandlers : {})}
              style={[styles.rulerHandle, { backgroundColor: rulerMode === 'ai' ? theme.accent : theme.primary }]}
            >
              <MaterialCommunityIcons
                name={rulerMode === 'ai' ? 'lock-outline' : 'drag-vertical'}
                size={20}
                color="#FFF"
              />
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* FIXED HEADER (Layer 20) */}
      <Animated.View
        pointerEvents={uiVisible ? 'auto' : 'none'}
        style={[styles.headerFixed, { backgroundColor: theme.background, transform: [{ translateY: headerTranslateY }] }]}
      >
        <View style={[styles.headerBlur, { borderBottomColor: theme.border }]}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => router.back()} style={[styles.headerBackBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="chevron-down" size={20} color={theme.text} />
              </TouchableOpacity>

              <View style={styles.headerMeta}>
                <Text style={[styles.headerDocTitle, { color: theme.text }]} numberOfLines={1}>{document.title}</Text>
                <View style={styles.headerChips}>
                  <TouchableOpacity
                    onPress={() => setActiveSound(activeSound === 'rain' ? null : 'rain')}
                    style={[styles.headerChip, {
                      backgroundColor: activeSound === 'rain' ? theme.primaryLight : 'transparent',
                      borderColor:     activeSound === 'rain' ? theme.primary : theme.border,
                    }]}
                  >
                    <Ionicons name="umbrella-outline" size={11} color={activeSound === 'rain' ? theme.primary : theme.textMuted} />
                    <Text style={[styles.headerChipText, { color: activeSound === 'rain' ? theme.primary : theme.textMuted }]}>Focus</Text>
                  </TouchableOpacity>

                  <View style={[styles.headerDot, { backgroundColor: theme.border }]} />

                  <TouchableOpacity
                    onPress={() => setDeepSummaryVisible(true)}
                    style={[styles.headerChip, { backgroundColor: theme.primaryLight, borderColor: theme.primary + '40' }]}
                  >
                    <MaterialCommunityIcons name="auto-fix" size={11} color={theme.primary} />
                    <Text style={[styles.headerChipText, { color: theme.primary }]}>AI TL;DR</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity onPress={handleExport} style={[styles.headerShareBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary + '40' }]}>
                <Ionicons name="share-outline" size={18} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}>
            <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: theme.primary }]} />
          </View>
        </View>
      </Animated.View>

      {/* TOOLBAR (Layer 20) */}
      <Animated.View
        pointerEvents={uiVisible ? 'auto' : 'none'}
        style={[styles.toolbarFixed, { transform: [{ translateY: toolbarTranslateY }] }]}
      >
        <FloatingToolbar
          currentText={currentText}
          onSpeedChange={handleSpeedCycle}
          onFontSizeIncrease={handleFontSizeIncrease}
          onFontSizeDecrease={handleFontSizeDecrease}
        />
      </Animated.View>

      {/* AI FAB (Layer 30) */}
      <Animated.View
        pointerEvents={uiVisible ? 'auto' : 'none'}
        style={[styles.assistantFloating, { backgroundColor: theme.primary, shadowColor: theme.primary, transform: [{ scale: fabScale }] }]}
      >
        {isPlaying && <View style={[styles.assistantRing, { borderColor: theme.primary }]} />}
        <TouchableOpacity onPress={() => setChatVisible(true)} style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="robot" size={26} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Distraction-free hint */}
      {settings.distractionFreeMode && !uiVisible && (
        <Animated.View pointerEvents="none" style={[styles.tapHint, { backgroundColor: 'rgba(0,0,0,0.55)', opacity: hintAnim }]}>
          <Ionicons name="tap-outline" size={14} color="#FFF" />
          <Text style={[styles.tapHintText, { color: '#FFF' }]}>Tap to show controls</Text>
        </Animated.View>
      )}

      {/* Modals */}
      <AskLexiModal />
      <FlashcardsModal cards={document.flashcards || []} visible={flashcardsVisible} onClose={() => setFlashcardsVisible(false)} />
      <DeepSummaryModal document={document} visible={deepSummaryVisible} onClose={() => setDeepSummaryVisible(false)} />
      {currentQuiz && <ComprehensionQuiz quiz={currentQuiz} visible={showQuiz} onClose={handleQuizClose} />}
      {wordTooltip && (
        <WordTooltip
          word={wordTooltip.word}
          visible={!!wordTooltip}
          onClose={() => setWordTooltip(null)}
          chunkIndex={currentChunkIndex}
          wordIndex={wordTooltip.wordIndex}
          onBookmark={(bm) => { addBookmark(document.id, bm); setWordTooltip(null); }}
        />
      )}
    </View>
  );
}

const simplifiedBanner = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 6,
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 12,
  borderWidth: 1,
  marginBottom: 10,
};
const simplifiedBannerText = {
  fontSize: 11,
  fontWeight: '700' as const,
  letterSpacing: 0.3,
};