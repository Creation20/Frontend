/**
 * AI Service — powered by Groq (FREE tier)
 *
 * Free tier details:
 *  - 14,400 requests/day
 *  - 6,000 tokens/minute
 *  - No credit card required
 *  - Sign up at: https://console.groq.com
 *
 * Models used:
 *  - llama-3.3-70b-versatile  → complex tasks (quiz, summary, chat, flashcards)
 *  - llama-3.1-8b-instant     → fast tasks (simplify, pronunciation, word def)
 *
 * Groq is OpenAI-compatible, so we use the standard fetch API directly
 * (no SDK needed, reducing dependencies).
 */

import { config } from '../config';
import { InternalError } from '../utils/errors';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AISummary {
  coreConcept: string;
  keyTakeaways: string[];
  conclusion: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function groqChat(
  messages: GroqMessage[],
  options: {
    model?: 'fast' | 'smart';
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const model =
    options.model === 'fast'
      ? config.groq.fastModel
      : config.groq.model;

  const response = await fetch(`${config.groq.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.groq.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new InternalError(`Groq API error (${response.status}): ${err}`);
  }

  const data = (await response.json()) as GroqResponse;
  const text = data.choices?.[0]?.message?.content ?? '';

  if (!text) {
    throw new InternalError('Groq returned an empty response.');
  }

  return text.trim();
}

// ─── JSON extraction helper ───────────────────────────────────────────────────

function extractJson<T>(raw: string): T {
  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to find JSON object or array within the text
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);

    if (arrMatch) {
      try {
        return JSON.parse(arrMatch[0]) as T;
      } catch {}
    }

    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]) as T;
      } catch {}
    }

    throw new Error(`Could not parse JSON from: ${cleaned.slice(0, 200)}`);
  }
}

// ─── AI Service ───────────────────────────────────────────────────────────────

export const AiService = {
  /**
   * Simplify text for a dyslexic reader.
   * Uses the fast model (8B) — good enough for simplification.
   */
  async simplifyText(text: string): Promise<string> {
    try {
      const result = await groqChat(
        [
          {
            role: 'system',
            content:
              'You are an educational assistant helping dyslexic students aged 12-20. ' +
              'Rewrite text in very simple, clear language. Use short sentences (max 15 words each). ' +
              'Avoid jargon. Keep the same meaning. Write as plain sentences only — no headings or bullet points.',
          },
          {
            role: 'user',
            content: `Rewrite this text in simple language:\n\n${text}`,
          },
        ],
        { model: 'fast', temperature: 0.4, maxTokens: 1500 }
      );
      return result;
    } catch (err: any) {
      console.error('[AI] simplifyText failed:', err.message);
      // Return original text as fallback — don't block the user
      return text;
    }
  },

  /**
   * Generate a TL;DR summary with Core Concept, Key Takeaways, and Conclusion.
   * Uses the smart model for better quality.
   */
  async summarizeDocument(content: string, title: string): Promise<AISummary> {
    const truncated = content.substring(0, 6000);

    try {
      const raw = await groqChat(
        [
          {
            role: 'system',
            content:
              'You are an educational assistant helping dyslexic students. ' +
              'You MUST respond with ONLY valid JSON — no markdown, no explanation, just JSON.',
          },
          {
            role: 'user',
            content:
              `Analyze the document titled "${title}" and return a JSON summary in this EXACT format:\n` +
              `{"coreConcept":"one clear sentence","keyTakeaways":["takeaway 1","takeaway 2","takeaway 3"],"conclusion":"one clear sentence"}\n\n` +
              `DOCUMENT:\n${truncated}`,
          },
        ],
        { model: 'smart', temperature: 0.5, maxTokens: 800 }
      );

      return extractJson<AISummary>(raw);
    } catch (err: any) {
      console.error('[AI] summarizeDocument failed:', err.message);
      // Fallback summary
      return {
        coreConcept: `This document covers key topics related to "${title}".`,
        keyTakeaways: [
          'Read carefully for key concepts.',
          'Use the focus ruler to stay on track.',
          'Ask Lexi if you have questions.',
        ],
        conclusion: 'Review this document to strengthen your understanding.',
      };
    }
  },

  /**
   * Context-aware document chat (Ask Lexi).
   */
  async chat(
    documentContent: string,
    documentTitle: string,
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'model'; text: string }>
  ): Promise<string> {
    const truncatedContent = documentContent.substring(0, 4000);

    const messages: GroqMessage[] = [
      {
        role: 'system',
        content:
          `You are "Lexi", a friendly and patient reading assistant for students with dyslexia. ` +
          `You are helping a student understand the document titled "${documentTitle}". ` +
          `Always respond in simple, clear language. Be encouraging and supportive. ` +
          `Use the document content as your primary source. If the answer isn't in the document, say so kindly.\n\n` +
          `DYSLEXIA-FRIENDLY GUIDELINES:\n` +
          `- Use short sentences (max 12 words).\n` +
          `- Use bullet points for lists.\n` +
          `- Use simple analogies for complex concepts.\n` +
          `- Avoid walls of text; keep paragraphs to 1-2 sentences.\n` +
          `- Your response will be formatted with Bionic Reading (bolded prefixes).\n\n` +
          `DOCUMENT CONTENT:\n${truncatedContent}`,
      },
    ];

    // Add conversation history (convert 'model' role to 'assistant' for OpenAI compat)
    for (const msg of conversationHistory.slice(-10)) {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text,
      });
    }

    messages.push({ role: 'user', content: userMessage });

    try {
      return await groqChat(messages, {
        model: 'smart',
        temperature: 0.7,
        maxTokens: 1000,
      });
    } catch (err: any) {
      console.error('[AI] chat failed:', err.message);
      return "I'm sorry, I'm having a little trouble right now. Please try again in a moment!";
    }
  },

  /**
   * Generate comprehension quiz questions for a chunk of text.
   */
  async generateQuiz(
    chunkText: string,
    documentTitle: string,
    numQuestions = 3
  ): Promise<QuizQuestion[]> {
    try {
      const raw = await groqChat(
        [
          {
            role: 'system',
            content:
              'You are creating reading comprehension quizzes for dyslexic students. ' +
              'You MUST respond with ONLY a valid JSON array — no markdown, no explanation.',
          },
          {
            role: 'user',
            content:
              `Generate ${numQuestions} multiple-choice questions about this text from "${documentTitle}". ` +
              `Use simple, clear language. Each question has 4 options.\n` +
              `Return ONLY this JSON array format:\n` +
              `[{"id":"q1","question":"?","options":["A","B","C","D"],"correctIndex":0,"explanation":"why"}]\n\n` +
              `TEXT:\n${chunkText}`,
          },
        ],
        { model: 'smart', temperature: 0.6, maxTokens: 1200 }
      );

      const questions = extractJson<QuizQuestion[]>(raw);

      return questions.map((q, i) => ({
        ...q,
        id: `q${Date.now()}-${i}`,
      }));
    } catch (err: any) {
      console.error('[AI] generateQuiz failed:', err.message);
      // Return a safe fallback quiz
      return [
        {
          id: `q${Date.now()}-0`,
          question: `What is the main topic discussed in this section of "${documentTitle}"?`,
          options: [
            'The introduction of key concepts',
            'A comparison of different theories',
            'A historical timeline of events',
            'A practical application guide',
          ],
          correctIndex: 0,
          explanation: 'This section introduces the key concepts of the topic.',
        },
      ];
    }
  },

  /**
   * Auto-generate flashcards from document content.
   */
  async generateFlashcards(
    content: string,
    title: string,
    count = 5
  ): Promise<Flashcard[]> {
    const truncated = content.substring(0, 3500);

    try {
      const raw = await groqChat(
        [
          {
            role: 'system',
            content:
              'You are helping a dyslexic student study. ' +
              'You MUST respond with ONLY a valid JSON array — no markdown, no explanation.',
          },
          {
            role: 'user',
            content:
              `Create ${count} simple flashcards for "${title}". ` +
              `Return ONLY this JSON array format:\n` +
              `[{"id":"f1","front":"Term or question","back":"Simple definition or answer"}]\n\n` +
              `DOCUMENT:\n${truncated}`,
          },
        ],
        { model: 'fast', temperature: 0.5, maxTokens: 800 }
      );

      const cards = extractJson<Flashcard[]>(raw);
      return cards.map((c, i) => ({ ...c, id: `f${Date.now()}-${i}` }));
    } catch (err: any) {
      console.error('[AI] generateFlashcards failed:', err.message);
      // Return minimal fallback cards
      return [
        {
          id: `f${Date.now()}-0`,
          front: `What is the main subject of "${title}"?`,
          back: 'Review the document to identify the core subject.',
        },
        {
          id: `f${Date.now()}-1`,
          front: 'What are the key terms to remember?',
          back: 'Tap difficult words while reading to build your vocabulary list.',
        },
      ];
    }
  },

  /**
   * Generate a dyslexic-friendly breakdown for a word.
   * Includes simple definition, syllables, phonetic, and tips.
   */
  async getDyslexicWordInfo(
    word: string
  ): Promise<{ definition: string; syllables: string; phonetic: string; tips: string; etymology: string }> {
    try {
      const raw = await groqChat(
        [
          {
            role: 'system',
            content:
              'You help dyslexic students (ages 12-20) understand complex words. ' +
              'Always use very simple language, analogies, and short sentences. ' +
              'You MUST respond with ONLY valid JSON — no markdown, no explanation.',
          },
          {
            role: 'user',
            content:
              `Break down the word "${word}" for a dyslexic student.\n` +
              `Return ONLY this JSON format:\n` +
              `{\n` +
              `  "definition": "simple explanation with an analogy",\n` +
              `  "syllables": "syl-la-bles",\n` +
              `  "phonetic": "/fəˈnɛtɪk/",\n` +
              `  "tips": "one simple tip to remember or say it",\n` +
              `  "etymology": "very simple origin (e.g. Greek for 'skin')"\n` +
              `}\n`,
          },
        ],
        { model: 'fast', temperature: 0.3, maxTokens: 400 }
      );

      return extractJson<{ definition: string; syllables: string; phonetic: string; tips: string; etymology: string }>(raw);
    } catch {
      // Simple fallback
      return {
        definition: 'A term you might see in your reading.',
        syllables: word,
        phonetic: '',
        tips: `Try sounding out "${word}" slowly.`,
        etymology: '',
      };
    }
  },

  /**
   * Verify if the user's spoken audio matches the target word.

      * Uses Groq Whisper for transcription and Llama for evaluation.
      */
      async verifyPronunciation(
      audioBuffer: Buffer,
      targetWord: string
      ): Promise<{ isCorrect: boolean; feedback: string; transcript: string }> {
      try {
      // 1. Transcribe audio using Groq Whisper
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer]), 'recording.m4a');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('response_format', 'json');

      const whisperResponse = await fetch(`${config.groq.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.groq.apiKey}`,
        },
        body: formData,
      });

      if (!whisperResponse.ok) {
        const err = await whisperResponse.text();
        throw new Error(`Whisper API error: ${err}`);
      }

      const whisperData = (await whisperResponse.json()) as { text: string };
      const transcript = whisperData.text.trim().toLowerCase().replace(/[.,!?]/g, '');

      // 2. Use Llama to evaluate if it's "close enough" (educational leniency)
      const raw = await groqChat(
        [
          {
            role: 'system',
            content:
              'You are an expert speech therapist for dyslexic children. ' +
              'You MUST respond with ONLY valid JSON — no markdown, no explanation.',
          },
          {
            role: 'user',
            content:
              `Target word: "${targetWord}"\n` +
              `User said: "${transcript}"\n\n` +
              `Evaluate if the user pronounced the word correctly or very close to it. ` +
              `Return JSON in this format:\n` +
              `{"isCorrect": boolean, "feedback": "one very short encouraging tip or praise"}\n`,
          },
        ],
        { model: 'fast', temperature: 0.2, maxTokens: 200 }
      );

      const evaluation = extractJson<{ isCorrect: boolean; feedback: string }>(raw);

      return {
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.feedback,
        transcript: whisperData.text,
      };
      } catch (err: any) {
      console.error('[AI] verifyPronunciation failed:', err.message);
      return {
        isCorrect: false,
        feedback: "I couldn't hear that clearly. Try again!",
        transcript: '',
      };
      }
      },
      };