import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Document, Bookmark } from '../types/document.types';
import { api } from '../utils/api';

interface LibraryStore {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  fetchDocuments: (search?: string) => Promise<void>;
  uploadDocument: (formData: FormData) => Promise<void>;
  removeDocument: (id: string) => Promise<void>;
  getDocument: (id: string) => Document | undefined;
  updateProgress: (id: string, progress: number, additionalSeconds: number) => Promise<void>;
  addBookmark: (id: string, bookmark: any) => Promise<void>;
  getRecommendations: (limit?: number) => Document[];
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      documents: [],
      isLoading: false,
      error: null,

      fetchDocuments: async (search) => {
        set({ isLoading: true, error: null });
        try {
          const docs = await api.documents.list(search);
          set({ documents: docs, isLoading: false });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      uploadDocument: async (formData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.documents.upload(formData);
          set((state) => ({ 
            documents: [response.document, ...state.documents],
            isLoading: false 
          }));
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      removeDocument: async (id) => {
        try {
          await api.documents.delete(id);
          set((state) => ({
            documents: state.documents.filter((d) => d.id !== id),
          }));
        } catch (err: any) {
          console.error('Failed to delete document:', err.message);
        }
      },

      getDocument: (id) => get().documents.find((d) => d.id === id),
      
      getRecommendations: (limit = 3) => {
        const docs = get().documents;
        return docs
          .filter(d => d.progress < 100)
          .sort((a, b) => a.progress - b.progress)
          .slice(0, limit);
      },

      updateProgress: async (id, progress, additionalSeconds) => {
        // Optimistic update
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id
              ? { ...d, progress, readingTime: (d.readingTime || 0) + additionalSeconds, lastReadAt: new Date().toISOString() }
              : d
          ),
        }));

        try {
          await api.documents.updateProgress(id, progress, additionalSeconds);
        } catch (err: any) {
          console.warn('Progress sync failed:', err.message);
        }
      },

      addBookmark: async (id, bookmarkData) => {
        try {
          const bookmark = await api.documents.addBookmark(
            id, 
            bookmarkData.chunkIndex, 
            bookmarkData.wordIndex, 
            bookmarkData.note
          );
          set((state) => ({
            documents: state.documents.map((d) =>
              d.id === id
                ? { ...d, bookmarks: [bookmark, ...(d.bookmarks || [])] }
                : d
            ),
          }));
        } catch (err: any) {
          console.error('Failed to add bookmark:', err.message);
        }
      },
    }),
    {
      name: 'lexiaid-library',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
