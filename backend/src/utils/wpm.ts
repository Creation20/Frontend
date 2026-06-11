/**
 * WPM (Words Per Minute) calculation utilities.
 * Uses only "active" reading time, excluding pauses and inactivity.
 */

/**
 * Calculates WPM from words read and active seconds.
 * @param wordsRead - number of words read in the session
 * @param activeSeconds - only the time user was actively reading (pauses excluded)
 * @returns WPM rounded to one decimal, or 0 if time is 0
 */
export function calculateWpm(wordsRead: number, activeSeconds: number): number {
  if (activeSeconds <= 0 || wordsRead <= 0) return 0;
  const activeMinutes = activeSeconds / 60;
  return Math.round((wordsRead / activeMinutes) * 10) / 10;
}

/**
 * Updates a rolling history array (keeps only last N items).
 * Used for wpmHistory and comprehensionHistory (7-day rolling).
 */
export function updateRollingHistory(
  history: number[],
  newValue: number,
  maxLength = 7
): number[] {
  const updated = [...history, newValue];
  if (updated.length > maxLength) {
    return updated.slice(updated.length - maxLength);
  }
  return updated;
}

/**
 * Estimates the approximate number of words read from chunks.
 */
export function wordsInChunks(chunks: string[], fromIndex: number, toIndex: number): number {
  const slice = chunks.slice(fromIndex, toIndex + 1);
  return slice.reduce((total, chunk) => {
    return total + chunk.trim().split(/\s+/).filter(Boolean).length;
  }, 0);
}
