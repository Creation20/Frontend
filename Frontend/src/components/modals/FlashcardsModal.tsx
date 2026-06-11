import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Flashcard } from '../../constants/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FlashcardsModalProps {
  cards: Flashcard[];
  visible: boolean;
  onClose: () => void;
}

export function FlashcardsModal({ cards, visible, onClose }: FlashcardsModalProps) {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const animatedValue = useRef(new Animated.Value(0)).current;
  let value = 0;

  animatedValue.addListener(({ value: v }) => {
    value = v;
  });

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const flipCard = () => {
    if (value >= 90) {
      Animated.spring(animatedValue, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      setIsFlipped(false);
    } else {
      Animated.spring(animatedValue, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      setIsFlipped(true);
    }
  };

  const nextCard = () => {
    if (isFlipped) {
      animatedValue.setValue(0);
      setIsFlipped(false);
    }
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    if (isFlipped) {
      animatedValue.setValue(0);
      setIsFlipped(false);
    }
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const currentCard = cards[currentIndex];

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };
  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  if (!currentCard) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.primaryLight }]}>
                <MaterialCommunityIcons name="cards-outline" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Study Flashcards</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                  Card {currentIndex + 1} of {cards.length}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: theme.primary, 
                  width: `${((currentIndex + 1) / cards.length) * 100}%` 
                }
              ]} 
            />
          </View>

          {/* Card Area */}
          <View style={styles.cardArea}>
            <TouchableOpacity activeOpacity={1} onPress={flipCard} style={styles.flipWrapper}>
              <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.cardLabel}>
                  <Text style={[styles.cardLabelText, { color: theme.textMuted }]}>QUESTION</Text>
                </View>
                <Text style={[styles.cardText, { color: theme.text, fontFamily: theme.fontFamily }]}>
                  {currentCard.front}
                </Text>
                <View style={styles.flipHint}>
                  <MaterialCommunityIcons name="rotate-3d-variant" size={16} color={theme.textMuted} />
                  <Text style={[styles.flipHintText, { color: theme.textMuted }]}>Tap to flip</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
                <View style={styles.cardLabel}>
                  <Text style={[styles.cardLabelText, { color: theme.primary }]}>ANSWER</Text>
                </View>
                <Text style={[styles.cardText, { color: theme.primary, fontWeight: '700', fontFamily: theme.fontFamily }]}>
                  {currentCard.back}
                </Text>
                <View style={styles.flipHint}>
                  <MaterialCommunityIcons name="rotate-3d-variant" size={16} color={theme.primary} />
                  <Text style={[styles.flipHintText, { color: theme.primary }]}>Tap to see question</Text>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={prevCard} style={[styles.navBtn, { borderColor: theme.border }]}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={flipCard} style={[styles.mainAction, { backgroundColor: theme.primary }]}>
              <Text style={styles.mainActionText}>{isFlipped ? 'Hide Answer' : 'Show Answer'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={nextCard} style={[styles.navBtn, { borderColor: theme.border }]}>
              <Ionicons name="arrow-forward" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.finishBtn}>
            <Text style={[styles.finishBtnText, { color: theme.primary }]}>Finish Study Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', borderRadius: 32, paddingBottom: 24, overflow: 'hidden', elevation: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '900' },
  subtitle: { fontSize: 12 },
  closeBtn: { padding: 4 },
  progressTrack: { height: 4, width: '100%' },
  progressFill: { height: '100%' },
  cardArea: { height: 350, padding: 24 },
  flipWrapper: { flex: 1 },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    borderWidth: 2,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  cardFront: {},
  cardBack: {},
  cardLabel: { position: 'absolute', top: 24, left: 24 },
  cardLabelText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  cardText: { fontSize: 20, textAlign: 'center', lineHeight: 28 },
  flipHint: { position: 'absolute', bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 6 },
  flipHintText: { fontSize: 11, fontWeight: '700' },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, gap: 12 },
  navBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  mainAction: { flex: 1, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  mainActionText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  finishBtn: { alignSelf: 'center', marginTop: 24, padding: 8 },
  finishBtnText: { fontSize: 14, fontWeight: '700' },
});
