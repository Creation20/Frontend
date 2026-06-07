import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Document } from '../../constants/mockData';

interface DeepSummaryModalProps {
  document: Document;
  visible: boolean;
  onClose: () => void;
}

export function DeepSummaryModal({ document, visible, onClose }: DeepSummaryModalProps) {
  const theme = useTheme();

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

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.section, { borderLeftColor: theme.primary }]}>
               <Text style={[styles.sectionLabel, { color: theme.primary }]}>CORE CONCEPT</Text>
               <Text style={[styles.sectionText, { color: theme.text, fontFamily: theme.fontFamily }]}>
                 {document.title} covers the fundamental mechanisms of {document.subject}. The primary focus is on understanding how individual components interact to create a functional system.
               </Text>
            </View>

            <View style={[styles.section, { borderLeftColor: theme.accent }]}>
               <Text style={[styles.sectionLabel, { color: theme.accent }]}>KEY TAKEAWAYS</Text>
               <Text style={[styles.sectionText, { color: theme.text, fontFamily: theme.fontFamily }]}>
                 • Complexity is broken down into manageable units.{"\n"}
                 • Key terminology like {document.flashcards?.[0]?.back || 'specific terms'} is critical to mastery.{"\n"}
                 • Practical application is shown through structural analysis.
               </Text>
            </View>

            <View style={[styles.section, { borderLeftColor: theme.success }]}>
               <Text style={[styles.sectionLabel, { color: theme.success }]}>SIMPLIFIED CONCLUSION</Text>
               <Text style={[styles.sectionText, { color: theme.text, fontFamily: theme.fontFamily }]}>
                 {document.simplifiedContent}
               </Text>
            </View>
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={[styles.finishBtn, { backgroundColor: theme.primary }]}>
             <Text style={styles.finishBtnText}>Return to Reader</Text>
          </TouchableOpacity>
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
});
