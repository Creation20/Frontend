import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { DocumentService } from '../services/document.service';
import { XpService } from '../services/xp.service';
import { ValidationError } from '../utils/errors';

const updateProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  additionalSeconds: z.number().int().min(0).default(0),
});

const addBookmarkSchema = z.object({
  chunkIndex: z.number().int().min(0),
  wordIndex: z.number().int().min(0).default(0),
  note: z.string().max(500).optional(),
});

const uploadMetaSchema = z.object({
  title: z.string().max(200).optional(),
  subject: z.string().max(100).optional(),
  author: z.string().max(100).optional(),
  category: z.enum(['lecture', 'article', 'textbook', 'personal']).optional(),
});

const quizResultSchema = z.object({
  quizId: z.string(),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  correctAnswers: z.number().int().min(0).optional(),
});

export async function documentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/v1/documents — List all documents
  app.get('/', async (request) => {
    const { q } = request.query as { q?: string };
    return DocumentService.getDocuments(request.user.userId, q);
  });

  // GET /api/v1/documents/recommendations — Personalized recommendations
  app.get('/recommendations', async (request) => {
    const { limit } = request.query as { limit?: string };
    return DocumentService.getRecommendations(request.user.userId, Number(limit) || 3);
  });

  // POST /api/v1/documents — Upload PDF or TXT
  app.post('/', async (request, reply) => {
    const file = await request.file();
    if (!file) throw new ValidationError('No file uploaded.');

    // Parse optional metadata fields from the multipart form
    const metaFields: Record<string, string> = {};
    // Fields come before file in multipart — collect from file.fields
    const fields = (file as any).fields ?? {};
    for (const [key, val] of Object.entries(fields)) {
      if (key !== 'file' && (val as any)?.value) {
        metaFields[key] = (val as any).value;
      }
    }

    const metadata = uploadMetaSchema.parse(metaFields);
    const document = await DocumentService.uploadDocument(
      request.user.userId,
      file,
      metadata
    );

    return reply.status(201).send({
      message: 'Document uploaded and processed successfully.',
      document,
    });
  });

  // GET /api/v1/documents/:id — Get single document with full content
  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    return DocumentService.getDocument(id, request.user.userId);
  });

  // PATCH /api/v1/documents/:id/progress — Update reading progress
  app.patch('/:id/progress', async (request) => {
    const { id } = request.params as { id: string };
    const body = updateProgressSchema.parse(request.body);
    return DocumentService.updateProgress(
      id,
      request.user.userId,
      body.progress,
      body.additionalSeconds
    );
  });

  // DELETE /api/v1/documents/:id — Soft delete
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await DocumentService.deleteDocument(id, request.user.userId);
    return reply.send({ message: 'Document deleted.' });
  });

  // POST /api/v1/documents/:id/bookmark — Add bookmark
  app.post('/:id/bookmark', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = addBookmarkSchema.parse(request.body);
    const bookmark = await DocumentService.addBookmark(
      id,
      request.user.userId,
      body.chunkIndex,
      body.wordIndex,
      body.note
    );
    return reply.status(201).send(bookmark);
  });

  // GET /api/v1/documents/:id/quiz — Get (or auto-generate) quiz
  app.get('/:id/quiz', async (request) => {
    const { id } = request.params as { id: string };
    const { regenerate } = request.query as { regenerate?: string };
    return DocumentService.getOrGenerateQuiz(
      id,
      request.user.userId,
      regenerate === 'true'
    );
  });

  // GET /api/v1/documents/:id/flashcards — Get flashcards
  app.get('/:id/flashcards', async (request) => {
    const { id } = request.params as { id: string };
    const doc = await DocumentService.getDocument(id, request.user.userId);
    return { flashcards: doc.flashcards };
  });

  // POST /api/v1/documents/:id/quiz-result — Save quiz result
  app.post('/:id/quiz-result', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = quizResultSchema.parse(request.body);

    const result = await DocumentService.saveQuizResult(
      id,
      request.user.userId,
      body.quizId,
      body.score,
      body.total
    );

    // Award XP: 30 per correct answer + 50 completion bonus
    const correctAnswers = body.correctAnswers ?? body.score;
    let totalXpAwarded = 0;

    if (correctAnswers > 0) {
      const xp1 = await XpService.awardXp(
        request.user.userId,
        'QUIZ_CORRECT',
        correctAnswers * 30
      );
      totalXpAwarded += xp1.xpAwarded;
    }

    const xp2 = await XpService.awardXp(request.user.userId, 'QUIZ_COMPLETE');
    totalXpAwarded += xp2.xpAwarded;

    // Check for new badges
    const newBadges = await XpService.checkAndAwardBadges(request.user.userId);

    return reply.status(201).send({
      result,
      xpAwarded: totalXpAwarded,
      newBadges,
    });
  });
}
