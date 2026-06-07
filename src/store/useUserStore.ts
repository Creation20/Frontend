import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserBadge } from '../types/user.types';

interface UserStore {
  user: UserProfile;
  updateUser: (partial: Partial<UserProfile>) => void;
  addBadge: (badgeId: string) => void;
  addVocabWord: (word: string, definition: string, syllables: string) => void;
  toggleVocabMastery: (word: string) => void;
  addMissedQuestion: (qId: string) => void;
}

const INITIAL_BADGES: UserBadge[] = [
  { id: 'fast-reader', label: 'Fast Reader', icon: 'flash', color: '#F59E0B', description: 'Top 10% reading speed', requirement: 'Reach 130 WPM' },
  { id: 'focus-master', label: 'Deep Focus', icon: 'shield-check', color: '#10B981', description: 'Long reading session', requirement: '30m session' },
  { id: '7-day-star', label: '7 Day Star', icon: 'trophy', color: '#8B5CF6', description: 'Perfect weekly streak', requirement: '7 Day Streak' },
  { id: 'scholar', label: 'Scholar', icon: 'book-variant', color: '#3B82F6', description: 'Academic reader', requirement: 'Read 10 documents' },
];

const INITIAL_USER: UserProfile = {
  id: 'user-1',
  name: 'Kofi Agyemang',
  username: 'kofi_read',
  email: 'kofi.agyemang@ug.edu.gh',
  level: '300 Level',
  avatar: null,
  streak: 7,
  totalReadingTime: 18600,
  wpmHistory: [110, 115, 125, 122, 130, 135, 138],
  comprehensionHistory: [65, 70, 75, 80, 78, 85, 90],
  bestReadingTime: '09:30 AM',
  badges: [],
  vocabulary: [],
  missedQuestions: [],
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: INITIAL_USER,
      updateUser: (partial) => set((state) => ({ user: { ...state.user, ...partial } })),
      addBadge: (badgeId) => set((state) => {
        const badge = INITIAL_BADGES.find(b => b.id === badgeId);
        if (badge && !state.user.badges.some(b => b.id === badgeId)) {
           return { user: { ...state.user, badges: [...state.user.badges, { ...badge, earnedAt: new Date().toISOString() }] } };
        }
        return state;
      }),
      addVocabWord: (word, definition, syllables) => set((state) => {
        const existing = state.user.vocabulary.find(v => v.word.toLowerCase() === word.toLowerCase());
        if (existing) {
          return {
            user: {
              ...state.user,
              vocabulary: state.user.vocabulary.map(v => 
                v.word.toLowerCase() === word.toLowerCase() 
                  ? { ...v, tappedCount: v.tappedCount + 1, lastTapped: new Date().toISOString() } 
                  : v
              )
            }
          };
        }
        return {
          user: {
            ...state.user,
            vocabulary: [
              ...state.user.vocabulary,
              { word, definition, syllables, tappedCount: 1, lastTapped: new Date().toISOString(), mastered: false }
            ]
          }
        };
      }),
      toggleVocabMastery: (word) => set((state) => ({
        user: {
          ...state.user,
          vocabulary: state.user.vocabulary.map(v => 
            v.word === word ? { ...v, mastered: !v.mastered } : v
          )
        }
      })),
      addMissedQuestion: (qId) => set((state) => ({
        user: {
          ...state.user,
          missedQuestions: Array.from(new Set([...state.user.missedQuestions, qId]))
        }
      })),
    }),
    {
      name: 'lexiaid-user-v3', // Incremented version
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
