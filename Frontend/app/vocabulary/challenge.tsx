import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../src/hooks/useTheme';
import { useUserStore, VocabularyWord } from '../../src/store/useUserStore';

const { width } = Dimensions.get('window');

interface GameState {
  currentWord: VocabularyWord;
  options: string[];
  score: number;
  questionIndex: number;
  gameOver: boolean;
}

export default function VocabChallengeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, addXP, toggleVocabMastery } = useUserStore();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [shakeAnim] = useState(new Animated.Value(0));

  // Initialize game
  useEffect(() => {
    if (user.vocabulary.length < 4) {
      Alert.alert('Not enough words', 'You need at least 4 words in your vocabulary to start a challenge.', [
        { text: 'Go Back', onPress: () => router.back() }
      ]);
      return;
    }
    startNewGame();
  }, []);

  const startNewGame = () => {
    const shuffled = [...user.vocabulary].sort(() => 0.5 - Math.random());
    const initialWord = shuffled[0];
    const options = generateOptions(initialWord, user.vocabulary);
    
    setGameState({
      currentWord: initialWord,
      options,
      score: 0,
      questionIndex: 0,
      gameOver: false,
    });
    resetRound();
  };

  const generateOptions = (correctWord: VocabularyWord, allWords: VocabularyWord[]) => {
    const others = allWords.filter(w => w.word !== correctWord.word);
    const shuffledOthers = others.sort(() => 0.5 - Math.random()).slice(0, 3);
    return [correctWord.definition, ...shuffledOthers.map(w => w.definition)].sort(() => 0.5 - Math.random());
  };

  const resetRound = () => {
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const handleAnswer = (optionIndex: number) => {
    if (selectedOption !== null || !gameState) return;

    const selectedDef = gameState.options[optionIndex];
    const correct = selectedDef === gameState.currentWord.definition;
    
    setSelectedOption(optionIndex);
    setIsCorrect(correct);

    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setGameState(prev => prev ? { ...prev, score: prev.score + 1 } : null);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shake();
    }

    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const nextQuestion = () => {
    if (!gameState) return;

    if (gameState.questionIndex >= 4 || gameState.questionIndex >= user.vocabulary.length - 1) {
      setGameState(prev => prev ? { ...prev, gameOver: true } : null);
      const finalScore = isCorrect ? gameState.score + 1 : gameState.score;
      const xpEarned = finalScore * 30 + 50;
      addXP(xpEarned);
    } else {
      const nextIdx = gameState.questionIndex + 1;
      const nextWord = user.vocabulary[nextIdx]; // Simple sequential for now, can be randomized
      const nextOptions = generateOptions(nextWord, user.vocabulary);
      
      setGameState(prev => prev ? {
        ...prev,
        currentWord: nextWord,
        options: nextOptions,
        questionIndex: nextIdx,
      } : null);
      resetRound();
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  if (!gameState) return null;

  if (gameState.gameOver) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.victoryContainer}>
          <MaterialCommunityIcons name="trophy" size={80} color="#F59E0B" />
          <Text style={[styles.victoryTitle, { color: theme.text }]}>Challenge Complete!</Text>
          <Text style={[styles.victoryScore, { color: theme.primary }]}>{gameState.score} / {gameState.questionIndex + 1} Correct</Text>
          
          <View style={[styles.xpCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
             <MaterialCommunityIcons name="lightning-bolt" size={24} color={theme.accent} />
             <Text style={[styles.xpText, { color: theme.text }]}>+{gameState.score * 30 + 50} XP Earned</Text>
          </View>

          <TouchableOpacity 
            onPress={() => router.back()} 
            style={[styles.finishBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.finishBtnText}>Back to Studio</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.gameHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
               <View style={[styles.progressFill, { width: `${((gameState.questionIndex + 1) / 5) * 100}%`, backgroundColor: theme.primary }]} />
            </View>
          </View>
          <View style={styles.scoreBadge}>
             <Text style={[styles.scoreText, { color: theme.primary }]}>{gameState.score}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.gameContent}>
        <Animated.View style={[styles.wordCard, { backgroundColor: theme.surface, borderColor: theme.border, transform: [{ translateX: shakeAnim }] }]}>
           <Text style={[styles.wordLabel, { color: theme.textMuted }]}>WHATS THE DEFINITION OF</Text>
           <Text style={[styles.wordText, { color: theme.primary }]}>{gameState.currentWord.word}</Text>
           <View style={[styles.wordDivider, { backgroundColor: theme.primary + '20' }]} />
           <Text style={[styles.syllables, { color: theme.textSecondary }]}>{gameState.currentWord.syllables}</Text>
        </Animated.View>

        <View style={styles.optionsGrid}>
          {gameState.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectOption = option === gameState.currentWord.definition;
            
            let backgroundColor = theme.surface;
            let borderColor = theme.border;
            
            if (selectedOption !== null) {
               if (isCorrectOption) {
                 backgroundColor = '#DCFCE7';
                 borderColor = '#10B981';
               } else if (isSelected) {
                 backgroundColor = '#FEE2E2';
                 borderColor = '#EF4444';
               }
            }

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleAnswer(index)}
                disabled={selectedOption !== null}
                activeOpacity={0.8}
                style={[
                  styles.optionBtn,
                  { 
                    backgroundColor, 
                    borderColor,
                    borderWidth: isSelected || (selectedOption !== null && isCorrectOption) ? 2 : 1 
                  }
                ]}
              >
                <Text style={[styles.optionText, { color: theme.text }]} numberOfLines={3}>
                  {option}
                </Text>
                {selectedOption !== null && isCorrectOption && (
                   <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.statusIcon} />
                )}
                {selectedOption !== null && isSelected && !isCorrectOption && (
                   <Ionicons name="close-circle" size={20} color="#EF4444" style={styles.statusIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  gameHeader: { paddingHorizontal: 20, paddingTop: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 15 },
  closeBtn: { padding: 4 },
  progressContainer: { flex: 1, height: 8 },
  progressTrack: { height: '100%', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  scoreBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontSize: 16, fontWeight: '800' },
  gameContent: { flex: 1, padding: 24, justifyContent: 'center', gap: 32 },
  wordCard: { padding: 32, borderRadius: 32, borderWidth: 1, alignItems: 'center', elevation: 4 },
  wordLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  wordText: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  wordDivider: { width: 40, height: 4, borderRadius: 2, marginVertical: 16 },
  syllables: { fontSize: 16, fontWeight: '700', letterSpacing: 3 },
  optionsGrid: { gap: 12 },
  optionBtn: { padding: 20, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  optionText: { fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 20 },
  statusIcon: { marginLeft: 8 },
  victoryContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 24 },
  victoryTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  victoryScore: { fontSize: 20, fontWeight: '800' },
  xpCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
  xpText: { fontSize: 16, fontWeight: '800' },
  finishBtn: { width: '100%', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  finishBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
