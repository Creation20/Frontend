import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'book-open-variant',
    title: 'Precision Reading',
    subtitle: 'Dyslexia-First Design',
    description:
      'Experience reading without the visual stress. LexiAid uses research-backed fonts and layouts designed specifically for your eyes.',
    accent: '#0B6E6E',
  },
  {
    id: '2',
    icon: 'robot-outline',
    title: 'AI Intelligence',
    subtitle: 'Clarity in every word',
    description:
      'Our integrated AI simplifies complex academic text into clear, manageable language while preserving critical meaning.',
    accent: '#0B6E6E',
  },
  {
    id: '3',
    icon: 'target',
    title: 'High Focus',
    subtitle: 'Stay on track',
    description:
      'Tools like Focus Rulers and Masking help you maintain your place and eliminate distractions from surrounding text.',
    accent: '#0B6E6E',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <View style={styles.root}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.topSection}>
              <View style={[styles.iconCircle, { borderColor: item.accent + '20' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={80} color={item.accent} />
              </View>
            </View>

            <View style={styles.bottomSection}>
              <Text style={[styles.subtitle, { color: item.accent }]}>{item.subtitle}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  width: idx === currentIndex ? 24 : 8,
                  opacity: idx === currentIndex ? 1 : 0.2,
                  backgroundColor: '#0B6E6E',
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={goToNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  slide: { width, flex: 1 },
  topSection: { flex: 0.55, alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  bottomSection: { flex: 0.45, paddingHorizontal: 40, alignItems: 'flex-start' },
  subtitle: { fontSize: 13, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '900', color: '#1A1D2E', marginBottom: 16, letterSpacing: -0.5 },
  description: { fontSize: 16, color: '#64748B', lineHeight: 26 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B6E6E', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 100, gap: 8 },
  nextText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
