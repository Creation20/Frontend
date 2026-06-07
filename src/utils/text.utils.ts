/**
 * Splits text into semantic chunks based on sentences.
 * chunkSize: 'small'=1, 'medium'=2, 'large'=3 sentences
 */
export function chunkText(
  text: string,
  chunkSize: 'small' | 'medium' | 'large'
): string[] {
  const sentencesPerChunk = { small: 1, medium: 2, large: 3 }[chunkSize];
  // Split on sentence-ending punctuation
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
    const chunk = sentences.slice(i, i + sentencesPerChunk).join(' ');
    if (chunk.trim()) chunks.push(chunk.trim());
  }
  return chunks;
}

/**
 * Applies bionic reading to a word by bolding the first ~40-60% of characters.
 * Returns { boldPart, normalPart }
 */
export function bionicSplit(word: string): { bold: string; normal: string } {
  // Remove punctuation for calculation, keep it at end of normal
  const clean = word.replace(/[^a-zA-Z0-9]/g, '');
  const punc = word.slice(clean.length);
  const boldLength = Math.max(1, Math.ceil(clean.length * 0.45));
  return {
    bold: clean.slice(0, boldLength),
    normal: clean.slice(boldLength) + punc,
  };
}

/**
 * Mock syllable splitter using basic vowel patterns.
 */
export function splitSyllables(word: string): string {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 3) return clean;
  
  // Improved heuristic for syllable splitting
  return clean
    .replace(/(?:[^aeiouy]*[aeiouy]){1,2}/g, '$&·')
    .replace(/·$/, '')
    .replace(/··/g, '·');
}

/**
 * Mock Part-of-Speech tagger for common academic words.
 */
export type POS = 'noun' | 'verb' | 'adjective' | 'conjunction' | 'other';

export function getPartOfSpeech(word: string): POS {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 2) return 'other';

  // Common Academic Nouns
  if (
    /tion$|ment$|ity$|ness$|ology$|cell|membrane|nucleus|demand|supply|biology/.test(
      clean
    )
  )
    return 'noun';
  // Common Academic Verbs
  if (/ize$|ify$|ate$|ing$|ed$|does|works|helps|read|write|learn/.test(clean))
    return 'verb';
  // Common Adjectives
  if (/ous$|ive$|ful$|less$|al$|tic$|complex|simple|smart/.test(clean))
    return 'adjective';
  // Conjunctions
  if (/and|but|or|so|because|then|if/.test(clean)) return 'conjunction';

  return 'other';
}

/**
 * Computes reading time estimate in minutes.
 */
export function estimateReadingTime(text: string, wpm = 150): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wpm);
}

/**
 * Format seconds to mm:ss
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format a date string to a readable "relative" format.
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Returns true if two strings share any tokens (for search).
 */
export function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return text.toLowerCase().includes(q);
}

/**
 * Generates a unique ID.
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
