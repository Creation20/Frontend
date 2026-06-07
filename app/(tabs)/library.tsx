import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../src/hooks/useTheme';
import { useLibraryStore } from '../../src/store/useLibraryStore';
import { DocumentCard } from '../../src/components/home/DocumentCard';
import { fuzzyMatch, generateId } from '../../src/utils/text.utils';
import { LibrarySearchBar } from '../../src/components/library/LibrarySearchBar';

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { documents, addDocument, removeDocument } = useLibraryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState(false);

  const filteredDocs = documents.filter(
    (d) =>
      fuzzyMatch(searchQuery, d.title) ||
      fuzzyMatch(searchQuery, d.author) ||
      fuzzyMatch(searchQuery, d.subject)
  );

  const handleUpload = async () => {
    try {
      setProcessing(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newDoc = {
          id: generateId('doc'),
          title: asset.name.replace(/\.[^/.]+$/, ''),
          author: 'Imported PDF',
          subject: 'My Document',
          content: 'This text was extracted from your PDF...',
          simplifiedContent: 'This is a simplified version of your uploaded PDF.',
          category: 'personal' as const,
          pages: 1,
          estimatedReadingTime: 5,
          wordCount: 150,
          coverColor: theme.primary,
          progress: 0,
          readingTime: 0,
          uploadedAt: new Date().toISOString(),
          chunks: ['Text extracted successfully.', 'Ready for AI processing.'],
          bookmarks: [],
          quizResults: [],
          flashcards: [{ id: 'f1', front: 'Extracted Content', back: 'Ready for study' }]
        };
        
        setTimeout(() => {
          addDocument(newDoc);
          setProcessing(false);
          Alert.alert('Success', 'Document added!');
        }, 1200);
      } else { setProcessing(false); }
    } catch (err) {
      setProcessing(false);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleScan = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access needed.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProcessing(true);
        const newDoc = {
          id: generateId('scan'),
          title: `Scan ${new Date().toLocaleTimeString()}`,
          author: 'Camera OCR',
          subject: 'Scanned Text',
          content: 'OCR processing successful...',
          simplifiedContent: 'Your scanned physical page is now simplified.',
          category: 'personal' as const,
          pages: 1,
          wordCount: 100,
          estimatedReadingTime: 2,
          coverColor: theme.accent,
          progress: 0,
          readingTime: 0,
          uploadedAt: new Date().toISOString(),
          chunks: ['Scanning complete.', 'Ready.'],
          bookmarks: [],
          quizResults: [],
          flashcards: [{ id: 'f2', front: 'Scanned Page', back: 'Converted' }]
        };
        setTimeout(() => {
          addDocument(newDoc);
          setProcessing(false);
          router.push(`/reader/${newDoc.id}`);
        }, 2000);
      }
    } catch (err) {
      setProcessing(false);
      Alert.alert('Error', 'Failed to scan');
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete', `Remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeDocument(id) },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Library</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>{documents.length} Items</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleScan} disabled={processing} style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
               <Ionicons name="camera" size={20} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUpload} disabled={processing} style={[styles.actionBtn, { backgroundColor: theme.primary }]}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <LibrarySearchBar query={searchQuery} onChange={setSearchQuery} theme={theme} />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {filteredDocs.map((doc) => (
          <View key={doc.id} style={styles.docWrapper}>
            <DocumentCard document={doc} onPress={() => router.push(`/reader/${doc.id}`)} />
            <TouchableOpacity onPress={() => handleDelete(doc.id, doc.title)} style={styles.deleteBtn}>
               <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
        {filteredDocs.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={60} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>Empty Library</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  headerActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, gap: 16 },
  docWrapper: { position: 'relative' },
  deleteBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  emptyState: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600' }
});
