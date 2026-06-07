import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useUserStore, VocabularyWord } from '../../src/store/useUserStore';

const { width } = Dimensions.get('window');

export default function VocabularyStudioScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, toggleVocabMastery } = useUserStore();
  const [filter, setFilter] = useState<'all' | 'learning' | 'mastered'>('all');

  const words = user.vocabulary.filter(v => {
    if (filter === 'learning') return !v.mastered;
    if (filter === 'mastered') return v.mastered;
    return true;
  });

  const masteredCount = user.vocabulary.filter(v => v.mastered).length;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Vocab Studio</Text>
          <View style={[styles.masteryBadge, { backgroundColor: theme.primaryLight }]}>
             <Text style={[styles.masteryText, { color: theme.primary }]}>{masteredCount} Mastered</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
           <FilterBtn label="All" active={filter === 'all'} onPress={() => setFilter('all')} theme={theme} />
           <FilterBtn label="Learning" active={filter === 'learning'} onPress={() => setFilter('learning')} theme={theme} />
           <FilterBtn label="Mastered" active={filter === 'mastered'} onPress={() => setFilter('mastered')} theme={theme} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {words.length === 0 ? (
          <View style={styles.emptyState}>
             <MaterialCommunityIcons name="book-search-outline" size={64} color={theme.border} />
             <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>No words here yet</Text>
             <Text style={styles.emptyDesc}>Tap difficult words while reading to save them here for practice.</Text>
          </View>
        ) : (
          words.map((item, i) => (
            <VocabCard 
              key={item.word} 
              item={item} 
              onToggle={() => toggleVocabMastery(item.word)} 
              theme={theme} 
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Matching Game Entry */}
      {user.vocabulary.length >= 4 && (
        <TouchableOpacity style={[styles.gameBtn, { backgroundColor: theme.primary }]}>
           <MaterialCommunityIcons name="controller-classic" size={24} color="#FFF" />
           <Text style={styles.gameBtnText}>Start Vocab Challenge</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function FilterBtn({ label, active, onPress, theme }: any) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        styles.filterBtn, 
        { backgroundColor: active ? theme.primary : theme.surface, borderColor: theme.border }
      ]}
    >
      <Text style={[styles.filterLabel, { color: active ? '#FFF' : theme.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function VocabCard({ item, onToggle, theme }: { item: VocabularyWord, onToggle: () => void, theme: any }) {
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View>
          <Text style={[styles.word, { color: theme.primary }]}>{item.word}</Text>
          <Text style={[styles.syllables, { color: theme.textSecondary }]}>{item.syllables}</Text>
        </View>
        <TouchableOpacity onPress={onToggle}>
          <MaterialCommunityIcons 
            name={item.mastered ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"} 
            size={24} 
            color={item.mastered ? theme.success : theme.textMuted} 
          />
        </TouchableOpacity>
      </View>
      <Text style={[styles.def, { color: theme.text }]}>{item.definition}</Text>
      <View style={styles.cardFooter}>
         <View style={styles.tappedBadge}>
            <Text style={styles.tappedText}>Viewed {item.tappedCount}x</Text>
         </View>
         <Text style={[styles.timeText, { color: theme.textMuted }]}>
            {new Date(item.lastTapped).toLocaleDateString()}
         </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  masteryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  masteryText: { fontSize: 11, fontWeight: '800' },
  filterRow: { flexDirection: 'row', gap: 10 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterLabel: { fontSize: 13, fontWeight: '700' },
  scroll: { padding: 20, gap: 12 },
  card: { padding: 20, borderRadius: 24, borderWidth: 1, gap: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  word: { fontSize: 20, fontWeight: '800' },
  syllables: { fontSize: 13, fontWeight: '600' },
  def: { fontSize: 14, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  tappedBadge: { backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tappedText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  timeText: { fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 100, gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptyDesc: { textAlign: 'center', fontSize: 14, color: '#94A3B8', lineHeight: 20 },
  gameBtn: { position: 'absolute', bottom: 30, left: 20, right: 20, height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, elevation: 8 },
  gameBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
