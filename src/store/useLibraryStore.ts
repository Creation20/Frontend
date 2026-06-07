import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Document, Bookmark } from '../types/document.types';
import { MOCK_DOCUMENTS } from '../constants/mockData';

interface LibraryStore {
  documents: Document[];
  addDocument: (doc: Document) => void;
  removeDocument: (id: string) => void;
  getDocument: (id: string) => Document | undefined;
  updateProgress: (id: string, progress: number, readingTime: number) => void;
  addBookmark: (id: string, bookmark: Bookmark) => void;
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      documents: MOCK_DOCUMENTS,
      addDocument: (doc) =>
        set((state) => ({ documents: [doc, ...state.documents] })),
      removeDocument: (id) =>
        set((state) => ({
          documents: state.documents.filter((d) => d.id !== id),
        })),
      getDocument: (id) => get().documents.find((d) => d.id === id),
      updateProgress: (id, progress, readingTime) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id
              ? { ...d, progress, readingTime, lastReadAt: new Date().toISOString() }
              : d
          ),
        })),
      addBookmark: (id, bookmark) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id
              ? { ...d, bookmarks: [bookmark, ...(d.bookmarks || [])] }
              : d
          ),
        })),
    }),
    {
      name: 'lexiaid-library',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
