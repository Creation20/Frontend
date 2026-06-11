import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserBadge } from '../types/user.types';
import { api, setTokens, clearTokens } from '../utils/api';

interface UserStore {
  user: UserProfile;
  updateUser: (partial: Partial<UserProfile>) => void;
  setUserProfile: (profile: UserProfile) => void;
  addBadge: (badgeId: string) => void;
  addVocabWord: (word: string, definition: string, syllables: string) => void;
  toggleVocabMastery: (word: string) => void;
  addMissedQuestion: (qId: string) => void;
  updatePerformance: (wpm: number, accuracy: number) => void;
  addXP: (amount: number) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

const INITIAL_BADGES: UserBadge[] = [
  { id: 'fast-reader', label: 'Fast Reader', icon: 'flash', color: '#F59E0B', description: 'Top 10% reading speed', requirement: 'Reach 130 WPM' },
  { id: 'focus-master', label: 'Deep Focus', icon: 'shield-check', color: '#10B981', description: 'Long reading session', requirement: '30m session' },
  { id: '7-day-star', label: '7 Day Star', icon: 'trophy', color: '#8B5CF6', description: 'Perfect weekly streak', requirement: '7 Day Streak' },
  { id: 'scholar', label: 'Scholar', icon: 'book-variant', color: '#3B82F6', description: 'Academic reader', requirement: 'Read 10 documents' },
];

const INITIAL_USER: UserProfile = {
  id: '',
  name: 'Reader',
  username: '',
  email: '',
  level: 1,
  xp: 0,
  points: 0,
  avatar: null,
  streak: 0,
  totalReadingTime: 0,
  wpmHistory: [],
  comprehensionHistory: [],
  bestReadingTime: '--:-- --',
  badges: [],
  vocabulary: [],
  missedQuestions: [],
};

const XP_PER_LEVEL = 1000;

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: INITIAL_USER,
      updateUser: (partial) => set((state) => ({ user: { ...state.user, ...partial } })),
      setUserProfile: (profile) => set({ user: profile }),
      addXP: (amount) => {
        set((state) => {
          const newXP = state.user.xp + amount;
          const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
          return {
            user: {
              ...state.user,
              xp: newXP,
              level: newLevel,
            }
          };
        });
        // Sync to backend asynchronously
        api.user.awardXp(amount).catch(err => console.warn('XP sync failed:', err.message));
      },
      addBadge: (badgeId) => {
        const badge = INITIAL_BADGES.find(b => b.id === badgeId);
        set((state) => {
          if (badge && !state.user.badges.some(b => b.id === badgeId)) {
             return { user: { ...state.user, badges: [...state.user.badges, { ...badge, earnedAt: new Date().toISOString() }] } };
          }
          return state;
        });
        // Sync to backend
        api.user.awardBadge(badgeId).catch(err => console.warn('Badge sync failed:', err.message));
      },
      addVocabWord: (word, definition, syllables) => {
        set((state) => {
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
        });
        // Sync vocabulary creation to backend
        api.vocabulary.add(word).catch(err => console.warn('Vocab word sync failed:', err.message));
      },
      toggleVocabMastery: (word) => {
        const isNowMastered = !get().user.vocabulary.find(v => v.word === word)?.mastered;
        set((state) => {
          const newState = {
            user: {
              ...state.user,
              vocabulary: state.user.vocabulary.map(v => 
                v.word === word ? { ...v, mastered: !v.mastered } : v
              )
            }
          };
          if (isNowMastered) {
            const newXP = state.user.xp + 50;
            const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
            newState.user.xp = newXP;
            newState.user.level = newLevel;
          }
          return newState;
        });
        // Sync mastery toggle to backend
        api.vocabulary.toggleMastery(word, isNowMastered).catch(err => console.warn('Vocab mastery sync failed:', err.message));
      },
      addMissedQuestion: (qId) => set((state) => ({
        user: {
          ...state.user,
          missedQuestions: Array.from(new Set([...state.user.missedQuestions, qId]))
        }
      })),
      updatePerformance: (wpm, accuracy) => set((state) => {
        const newWpmHistory = [...state.user.wpmHistory.slice(1), wpm];
        const newCompHistory = [...state.user.comprehensionHistory.slice(1), accuracy];
        return {
          user: {
            ...state.user,
            wpmHistory: newWpmHistory,
            comprehensionHistory: newCompHistory
          }
        };
      }),
      login: async (email, password) => {
        const result = await api.auth.login({ email, password });
        await setTokens(result.tokens.accessToken, result.tokens.refreshToken);
        await get().fetchProfile();
      },
      register: async (name, username, email, password) => {
        const result = await api.auth.register({ name, username, email, password });
        await setTokens(result.tokens.accessToken, result.tokens.refreshToken);
        await get().fetchProfile();
      },
      logout: async () => {
        await api.auth.logout();
        await clearTokens();
        set({ user: INITIAL_USER });
      },
      fetchProfile: async () => {
        const profile = await api.user.getProfile();
        // Map backend User profile structure to frontend UserProfile structure
        const mappedUser: UserProfile = {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          email: profile.email,
          level: profile.level ?? 1,
          xp: profile.xp ?? 0,
          points: profile.points ?? 0,
          avatar: profile.avatarUrl ?? null,
          streak: profile.streak ?? 0,
          totalReadingTime: profile.totalReadingTime ?? 0,
          wpmHistory: Array.isArray(profile.wpmHistory) ? profile.wpmHistory : JSON.parse(profile.wpmHistory || '[]'),
          comprehensionHistory: Array.isArray(profile.comprehensionHistory) ? profile.comprehensionHistory : JSON.parse(profile.comprehensionHistory || '[]'),
          bestReadingTime: profile.bestReadingTime ?? '09:00 AM',
          badges: (profile.badges || []).map((b: any) => {
            const staticBadge = INITIAL_BADGES.find(sb => sb.id === b.badgeId);
            return {
              id: b.badgeId,
              label: staticBadge?.label ?? b.badgeId,
              icon: staticBadge?.icon ?? 'award',
              color: staticBadge?.color ?? '#64748B',
              description: staticBadge?.description ?? '',
              requirement: staticBadge?.requirement ?? '',
              earnedAt: b.earnedAt,
            };
          }),
          vocabulary: (profile.vocabulary || []).map((v: any) => ({
            word: v.word,
            definition: v.definition,
            syllables: v.syllables,
            tappedCount: v.tappedCount,
            mastered: v.mastered,
            lastTapped: v.lastTapped,
          })),
          missedQuestions: [],
        };
        set({ user: mappedUser });
      },
    }),
    {
      name: 'lexiaid-user-v3',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
