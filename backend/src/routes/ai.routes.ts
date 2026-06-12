import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { AiService } from '../services/ai.service';
import { DictionaryService } from '../services/dictionary.service';
import { OcrService } from '../services/ocr.service';
import { DocumentService } from '../services/document.service';
import { XpService } from '../services/xp.service';
import { chunkText } from '../utils/chunker';
import { ValidationError } from '../utils/errors';

const simplifySchema = z.object({
  text: z.string().min(10).max(10000),
});

const summarizeSchema = z.object({
  documentId: z.string().min(1),
});

const chatSchema = z.object({
  documentId: z.string().min(1),
  message: z.string().min(1).max(1000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).default([]),
});

const generateQuizSchema = z.object({
  documentId: z.string().min(1),
  chunkIndex: z.number().int().min(0).optional(),
  numQuestions: z.number().int().min(1).max(5).default(3),
});

const ocrSchema = z.object({
  image: z.string().min(100, 'image must be a valid base64 string'),
  autoSimplify: z.boolean().default(true),
});

export async function aiRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // POST /api/v1/ai/simplify — Simplify any text
  app.post('/simplify', async (request) => {
    const { text } = simplifySchema.parse(request.body);
    const simplified = await AiService.simplifyText(text);
    return { original: text, simplified };
  });

  // POST /api/v1/ai/summarize — TL;DR for a document
  app.post('/summarize', async (request) => {
    const { documentId } = summarizeSchema.parse(request.body);
    const doc = await DocumentService.getDocument(documentId, request.user.userId);
    const summary = await AiService.summarizeDocument(doc.content, doc.title);

    // Award XP for generating a summary
    const xpResult = await XpService.awardXp(request.user.userId, 'SUMMARY_GENERATED');

    return {
      summary,
      xpAwarded: xpResult.xpAwarded,
    };
  });

  // POST /api/v1/ai/chat — Ask Lexi about a document
  app.post('/chat', async (request) => {
    const { documentId, message, history } = chatSchema.parse(request.body);
    const doc = await DocumentService.getDocument(documentId, request.user.userId);
    const response = await AiService.chat(
      doc.content,
      doc.title,
      message,
      history
    );
    return { response };
  });

  // POST /api/v1/ai/generate-quiz — Force regenerate quiz
  app.post('/generate-quiz', async (request) => {
    const { documentId, chunkIndex, numQuestions } = generateQuizSchema.parse(request.body);
    const doc = await DocumentService.getDocument(documentId, request.user.userId);

    const chunks = doc.chunks as string[];
    const targetChunk = chunkIndex !== undefined
      ? chunks[chunkIndex] ?? doc.content.substring(0, 800)
      : chunks[Math.floor(chunks.length / 2)] ?? doc.content.substring(0, 800);

    const questions = await AiService.generateQuiz(targetChunk, doc.title, numQuestions);
    return { questions };
  });

  // GET /api/v1/ai/word/:word — Word definition + pronunciation
  app.get('/word/:word', async (request) => {
    const { word } = request.params as { word: string };
    if (!word || word.length > 50) throw new ValidationError('Invalid word.');

    const [dictResult, aiResult] = await Promise.all([
      DictionaryService.lookup(word),
      AiService.getDyslexicWordInfo(word),
    ]);

    return {
      ...dictResult,
      // Prioritize AI simplified definition for better dyslexic experience
      definition: aiResult.definition || dictResult.definition,
      syllables: aiResult.syllables || dictResult.syllables,
      phonetic: aiResult.phonetic || dictResult.phonetic,
      pronunciationTips: aiResult.tips,
      etymology: aiResult.etymology || dictResult.etymology,
    };
  });

  // POST /api/v1/ai/scan — OCR image + auto-simplify
  app.post('/scan', async (request, reply) => {
    const { image, autoSimplify } = ocrSchema.parse(request.body);

    const ocrResult = await OcrService.extractText(image);

    if (!ocrResult.text || ocrResult.text.length < 10) {
      throw new ValidationError('Could not extract readable text from the image. Please try a clearer photo.');
    }

    let simplifiedText = '';
    if (autoSimplify) {
      simplifiedText = await AiService.simplifyText(ocrResult.text);
    }

    // Award +100 XP for scanning
    const xpResult = await XpService.awardXp(request.user.userId, 'SCAN');

    return reply.status(200).send({
      extractedText: ocrResult.text,
      confidence: ocrResult.confidence,
      simplifiedText,
      xpAwarded: xpResult.xpAwarded,
      newXp: xpResult.newXp,
      newLevel: xpResult.newLevel,
      leveledUp: xpResult.leveledUp,
    });
  });

  // POST /api/v1/ai/pronunciation — Get pronunciation guide for a word
  app.post('/pronunciation', async (request) => {
    const { word } = z.object({ word: z.string().min(1).max(50) }).parse(request.body);
    return AiService.getPronunciationGuide(word);
  });

  // POST /api/v1/ai/pronounce/verify — AI Verify user pronunciation
  app.post('/pronounce/verify', async (request) => {
    const file = await request.file();
    if (!file) throw new ValidationError('No audio file uploaded.');

    // Word is passed in fields
    const word = (file as any).fields?.word?.value;
    if (!word) throw new ValidationError('Target word is required.');

    const buffer = await file.toBuffer();
    const result = await AiService.verifyPronunciation(buffer, word);

    // Award XP if correct
    if (result.isCorrect) {
      await XpService.awardXp(request.user.userId, 'VOCAB_CHALLENGE_CORRECT', 25);
    }

    return result;
  });
}
