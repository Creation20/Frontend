import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';
import { config } from '../config';
import { InternalError } from '../utils/errors';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function getModel() {
  console.log(`[AI] Using model: ${config.gemini.model}`);
  // Explicitly use 'v1' instead of the default 'v1beta'
  return genAI.getGenerativeModel({
    model: config.gemini.model,
    safetySettings,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  }, { apiVersion: 'v1' });
}

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

export const AiService = {
  /**
   * Simplify text for a dyslexic reader (Gemini).
   */
  async simplifyText(text: string): Promise<string> {
    const model = getModel();
    const prompt = `You are an educational assistant helping dyslexic students aged 12-20.
Rewrite the following text in very simple, clear language. Use short sentences (max 15 words each). Avoid jargon. Keep the same meaning. Do NOT add headings or bullet points — write as plain sentences only.

TEXT:
${text}

SIMPLIFIED VERSION:`;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err: any) {
      throw new InternalError(`AI simplification failed: ${err.message}`);
    }
  },

  /**
   * Generate a TL;DR summary with Core Concept, Key Takeaways, and Conclusion.
   */
  async summarizeDocument(content: string, title: string): Promise<AISummary> {
    const model = getModel();
    const prompt = `You are an educational assistant helping dyslexic students.
Analyze this document titled "${title}" and generate a structured summary.
Respond ONLY with valid JSON in this exact format:
{
  "coreConcept": "one clear sentence explaining the main idea",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "conclusion": "one clear sentence summarizing the conclusion"
}

DOCUMENT:
${content.substring(0, 6000)}`;

    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      return JSON.parse(jsonMatch[0]) as AISummary;
    } catch (err: any) {
      throw new InternalError(`AI summarization failed: ${err.message}`);
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
    const model = getModel();

    const systemPrompt = `You are "Lexi", a friendly and patient reading assistant for students with dyslexia.
You are helping a student understand the document titled "${documentTitle}".
Always respond in simple, clear language. Be encouraging and supportive.
Use the document content below as your primary source of information.

DOCUMENT CONTENT:
${documentContent.substring(0, 5000)}

---
Answer the student's question based on this document. If the answer isn't in the document, say so kindly.`;

    const history = conversationHistory.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    try {
      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: "Hi! I'm Lexi. I've read the document and I'm ready to help you understand it. What would you like to know?" }] },
          ...history,
        ],
      });

      const result = await chat.sendMessage(userMessage);
      return result.response.text().trim();
    } catch (err: any) {
      throw new InternalError(`AI chat failed: ${err.message}`);
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
    const model = getModel();
    const prompt = `You are creating a reading comprehension quiz for dyslexic students.
Generate ${numQuestions} multiple-choice questions based on this text from "${documentTitle}".
Use simple, clear language. Each question should have 4 options.
Respond ONLY with a valid JSON array in this exact format:
[
  {
    "id": "q1",
    "question": "question text here?",
    "options": ["option A", "option B", "option C", "option D"],
    "correctIndex": 0,
    "explanation": "brief explanation of why this is correct"
  }
]

TEXT:
${chunkText}`;

    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found in response');
      const questions = JSON.parse(jsonMatch[0]) as QuizQuestion[];
      // Ensure IDs are unique
      return questions.map((q, i) => ({
        ...q,
        id: `q${Date.now()}-${i}`,
      }));
    } catch (err: any) {
      throw new InternalError(`AI quiz generation failed: ${err.message}`);
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
    const model = getModel();
    const prompt = `You are helping a dyslexic student study "${title}".
Create ${count} flashcards as key concept → definition pairs.
Keep them simple and educational. Respond ONLY with valid JSON:
[
  {
    "id": "f1",
    "front": "Term or question",
    "back": "Simple definition or answer"
  }
]

DOCUMENT:
${content.substring(0, 4000)}`;

    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found in response');
      const cards = JSON.parse(jsonMatch[0]) as Flashcard[];
      return cards.map((c, i) => ({ ...c, id: `f${Date.now()}-${i}` }));
    } catch (err: any) {
      throw new InternalError(`AI flashcard generation failed: ${err.message}`);
    }
  },

  /**
   * Generate a pronunciation breakdown (syllable + phoneme helper).
   */
  async getPronunciationGuide(word: string): Promise<{ syllables: string; phonetic: string; tips: string }> {
    const model = getModel();
    const prompt = `Break down the word "${word}" for a dyslexic student learning to read it.
Respond ONLY with valid JSON:
{
  "syllables": "syl-la-bles",
  "phonetic": "/fəˈnɛtɪk/",
  "tips": "one simple pronunciation tip"
}`;

    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      return JSON.parse(jsonMatch[0]);
    } catch {
      return { syllables: word, phonetic: '', tips: `Try sounding out each part of "${word}" slowly.` };
    }
  },
};
