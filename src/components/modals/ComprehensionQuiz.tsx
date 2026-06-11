import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Quiz } from '../../constants/mockData';
import { useUserStore } from '../../store/useUserStore';

interface ComprehensionQuizProps {
  quiz: Quiz;
  visible: boolean;
  onClose: (score: number, total: number) => void;
}

export function ComprehensionQuiz({
  quiz,
  visible,
  onClose,
}: ComprehensionQuizProps) {
  const theme = useTheme();
  const { addMissedQuestion, addXP } = useUserStore();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const total = quiz.questions.length;
  const isLast = currentQuestion === total - 1;

  useEffect(() => {
    if (visible) {
      setCurrentQuestion(0);
      setScore(0);
      setShowResults(false);
    }
  }, [visible]);

  const handleAnswer = (index: number) => {
    const isCorrect = index === quiz.questions[currentQuestion].correctIndex;
    if (isCorrect) {
      setScore(score + 1);
    } else {
      // Track missed question for Adaptive AI
      addMissedQuestion(quiz.questions[currentQuestion].id);
    }

    if (isLast) {
      setShowResults(true);
      // Award XP: 50 base + 50 per correct answer
      const xpToAward = 50 + (isCorrect ? score + 1 : score) * 50;
      addXP(xpToAward);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const percentage = Math.round((score / total) * 100);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View
          style={[
            styles.modal,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          {!showResults ? (
            <>
              <View style={styles.header}>
                <Text style={[styles.headerLabel, { color: theme.primary }]}>
                  Quick Check · {currentQuestion + 1}/{total}
                </Text>
                <TouchableOpacity onPress={() => onClose(0, total)}>
                  <Ionicons name="close" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.question, { color: theme.text, fontFamily: theme.fontFamily }]}>
                {quiz.questions[currentQuestion].question}
              </Text>

              <View style={styles.options}>
                {quiz.questions[currentQuestion].options.map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleAnswer(idx)}
                    style={[
                      styles.option,
                      { backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  >
                    <View style={[styles.optionCircle, { borderColor: theme.primary }]}>
                       <Text style={[styles.optionIndex, { color: theme.primary }]}>{String.fromCharCode(65 + idx)}</Text>
                    </View>
                    <Text style={[styles.optionText, { color: theme.text, fontFamily: theme.fontFamily }]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.results}>
              <View style={[styles.scoreCircle, { borderColor: theme.primary }]}>
                <Text style={[styles.scoreVal, { color: theme.primary }]}>{score}</Text>
                <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>out of {total}</Text>
              </View>

              <Text style={[styles.resultTitle, { color: theme.text }]}>
                {percentage >= 70 ? 'Great job!' : percentage >= 40 ? 'Keep going!' : 'Keep reading!'}
              </Text>
              <Text style={[styles.resultSubtitle, { color: theme.textSecondary }]}>
                {percentage >= 70 ? 'You have a good understanding of this section.' : 'Review this section again to improve your comprehension.'}
              </Text>

              <TouchableOpacity
                onPress={() => onClose(score, total)}
                style={[styles.finishBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.finishBtnText}>Finish Check</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modal: { borderRadius: 32, padding: 32, borderWidth: 1, elevation: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 },
  question: { fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 32 },
  options: { gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, borderWidth: 1, gap: 14 },
  optionCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  optionIndex: { fontSize: 13, fontWeight: '900' },
  optionText: { fontSize: 16, fontWeight: '600', flex: 1 },
  results: { alignItems: 'center', gap: 20 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  scoreVal: { fontSize: 40, fontWeight: '900' },
  scoreLabel: { fontSize: 13, fontWeight: '700' },
  resultTitle: { fontSize: 24, fontWeight: '900' },
  resultSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  finishBtn: { width: '100%', height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  finishBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
