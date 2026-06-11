export type ReadingMode = 'scroll' | 'chunk';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
