/**
 * Semantic sentence-based text chunker.
 * Splits text into chunks of 1–3 sentences based on the chunkSize setting.
 */

const SENTENCES_PER_CHUNK: Record<'small' | 'medium' | 'large', number> = {
  small: 1,
  medium: 2,
  large: 3,
};

/**
 * Splits a text string into an array of sentence chunks.
 * Uses a regex that respects common abbreviations (e.g., "Dr.", "Fig.").
 */
export function chunkText(
  text: string,
  chunkSize: 'small' | 'medium' | 'large' = 'medium'
): string[] {
  // Clean up whitespace
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  // Split into sentences — respects "Dr.", "Fig.", "e.g.", etc.
  const sentenceRegex = /(?<!\b(?:Dr|Mr|Mrs|Ms|Prof|Fig|etc|Jr|Sr|vs|approx|ca|vol|no|dept|est|tel|fax|ref|p|pp|vs|i\.e|e\.g))\.\s+(?=[A-Z])|[!?]+\s+(?=[A-Z"'])/g;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = sentenceRegex.exec(cleaned)) !== null) {
    const sentence = cleaned.slice(lastIndex, match.index + match[0].search(/\s/)).trim();
    if (sentence.length > 0) sentences.push(sentence);
    lastIndex = match.index + match[0].length;
  }

  // Push the last remaining piece
  const remaining = cleaned.slice(lastIndex).trim();
  if (remaining.length > 0) sentences.push(remaining);

  if (sentences.length === 0) return [cleaned];

  // Group sentences into chunks
  const groupSize = SENTENCES_PER_CHUNK[chunkSize];
  const chunks: string[] = [];

  for (let i = 0; i < sentences.length; i += groupSize) {
    const group = sentences.slice(i, i + groupSize).join(' ');
    if (group.trim().length > 0) chunks.push(group.trim());
  }

  return chunks.length > 0 ? chunks : [cleaned];
}

/**
 * Counts the total number of words in a text string.
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Estimates reading time in minutes given word count and average WPM.
 */
export function estimateReadingTime(wordCount: number, avgWpm = 130): number {
  return Math.ceil(wordCount / avgWpm);
}
