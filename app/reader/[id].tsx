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
  Pressable,
} from 'react-native';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Hooks & Store
import { useTheme } from '../../src/hooks/useTheme';
import { useLibraryStore } from '../../src/store/useLibraryStore';
import { useReaderStore } from '../../src/store/useReaderStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';

// Components
import { ReaderText } from '../../src/components/reader/ReaderText';
import { FloatingToolbar } from '../../src/components/reader/FloatingToolbar';
import { AskLexiModal } from '../../src/components/modals/AskLexiModal';
import { FlashcardsModal } from '../../src/components/modals/FlashcardsModal';
import { DeepSummaryModal } from '../../src/components/modals/DeepSummaryModal';
import { ComprehensionQuiz } from '../../src/components/modals/ComprehensionQuiz';
import { WordTooltip } from '../../src/components/modals/WordTooltip';

// Constants & Utils
import { MOCK_QUIZZES } from '../../src/constants/mockData';
import { chunkText } from '../../src/utils/text.utils';
import { readerStyles as styles } from '../../src/components/reader/reader.styles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  
  // Store
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
  } = useReaderStore();

  const document = getDocument(id);
  const scrollViewRef = useRef<ScrollView>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // UI Visibility
  const [uiVisible, setUIVisible] = useState(true);
  const uiAnim = useRef(new Animated.Value(1)).current;

  // Modals
  const [wordTooltip, setWordTooltip] = useState<{ word: string; wordIndex: number } | null>(null);
  const [flashcardsVisible, setFlashcardsVisible] = useState(false);
  const [deepSummaryVisible, setDeepSummaryVisible] = useState(false);

  // Focus Ruler
  const rulerY = useRef(new Animated.Value(250)).current;
  const lastRulerY = useRef(250);

  // UI Toggle Logic
  const toggleUI = () => {
    const nextState = !uiVisible;
    setUIVisible(nextState);
    Animated.spring(uiAnim, {
      toValue: nextState ? 1 : 0,
      useNativeDriver: false, // Required for 'top' layout animations
      friction: 8,
      tension: 40,
    }).start();
  };

  // Manual Ruler Interaction
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        let newY = lastRulerY.current + gestureState.dy;
        if (newY < 120) newY = 120;
        if (newY > SCREEN_HEIGHT - 300) newY = SCREEN_HEIGHT - 300;
        rulerY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        lastRulerY.current += gestureState.dy;
        if (lastRulerY.current < 120) lastRulerY.current = 120;
        if (lastRulerY.current > SCREEN_HEIGHT - 300) lastRulerY.current = SCREEN_HEIGHT - 300;
      },
    })
  ).current;

  // AI Synchronization
  const handleWordLayout = useCallback((index: number, y: number) => {
    if (isPlaying && y > 0) {
      const cardPadding = 26;
      const navHeaderHeight = 60;
      const scrollPaddingTop = 140;
      const targetY = y + cardPadding + navHeaderHeight + scrollPaddingTop;

      Animated.spring(rulerY, {
        toValue: targetY,
        useNativeDriver: false,
        friction: 10,
        tension: 50,
      }).start();
      
      lastRulerY.current = targetY;
    }
  }, [isPlaying, rulerY]);

  // Core Logic
  const handleExport = async () => {
    if (!document) return;
    const shareText = `LexiAid Study Sheet: ${document.title}\n\nSummary:\n${document.simplifiedContent}`;
    try { await Share.share({ message: shareText }); } catch (e) { Alert.alert('Error', 'Export failed'); }
  };

  const handleQuizClose = (score: number, total: number) => {
    dismissQuiz();
    Alert.alert(score >= total * 0.7 ? 'Great Job!' : 'Keep Practicing', `Score: ${score}/${total}`, [{ text: 'Continue', onPress: nextChunk }]);
  };

  const handleSpeedCycle = () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currIdx = speeds.indexOf(settings.ttsSpeed);
    updateSetting('ttsSpeed', speeds[(currIdx + 1) % speeds.length]);
  };
  const handleFontSizeIncrease = () => updateSetting('fontSize', Math.min(32, settings.fontSize + 2));
  const handleFontSizeDecrease = () => updateSetting('fontSize', Math.max(14, settings.fontSize - 2));

  // Initialization
  useEffect(() => {
    if (!document) return;
    let chunks = document.chunks ?? [];
    if (settings.chunkingEnabled) { chunks = chunkText(document.content, settings.chunkSize); } 
    else { chunks = [document.content]; }
    setCurrentDocument(document.id, chunks);
    startSession();
    return () => {
      const elapsed = endSession();
      if (elapsed > 5 && document) {
        const newProgress = Math.min(100, Math.round(((currentChunkIndex + 1) / chunks.length) * 100));
        updateProgress(document.id, newProgress, (document.readingTime || 0) + elapsed);
      }
    };
  }, [document?.id, settings.chunkingEnabled, settings.chunkSize]);

  useEffect(() => {
    async function updateSound() {
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      if (activeSound) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
            { isLooping: true, volume: 0.2 }
          );
          soundRef.current = sound;
          await sound.playAsync();
        } catch (e) {}
      }
    }
    updateSound();
    return () => { soundRef.current?.unloadAsync(); };
  }, [activeSound]);

  if (!document) return null;

  const { chunks: currentChunks } = useReaderStore();
  const currentText = showSimplified
    ? (document?.simplifiedContent ?? '').split('\n\n')[currentChunkIndex] ?? currentChunks[currentChunkIndex] ?? ''
    : currentChunks[currentChunkIndex] ?? '';
  const progress = currentChunks.length > 0 ? Math.round(((currentChunkIndex + 1) / currentChunks.length) * 100) : 0;
  const rulerHeight = settings.fontSize * settings.lineHeight + 20;
  const currentQuiz = MOCK_QUIZZES.find((q) => q.id === pendingQuizId);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      
      {/* LAYER 5: SCROLLABLE CONTENT (Main interaction area) */}
      <ScrollView
        ref={scrollViewRef}
        onScrollBeginDrag={() => { if (settings.distractionFreeMode && uiVisible) toggleUI(); }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
         {/* Navigation Control */}
         <View style={styles.contentNav}>
            <TouchableOpacity onPress={prevChunk} disabled={currentChunkIndex === 0} style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border, opacity: currentChunkIndex === 0 ? 0.3 : 1 }]}>
               <Ionicons name="chevron-back" size={20} color={theme.primary} /><Text style={[styles.navButtonText, { color: theme.text }]}>Prev</Text>
            </TouchableOpacity>
            <View style={[styles.sectionInfo, { backgroundColor: theme.primaryLight }]}>
               <Text style={[styles.sectionInfoText, { color: theme.primary }]}>SECTION {currentChunkIndex + 1} OF {currentChunks.length}</Text>
            </View>
            <TouchableOpacity onPress={nextChunk} disabled={currentChunkIndex === currentChunks.length - 1} style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border, opacity: currentChunkIndex === currentChunks.length - 1 ? 0.3 : 1 }]}>
               <Text style={[styles.navButtonText, { color: theme.text }]}>Next</Text><Ionicons name="chevron-forward" size={20} color={theme.primary} />
            </TouchableOpacity>
         </View>

         {/* Tap detector wrapping the content card only */}
         <TouchableOpacity activeOpacity={1} onPress={toggleUI}>
            <View style={[styles.cardContainer, { backgroundColor: theme.surface, borderColor: theme.chunkBorder, shadowColor: theme.shadow }]}>
              <ReaderText 
                text={currentText} 
                currentWordIndex={currentWordIndex} 
                onWordPress={(w, i) => setWordTooltip({ word: w, wordIndex: i })} 
                onWordLayout={handleWordLayout}
              />
            </View>
         </TouchableOpacity>

         {/* Contextual Actions (Quiz / Flashcards) */}
         <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.mainAction, { backgroundColor: theme.surface, borderColor: theme.border }]} 
              onPress={() => triggerQuiz(`quiz-${document.id}-1`)}
            >
               <MaterialCommunityIcons name="clipboard-check-outline" size={24} color={theme.primary} />
               <Text style={[styles.mainActionText, { color: theme.text }]}>Check Quiz</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.mainAction, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]} 
              onPress={() => setFlashcardsVisible(true)}
            >
               <MaterialCommunityIcons name="cards-outline" size={24} color={theme.primary} />
               <Text style={[styles.mainActionText, { color: theme.primary }]}>Study Cards</Text>
            </TouchableOpacity>
         </View>
      </ScrollView>

      {/* LAYER 10: FOCUS SYSTEM (Non-blocking masks & draggable ruler) */}
      {settings.focusRulerEnabled && (
        <Animated.View style={[styles.focusOverlay, { opacity: uiAnim }]} pointerEvents="box-none">
          <Animated.View pointerEvents="none" style={[styles.mask, { top: 0, height: rulerY }]}>
            <LinearGradient colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.3)']} style={{ flex: 1 }} />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.mask, { top: Animated.add(rulerY, rulerHeight), bottom: 0 }]}>
            <LinearGradient colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']} style={{ flex: 1 }} />
          </Animated.View>

          <Animated.View style={[styles.ruler, { top: rulerY, height: rulerHeight, borderColor: theme.primary, backgroundColor: theme.key === 'sepia' ? 'rgba(139, 94, 60, 0.1)' : 'rgba(11, 110, 110, 0.08)' }]} pointerEvents="box-none">
             <View {...panResponder.panHandlers} style={[styles.rulerHandle, { backgroundColor: theme.primary }]}>
                <MaterialCommunityIcons name="drag-vertical" size={26} color="#FFF" />
             </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* LAYER 20: FIXED CONTROLS */}
      <Animated.View 
        pointerEvents={uiVisible ? 'auto' : 'none'}
        style={[styles.headerFixed, { backgroundColor: theme.background, transform: [{ translateY: uiAnim.interpolate({ inputRange: [0, 1], outputRange: [-150, 0] }) }] }]}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
             <TouchableOpacity onPress={() => router.back()} style={[styles.iconCircle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="chevron-down" size={22} color={theme.text} />
             </TouchableOpacity>
             <View style={styles.metaContainer}>
                <Text style={[styles.titleText, { color: theme.text }]} numberOfLines={1}>{document.title}</Text>
                <View style={styles.headerChips}>
                   <TouchableOpacity onPress={() => setActiveSound(activeSound === 'rain' ? null : 'rain')} style={[styles.toolBadge, { backgroundColor: activeSound === 'rain' ? theme.primaryLight : theme.surface, borderColor: theme.border }]}>
                      <Ionicons name="umbrella-outline" size={12} color={activeSound === 'rain' ? theme.primary : theme.textMuted} />
                      <Text style={[styles.toolBadgeText, { color: activeSound === 'rain' ? theme.primary : theme.textMuted }]}>Focus</Text>
                   </TouchableOpacity>
                   <View style={[styles.chipDot, { backgroundColor: theme.border }]} />
                   <TouchableOpacity onPress={() => setDeepSummaryVisible(true)} style={styles.summaryBtn}>
                      <MaterialCommunityIcons name="auto-fix" size={14} color={theme.primary} />
                      <Text style={[styles.summaryText, { color: theme.primary }]}>AI TL;DR</Text>
                   </TouchableOpacity>
                </View>
             </View>
             <TouchableOpacity onPress={handleExport} style={[styles.iconCircle, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
                <Ionicons name="share-outline" size={20} color={theme.primary} />
             </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={[styles.progressBarTrack, { backgroundColor: theme.border }]}><View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: theme.primary }]} /></View>
      </Animated.View>

      <Animated.View 
        pointerEvents={uiVisible ? 'auto' : 'none'}
        style={[styles.toolbarFixed, { transform: [{ translateY: uiAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }) }] }]}
      >
        <FloatingToolbar currentText={currentText} onSpeedChange={handleSpeedCycle} onFontSizeIncrease={handleFontSizeIncrease} onFontSizeDecrease={handleFontSizeDecrease} />
      </Animated.View>

      {/* LAYER 30: ASSISTANT */}
      <Animated.View 
        pointerEvents={uiVisible ? 'auto' : 'none'}
        style={[styles.assistantFloating, { backgroundColor: theme.primary, transform: [{ scale: uiAnim }] }]}
      >
        <TouchableOpacity onPress={() => setChatVisible(true)} style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="robot" size={30} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      <AskLexiModal />
      <FlashcardsModal cards={document.flashcards || []} visible={flashcardsVisible} onClose={() => setFlashcardsVisible(false)} />
      <DeepSummaryModal document={document} visible={deepSummaryVisible} onClose={() => setDeepSummaryVisible(false)} />
      {currentQuiz && <ComprehensionQuiz quiz={currentQuiz} visible={showQuiz} onClose={handleQuizClose} />}
      {wordTooltip && <WordTooltip word={wordTooltip.word} visible={!!wordTooltip} onClose={() => setWordTooltip(null)} chunkIndex={currentChunkIndex} wordIndex={wordTooltip.wordIndex} onBookmark={(bm) => { addBookmark(document.id, bm); setWordTooltip(null); }} />}
    </View>
  );
}
