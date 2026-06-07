export interface Document {
  id: string;
  title: string;
  subject: string;
  author: string;
  uploadedAt: string;
  lastReadAt?: string;
  progress: number; // 0–100
  readingTime: number; // seconds read so far
  estimatedReadingTime: number; // in minutes
  wordCount: number;
  pages: number;
  category: 'lecture' | 'article' | 'textbook' | 'personal';
  content: string;
  simplifiedContent: string;
  chunks: string[];
  bookmarks: Bookmark[];
  quizResults: QuizResult[];
  flashcards: Flashcard[];
  coverColor: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface Bookmark {
  id: string;
  chunkIndex: number;
  wordIndex: number;
  note?: string;
  createdAt: string;
}

export interface QuizResult {
  quizId: string;
  score: number;
  total: number;
  completedAt: string;
}

export interface ComprehensionQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  afterChunkIndex: number;
  questions: ComprehensionQuestion[];
}
