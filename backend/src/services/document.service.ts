import { MultipartFile } from '@fastify/multipart';
import pdf from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../lib/prisma';
import { AiService } from './ai.service';
import { chunkText, countWords, estimateReadingTime } from '../utils/chunker';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';
import { config } from '../config';

// Ensure upload directory exists
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

const COVER_COLORS = [
  '#0B6E6E', '#7C3AED', '#059669', '#D97706',
  '#DC2626', '#2563EB', '#DB2777', '#0891B2',
];

export const DocumentService = {
  /**
   * Process and store an uploaded PDF or TXT file.
   */
  async uploadDocument(
    userId: string,
    file: MultipartFile,
    metadata: { title?: string; subject?: string; author?: string; category?: string }
  ) {
    const filename = file.filename.toLowerCase();
    const isPdf = filename.endsWith('.pdf');
    const isTxt = filename.endsWith('.txt');

    if (!isPdf && !isTxt) {
      throw new ValidationError('Only PDF and TXT files are supported.');
    }

    const fileBuffer = await file.toBuffer();
    let rawContent = '';

    if (isPdf) {
      const parsed = await pdf(fileBuffer);
      rawContent = parsed.text;
    } else {
      rawContent = fileBuffer.toString('utf-8');
    }

    if (!rawContent.trim()) {
      throw new ValidationError('The uploaded file appears to be empty or unreadable.');
    }

    // AI-powered processing
    const [simplifiedContent, flashcards] = await Promise.all([
      AiService.simplifyText(rawContent.substring(0, 3000)),
      AiService.generateFlashcards(rawContent, metadata.title ?? file.filename),
    ]);

    const chunks = chunkText(rawContent, 'medium');
    const wordCount = countWords(rawContent);
    const estimatedReadingTime = estimateReadingTime(wordCount);
    const coverColor = COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];

    const document = await prisma.document.create({
      data: {
        userId,
        title: metadata.title ?? file.filename.replace(/\.[^.]+$/, ''),
        subject: metadata.subject ?? 'General',
        author: metadata.author ?? 'Unknown',
        category: (metadata.category as any) ?? 'article',
        content: rawContent,
        simplifiedContent,
        chunks,
        flashcards: flashcards as any,
        wordCount,
        pages: isPdf ? Math.ceil(wordCount / 300) : 0,
        estimatedReadingTime,
        coverColor,
      },
    });

    return document;
  },

  /**
   * Get all documents for a user (excludes deleted, includes search).
   */
  async getDocuments(userId: string, search?: string) {
    return prisma.document.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        title: true,
        subject: true,
        author: true,
        category: true,
        wordCount: true,
        pages: true,
        estimatedReadingTime: true,
        coverColor: true,
        progress: true,
        readingTime: true,
        uploadedAt: true,
        lastReadAt: true,
        // Exclude heavy fields from list view
        content: false,
        simplifiedContent: false,
        chunks: false,
      },
    });
  },

  /**
   * Get a single document (with full content) — validates ownership.
   */
  async getDocument(documentId: string, userId: string) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, deletedAt: null },
      include: { bookmarks: true, quizResults: true },
    });

    if (!doc) throw new NotFoundError('Document');
    if (doc.userId !== userId) throw new ForbiddenError();

    return doc;
  },

  /**
   * Update reading progress and time.
   */
  async updateProgress(
    documentId: string,
    userId: string,
    progress: number,
    additionalSeconds: number
  ) {
    const doc = await DocumentService.getDocument(documentId, userId);

    return prisma.document.update({
      where: { id: documentId },
      data: {
        progress: Math.min(100, Math.max(0, progress)),
        readingTime: doc.readingTime + additionalSeconds,
        lastReadAt: new Date(),
      },
    });
  },

  /**
   * Soft delete a document.
   */
  async deleteDocument(documentId: string, userId: string) {
    await DocumentService.getDocument(documentId, userId); // validates ownership

    await prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });
  },

  /**
   * Add a bookmark to a document.
   */
  async addBookmark(
    documentId: string,
    userId: string,
    chunkIndex: number,
    wordIndex: number,
    note?: string
  ) {
    await DocumentService.getDocument(documentId, userId);

    return prisma.bookmark.create({
      data: { documentId, chunkIndex, wordIndex, note },
    });
  },

  /**
   * Get or auto-generate a quiz for a document.
   */
  async getOrGenerateQuiz(documentId: string, userId: string, forceRegenerate = false) {
    const doc = await DocumentService.getDocument(documentId, userId);

    if (!forceRegenerate) {
      const existing = await prisma.quiz.findFirst({
        where: { documentId },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) return existing;
    }

    // Generate new quiz from a representative chunk
    const chunks = doc.chunks as string[];
    const midChunk = chunks[Math.floor(chunks.length / 2)] ?? doc.content.substring(0, 800);

    const questions = await AiService.generateQuiz(midChunk, doc.title, 3);

    const quiz = await prisma.quiz.create({
      data: { documentId, questions: questions as any },
    });

    return quiz;
  },

  /**
   * Save a quiz result and update user's accuracy stats.
   */
  async saveQuizResult(
    documentId: string,
    userId: string,
    quizId: string,
    score: number,
    total: number
  ) {
    return prisma.quizResult.create({
      data: { documentId, userId, quizId, score, total },
    });
  },

  /**
   * Get personalized recommendations (unread/lowest-progress first).
   */
  async getRecommendations(userId: string, limit = 3) {
    return prisma.document.findMany({
      where: { userId, deletedAt: null, progress: { lt: 100 } },
      orderBy: { progress: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        subject: true,
        estimatedReadingTime: true,
        coverColor: true,
        progress: true,
      },
    });
  },
};
