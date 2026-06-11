import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { THEMES } from '../../src/constants/themes';

const { width } = Dimensions.get('window');

const TEST_OPTIONS = [
  {
    id: 'standard',
    label: 'Standard Clarity',
    theme: 'default',
    font: 'Lexend',
    spacing: 0.5,
    lineHeight: 1.8,
    description: 'Clean, modern typography with balanced spacing.',
    previewColors: ['#FFFFFF', '#0B6E6E'],
  },
  {
    id: 'comfort',
    label: 'Visual Comfort',
    theme: 'cream',
    font: 'OpenDyslexic',
    spacing: 1.5,
    lineHeight: 2.2,
    description: 'Warm background and heavy-bottom fonts to reduce letter rotation.',
    previewColors: ['#FDF6E3', '#8B5E3C'],
  },
  {
    id: 'focus',
    label: 'High Focus',
    theme: 'dark',
    font: 'Inter',
    spacing: 1.0,
    lineHeight: 2.0,
    description: 'Reduced glare with high-contrast text for maximum concentration.',
    previewColors: ['#0F172A', '#14B8A6'],
  },
];

export default function DiagnosticScreen() {
  const router = useRouter();
  const { updateSetting } = useSettingsStore();
  const [selectedId, setSelectedIndex] = useState('standard');

  // Stable animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleFinish = () => {
    const config = TEST_OPTIONS.find(o => o.id === selectedId);
    if (config) {
      updateSetting('theme', config.theme as any);
      updateSetting('fontFamily', config.font as any);
      updateSetting('letterSpacing', config.spacing);
      updateSetting('lineHeight', config.lineHeight);
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0B6E6E', '#063838']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Personalize LexiAid</Text>
            <Text style={styles.headerSubtitle}>Choose the style that is easiest for you to read.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.previewCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.previewContent, { 
            backgroundColor: TEST_OPTIONS.find(o => o.id === selectedId)?.previewColors[0],
            borderColor: '#E2E8F0',
            borderWidth: 1
          }]}>
            <Text style={[styles.previewText, { 
              color: TEST_OPTIONS.find(o => o.id === selectedId)?.previewColors[1],
              fontFamily: TEST_OPTIONS.find(o => o.id === selectedId)?.font === 'OpenDyslexic' ? 'OpenDyslexic' : 'System',
              letterSpacing: TEST_OPTIONS.find(o => o.id === selectedId)?.spacing,
              lineHeight: 24 * (TEST_OPTIONS.find(o => o.id === selectedId)?.lineHeight || 1.8) / 1.5
            }]}>
              Reading is the gateway to learning. LexiAid uses artificial intelligence to make every sentence clear and every word accessible. Which of these styles feels most comfortable for your eyes?
            </Text>
          </View>
        </Animated.View>

        <View style={styles.options}>
          {TEST_OPTIONS.map((option, i) => (
            <Animated.View key={option.id} style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <TouchableOpacity
                onPress={() => setSelectedIndex(option.id)}
                activeOpacity={0.9}
                style={[
                  styles.optionBtn,
                  { borderColor: selectedId === option.id ? '#0B6E6E' : '#E2E8F0', borderWidth: selectedId === option.id ? 2 : 1 }
                ]}
              >
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, { color: selectedId === option.id ? '#0B6E6E' : '#1A1D2E' }]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionDesc}>{option.description}</Text>
                </View>
                {selectedId === option.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#0B6E6E" />
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity onPress={handleFinish} style={styles.finishBtn}>
          <Text style={styles.finishText}>Start Reading</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerContent: { padding: 24, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#FFF' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8 },
  scroll: { padding: 24 },
  previewCard: { marginBottom: 32, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  previewContent: { padding: 24, borderRadius: 24, minHeight: 180, justifyContent: 'center' },
  previewText: { fontSize: 18, textAlign: 'center' },
  options: { gap: 12 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 20, gap: 16 },
  optionInfo: { flex: 1, gap: 4 },
  optionLabel: { fontSize: 16, fontWeight: '800' },
  optionDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  footer: { padding: 24, backgroundColor: '#F8FAFC' },
  finishBtn: { backgroundColor: '#0B6E6E', height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 4 },
  finishText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
