import { create } from 'zustand';
import { ReadingMode, ChatMessage } from '../types/reader.types';

interface ReaderStore {
  // Current document state
  currentDocumentId: string | null;
  currentChunkIndex: number;
  currentWordIndex: number;
  totalChunks: number;
  chunks: string[];

  // TTS state
  isPlaying: boolean;
  isTTSLoading: boolean;

  // UI state
  showSimplified: boolean;
  showFocusRuler: boolean;
  focusRulerY: number;
  readingMode: ReadingMode;
  showToolbar: boolean;
  showQuiz: boolean;
  pendingQuizId: string | null;
  
  // Soundscape state
  activeSound: 'rain' | 'white' | 'birds' | null;
  
  // Chat state
  isChatVisible: boolean;
  chatMessages: ChatMessage[];

  // Reading timer
  sessionStartTime: number | null;

  // Actions
  setCurrentDocument: (id: string, chunks: string[]) => void;
  setCurrentChunk: (index: number) => void;
  nextChunk: () => void;
  prevChunk: () => void;
  setCurrentWord: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsTTSLoading: (loading: boolean) => void;
  toggleSimplified: () => void;
  setFocusRulerY: (y: number) => void;
  setReadingMode: (mode: ReadingMode) => void;
  toggleToolbar: () => void;
  triggerQuiz: (quizId: string) => void;
  dismissQuiz: () => void;
  setActiveSound: (sound: 'rain' | 'white' | 'birds' | null) => void;
  setChatVisible: (visible: boolean) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  startSession: () => void;
  endSession: () => number;
  reset: () => void;
}

export const useReaderStore = create<ReaderStore>((set, get) => ({
  currentDocumentId: null,
  currentChunkIndex: 0,
  currentWordIndex: -1,
  totalChunks: 0,
  chunks: [],
  isPlaying: false,
  isTTSLoading: false,
  showSimplified: false,
  showFocusRuler: false,
  focusRulerY: 200,
  readingMode: 'chunk',
  showToolbar: true,
  showQuiz: false,
  pendingQuizId: null,
  activeSound: null,
  isChatVisible: false,
  chatMessages: [],
  sessionStartTime: null,

  setCurrentDocument: (id, chunks) =>
    set({
      currentDocumentId: id,
      currentChunkIndex: 0,
      currentWordIndex: -1,
      chunks,
      totalChunks: chunks.length,
      isPlaying: false,
      showSimplified: false,
      showQuiz: false,
      pendingQuizId: null,
      chatMessages: [],
    }),

  setCurrentChunk: (index) =>
    set({ currentChunkIndex: index, currentWordIndex: -1, isPlaying: false }),

  nextChunk: () =>
    set((state) => ({
      currentChunkIndex: Math.min(
        state.currentChunkIndex + 1,
        state.totalChunks - 1
      ),
      currentWordIndex: -1,
      isPlaying: false,
    })),

  prevChunk: () =>
    set((state) => ({
      currentChunkIndex: Math.max(state.currentChunkIndex - 1, 0),
      currentWordIndex: -1,
      isPlaying: false,
    })),

  setCurrentWord: (index) => set({ currentWordIndex: index }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setIsTTSLoading: (loading) => set({ isTTSLoading: loading }),

  toggleSimplified: () =>
    set((state) => ({ showSimplified: !state.showSimplified })),

  setFocusRulerY: (y) => set({ focusRulerY: y }),

  setReadingMode: (mode) => set({ readingMode: mode }),

  toggleToolbar: () =>
    set((state) => ({ showToolbar: !state.showToolbar })),

  triggerQuiz: (quizId) =>
    set({ showQuiz: true, pendingQuizId: quizId, isPlaying: false }),

  dismissQuiz: () => set({ showQuiz: false, pendingQuizId: null }),

  setActiveSound: (sound) => set({ activeSound: sound }),

  setChatVisible: (visible) => set({ isChatVisible: visible }),

  addChatMessage: (msg) => set((state) => ({
    chatMessages: [
      ...state.chatMessages,
      {
        ...msg,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
      }
    ]
  })),

  clearChat: () => set({ chatMessages: [] }),

  startSession: () => set({ sessionStartTime: Date.now() }),

  endSession: () => {
    const { sessionStartTime } = get();
    if (!sessionStartTime) return 0;
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    set({ sessionStartTime: null });
    return elapsed;
  },

  reset: () =>
    set({
      currentDocumentId: null,
      currentChunkIndex: 0,
      currentWordIndex: -1,
      totalChunks: 0,
      chunks: [],
      isPlaying: false,
      isTTSLoading: false,
      showSimplified: false,
      showFocusRuler: false,
      focusRulerY: 200,
      readingMode: 'chunk',
      showToolbar: true,
      showQuiz: false,
      pendingQuizId: null,
      activeSound: null,
      isChatVisible: false,
      chatMessages: [],
      sessionStartTime: null,
    }),
}));
