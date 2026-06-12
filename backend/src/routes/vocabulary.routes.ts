import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { prisma } from '../lib/prisma';
import { DictionaryService } from '../services/dictionary.service';
import { XpService } from '../services/xp.service';
import { NotFoundError } from '../utils/errors';

const addWordSchema = z.object({
  word: z.string().min(1).max(100),
  definition: z.string().optional(),
  syllables: z.string().optional(),
  notes: z.string().max(500).optional(),
});

const updateMasterySchema = z.object({
  mastered: z.boolean(),
});

export async function vocabularyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/v1/vocabulary — List all vocab words
  app.get('/', async (request) => {
    const { filter } = request.query as { filter?: 'all' | 'mastered' | 'learning' };
    const userId = request.user.userId;

    const where: any = { userId };
    if (filter === 'mastered') where.mastered = true;
    if (filter === 'learning') where.mastered = false;

    return prisma.vocabularyWord.findMany({
      where,
      orderBy: { lastTapped: 'desc' },
    });
  });

  // ⚠️ IMPORTANT: /challenge MUST be registered BEFORE /:word/mastery
  // Otherwise Fastify will match "challenge" as the :word parameter.
  // GET /api/v1/vocabulary/challenge — Get random unmastered words for the game
  app.get('/challenge', async (request) => {
    const userId = request.user.userId;

    const words = await prisma.vocabularyWord.findMany({
      where: { userId, mastered: false },
      orderBy: { lastTapped: 'desc' },
      take: 20,
    });

    // Pick up to 5 random words from the pool
    const shuffled = words.sort(() => Math.random() - 0.5).slice(0, 5);

    if (shuffled.length < 2) {
      // Not enough unmastered words — include mastered ones to fill up
      const mastered = await prisma.vocabularyWord.findMany({
        where: { userId, mastered: true },
        take: 5 - shuffled.length,
      });
      shuffled.push(...mastered);
    }

    return { words: shuffled };
  });

  // POST /api/v1/vocabulary — Add or increment a word
  app.post('/', async (request, reply) => {
    const body = addWordSchema.parse(request.body);
    const userId = request.user.userId;

    let definition = body.definition;
    let syllables = body.syllables;

    // Auto-look up definition if not provided
    if (!definition || !syllables) {
      try {
        const dictResult = await DictionaryService.lookup(body.word);
        definition = definition ?? dictResult.definition;
        syllables = syllables ?? dictResult.syllables;
      } catch {
        // Dictionary lookup failed — use placeholders
        definition = definition ?? 'Definition not available.';
        syllables = syllables ?? body.word;
      }
    }

    // Upsert: increment tappedCount if word already exists
    const existing = await prisma.vocabularyWord.findUnique({
      where: { userId_word: { userId, word: body.word.toLowerCase() } },
    });

    if (existing) {
      const updated = await prisma.vocabularyWord.update({
        where: { userId_word: { userId, word: body.word.toLowerCase() } },
        data: {
          tappedCount: { increment: 1 },
          lastTapped: new Date(),
          notes: body.notes ?? existing.notes,
        },
      });
      return reply.send(updated);
    }

    const word = await prisma.vocabularyWord.create({
      data: {
        userId,
        word: body.word.toLowerCase(),
        definition: definition ?? 'Definition not available.',
        syllables: syllables ?? body.word,
        notes: body.notes,
      },
    });

    return reply.status(201).send(word);
  });

  // PATCH /api/v1/vocabulary/:word/mastery — Toggle mastery
  // NOTE: This must come AFTER /challenge to avoid route conflict
  app.patch('/:word/mastery', async (request) => {
    const { word } = request.params as { word: string };
    const { mastered } = updateMasterySchema.parse(request.body);
    const userId = request.user.userId;

    const vocabWord = await prisma.vocabularyWord.findUnique({
      where: { userId_word: { userId, word: word.toLowerCase() } },
    });

    if (!vocabWord) throw new NotFoundError('Vocabulary word');

    const updated = await prisma.vocabularyWord.update({
      where: { userId_word: { userId, word: word.toLowerCase() } },
      data: { mastered },
    });

    let xpResult = null;
    if (mastered && !vocabWord.mastered) {
      // Award +50 XP only when newly mastering a word
      xpResult = await XpService.awardXp(userId, 'VOCAB_MASTERY');
    }

    return {
      word: updated,
      xpAwarded: xpResult?.xpAwarded ?? 0,
      newXp: xpResult?.newXp,
      leveledUp: xpResult?.leveledUp ?? false,
    };
  });
}