export interface UserBadge {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  requirement: string;
  earnedAt?: string;
}

export interface VocabularyWord {
  word: string;
  definition: string;
  syllables: string;
  tappedCount: number;
  lastTapped: string;
  mastered: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  points: number;
  avatar: string | null;
  streak: number;
  totalReadingTime: number; // seconds
  wpmHistory: number[];
  comprehensionHistory: number[];
  bestReadingTime: string;
  badges: UserBadge[];
  vocabulary: VocabularyWord[]; // Tapped words journal
  missedQuestions: string[]; // For Adaptive Quiz AI
}
