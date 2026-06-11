import { create } from 'zustand';
import { ReadingMode, ChatMessage } from '../types/reader.types';

interface ReaderStore {
  // Current document state
  currentDocumentId: string | null;
  currentChunkIndex: number;
  currentWordIndex: number;
  totalChunks: number;
  chunks: string[];

  // Session Tracking (For WPM)
  sessionStartTime: number | null;
  sessionStartChunkIndex: number;
  sessionAccumulatedTime: number; // in milliseconds
  isPaused: boolean;
  lastInteractionTime: number;

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
  currentQuiz: any | null;
  
  // Soundscape state
  activeSound: 'rain' | 'white' | 'birds' | null;
  
  // Chat state
  isChatVisible: boolean;
  chatMessages: ChatMessage[];

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
  triggerQuiz: (documentId: string) => Promise<void>;
  dismissQuiz: () => void;
  setActiveSound: (sound: 'rain' | 'white' | 'birds' | null) => void;
  setChatVisible: (visible: boolean) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  recordInteraction: () => void;
  endSession: () => { elapsedSeconds: number; chunksRead: number };
  reset: () => void;
}

export const useReaderStore = create<ReaderStore>((set, get) => ({
  currentDocumentId: null,
  currentChunkIndex: 0,
  currentWordIndex: -1,
  totalChunks: 0,
  chunks: [],
  sessionStartTime: null,
  sessionStartChunkIndex: 0,
  sessionAccumulatedTime: 0,
  isPaused: false,
  lastInteractionTime: Date.now(),
  isPlaying: false,
  isTTSLoading: false,
  showSimplified: false,
  showFocusRuler: false,
  focusRulerY: 200,
  readingMode: 'chunk',
  showToolbar: true,
  showQuiz: false,
  pendingQuizId: null,
  currentQuiz: null,
  activeSound: null,
  isChatVisible: false,
  chatMessages: [],

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
      currentQuiz: null,
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

  triggerQuiz: async (documentId) => {
    set({ showQuiz: true, isPlaying: false, currentQuiz: null });
    try {
      const { api } = require('../utils/api');
      const quiz = await api.documents.getQuiz(documentId);
      set({ currentQuiz: quiz });
    } catch (err: any) {
      console.warn('Failed to fetch quiz:', err.message);
      set({ showQuiz: false });
    }
  },

  dismissQuiz: () => set({ showQuiz: false, pendingQuizId: null, currentQuiz: null }),

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

  startSession: () => set({ 
    sessionStartTime: Date.now(),
    sessionStartChunkIndex: get().currentChunkIndex,
    sessionAccumulatedTime: 0,
    isPaused: false,
    lastInteractionTime: Date.now()
  }),

  pauseSession: () => {
    const { isPaused, sessionStartTime } = get();
    if (isPaused || !sessionStartTime) return;
    
    const now = Date.now();
    const sessionTime = now - sessionStartTime;
    set((state) => ({
      isPaused: true,
      sessionAccumulatedTime: state.sessionAccumulatedTime + sessionTime,
      sessionStartTime: null
    }));
  },

  resumeSession: () => {
    const { isPaused, sessionStartTime } = get();
    if (!isPaused || sessionStartTime) return;
    set({
      isPaused: false,
      sessionStartTime: Date.now(),
      lastInteractionTime: Date.now()
    });
  },

  recordInteraction: () => {
    const { isPaused } = get();
    set({ lastInteractionTime: Date.now() });
    if (isPaused) {
      get().resumeSession();
    }
  },

  endSession: () => {
    const { sessionStartTime, sessionStartChunkIndex, currentChunkIndex, sessionAccumulatedTime, isPaused } = get();
    
    let totalMs = sessionAccumulatedTime;
    if (sessionStartTime && !isPaused) {
      totalMs += (Date.now() - sessionStartTime);
    }
    
    const elapsedSeconds = Math.floor(totalMs / 1000);
    const chunksRead = Math.abs(currentChunkIndex - sessionStartChunkIndex) + 1;
    
    set({ sessionStartTime: null, sessionAccumulatedTime: 0, isPaused: false });
    return { elapsedSeconds, chunksRead };
  },

  reset: () =>
    set({
      currentDocumentId: null,
      currentChunkIndex: 0,
      currentWordIndex: -1,
      totalChunks: 0,
      chunks: [],
      sessionStartTime: null,
      sessionStartChunkIndex: 0,
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
    }),
}));
