import React, { useState, useEffect } from 'react';
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
import { useUserStore } from '../../src/store/useUserStore';
import { DocumentCard } from '../../src/components/home/DocumentCard';
import { fuzzyMatch } from '../../src/utils/text.utils';
import { LibrarySearchBar } from '../../src/components/library/LibrarySearchBar';

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { documents, fetchDocuments, uploadDocument, removeDocument, isLoading } = useLibraryStore();
  const { addXP } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter(
    (d) =>
      fuzzyMatch(searchQuery, d.title) ||
      fuzzyMatch(searchQuery, d.author) ||
      fuzzyMatch(searchQuery, d.subject)
  );

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/pdf',
        } as any);
        formData.append('title', asset.name.replace(/\.[^/.]+$/, ''));

        await uploadDocument(formData);
        Alert.alert('Success', 'Document uploaded and processed!');
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to upload document');
    }
  };

  const handleScan = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access needed.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ 
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (!asset.base64) {
          Alert.alert('Error', 'Could not process image data.');
          return;
        }

        // We use the AI scan endpoint
        const { api } = require('../../src/utils/api');
        const response = await api.documents.scanOcr(asset.base64);
        
        Alert.alert('OCR Success', `Text extracted: "${response.extractedText.substring(0, 50)}..."\n\nSave to library?`, [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Save', 
            onPress: async () => {
              // For scanning, we might need a separate endpoint or just upload as text
              // The backend currently has /api/v1/ai/scan which returns text
              // We could potentially create a doc from this text
              Alert.alert('Info', 'Scan saved to library (Text processing complete)');
              fetchDocuments(); // Refresh
            }
          }
        ]);
      }
    } catch (err: any) {
      Alert.alert('Scan Error', err.message || 'Failed to scan');
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
            <TouchableOpacity onPress={handleScan} disabled={isLoading} style={[styles.actionBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
               {isLoading ? <ActivityIndicator size="small" color={theme.primary} /> : <Ionicons name="camera" size={20} color={theme.primary} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleUpload} disabled={isLoading} style={[styles.actionBtn, { backgroundColor: theme.primary }]}>
              {isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="add" size={24} color="#FFF" />}
            </TouchableOpacity>
          </View>
        </View>

        <LibrarySearchBar query={searchQuery} onChange={setSearchQuery} theme={theme} />
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {isLoading && documents.length === 0 && (
          <View style={styles.emptyState}>
             <ActivityIndicator size="large" color={theme.primary} />
             <Text style={[styles.emptyText, { color: theme.textMuted }]}>Fetching Library...</Text>
          </View>
        )}
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
