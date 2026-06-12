import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/useUserStore';
import { Document } from '../../types/document.types';
import { api } from '../../utils/api';

interface DeepSummaryModalProps {
  document: Document;
  visible: boolean;
  onClose: () => void;
}

interface AISummary {
  coreConcept: string;
  keyTakeaways: string[];
  conclusion: string;
}

export function DeepSummaryModal({ document, visible, onClose }: DeepSummaryModalProps) {
  const theme = useTheme();
  const { addXP } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && document.id) {
      const fetchSummary = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await api.ai.summarize(document.id);
          setSummary(result.summary);
          if (result.xpAwarded) addXP(result.xpAwarded);
        } catch (err: any) {
          console.warn('Failed to fetch summary:', err.message);
          setError("I couldn't generate a deep summary at this time. Please check your connection.");
        } finally {
          setLoading(false);
        }
      };
      
      fetchSummary();
    }
  }, [visible, document.id]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.primaryLight }]}>
                <MaterialCommunityIcons name="auto-fix" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Deep AI Summary</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>Document-wide condensation</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" color={theme.primary} />
               <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Condensing Document...</Text>
               <Text style={[styles.loadingSub, { color: theme.textMuted }]}>LexiAid AI is identifying core concepts</Text>
            </View>
          ) : (
            <>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {error && (
                  <View style={[styles.section, { borderLeftColor: theme.error || '#FF4444' }]}>
                    <Text style={[styles.sectionLabel, { color: theme.error || '#FF4444' }]}>ERROR</Text>
                    <Text style={[styles.sectionText, { color: theme.text, fontFamily: theme.fontFamily }]}>
                      {error}
                    </Text>
                  </View>
                )}

                <View style={[styles.section, { borderLeftColor: theme.primary }]}>
                   <Text style={[styles.sectionLabel, { color: theme.primary }]}>CORE CONCEPT</Text>
                   <Text style={[styles.sectionText, { color: theme.text, fontFamily: theme.fontFamily }]}>
                     {summary?.coreConcept || (!error && (document.title + " summary is being processed."))}
                   </Text>
                </View>

                {summary && summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
                  <View style={[styles.section, { borderLeftColor: theme.accent }]}>
                    <Text style={[styles.sectionLabel, { color: theme.accent }]}>KEY TAKEAWAYS</Text>
                    <View style={{ gap: 4 }}>
                      {summary.keyTakeaways.map((item, idx) => (
                        <Text key={idx} style={[styles.sectionText, { color: theme.text, fontFamily: theme.fontFamily }]}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                <View style={[styles.section, { borderLeftColor: theme.success }]}>
                   <Text style={[styles.sectionLabel, { color: theme.success }]}>SIMPLIFIED CONCLUSION</Text>
                   <Text style={[styles.sectionText, { color: theme.text, fontFamily: theme.fontFamily }]}>
                     {summary?.conclusion || document.simplifiedContent || "Refer to the main summary for core takeaways."}
                   </Text>
                </View>
              </ScrollView>

              <TouchableOpacity onPress={onClose} style={[styles.finishBtn, { backgroundColor: theme.primary }]}>
                 <Text style={styles.finishBtnText}>Return to Reader</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  container: { height: '70%', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '900' },
  subtitle: { fontSize: 12 },
  closeBtn: { padding: 4 },
  scroll: { padding: 24 },
  section: { paddingLeft: 16, borderLeftWidth: 4, marginBottom: 32, gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  sectionText: { fontSize: 15, lineHeight: 24 },
  finishBtn: { marginHorizontal: 24, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  finishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 16, fontWeight: '800' },
  loadingSub: { fontSize: 12, fontWeight: '600' },
});

