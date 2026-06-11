import NodeCache from 'node-cache';

interface DictionaryPhonetic {
  text?: string;
  audio?: string;
}

interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
}

interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics?: DictionaryPhonetic[];
  meanings?: DictionaryMeaning[];
  origin?: string;
}

export interface WordInfo {
  word: string;
  definition: string;
  syllables: string;
  phonetic: string;
  etymology: string;
  partOfSpeech: string;
  example: string;
}

// Cache word lookups for 24 hours (86400 seconds)
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

const BASE_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

export const DictionaryService = {
  /**
   * Look up a word from the Free Dictionary API.
   * Results are cached for 24 hours to minimize API calls.
   */
  async lookup(word: string): Promise<WordInfo> {
    const cacheKey = `word:${word.toLowerCase()}`;

    // Check cache first
    const cached = cache.get<WordInfo>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${BASE_URL}/${encodeURIComponent(word.toLowerCase())}`);

      if (!response.ok) {
        // Word not found — return a minimal result
        return DictionaryService._fallback(word);
      }

      const data = (await response.json()) as DictionaryEntry[];
      const entry = data[0];

      if (!entry) return DictionaryService._fallback(word);

      const firstMeaning = entry.meanings?.[0];
      const firstDef = firstMeaning?.definitions?.[0];

      // Generate syllables from word (simple heuristic)
      const syllables = DictionaryService._syllabify(word);

      const result: WordInfo = {
        word: entry.word,
        definition: firstDef?.definition ?? 'Definition not available.',
        syllables,
        phonetic: entry.phonetic ?? entry.phonetics?.[0]?.text ?? '',
        etymology: entry.origin ?? '',
        partOfSpeech: firstMeaning?.partOfSpeech ?? '',
        example: firstDef?.example ?? '',
      };

      cache.set(cacheKey, result);
      return result;
    } catch {
      return DictionaryService._fallback(word);
    }
  },

  _fallback(word: string): WordInfo {
    return {
      word,
      definition: 'Definition not available at the moment.',
      syllables: DictionaryService._syllabify(word),
      phonetic: '',
      etymology: '',
      partOfSpeech: '',
      example: '',
    };
  },

  /**
   * Simple syllabification heuristic based on vowel groups.
   * Good enough for UI display — not linguistically perfect.
   */
  _syllabify(word: string): string {
    const lower = word.toLowerCase();
    const vowels = 'aeiouy';
    let result = '';
    let prevWasVowel = false;
    let syllableCount = 0;

    for (let i = 0; i < lower.length; i++) {
      const isVowel = vowels.includes(lower[i]);

      if (isVowel && !prevWasVowel && i > 0 && syllableCount > 0) {
        // Insert syllable break before this vowel group
        result += '-';
        syllableCount = 0;
      }

      result += lower[i];
      prevWasVowel = isVowel;
      if (isVowel) syllableCount++;
    }

    return result || word;
  },
};
