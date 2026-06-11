import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { prisma } from '../lib/prisma';
import { calculateWpm } from '../utils/wpm';
import { XpService } from '../services/xp.service';
import { StreakService } from '../services/streak.service';
import { ReportService } from '../services/report.service';

const sessionSchema = z.object({
  documentId: z.string().optional(),
  elapsedSeconds: z.number().int().min(0),
  wordsRead: z.number().int().min(0),
  accuracy: z.number().min(0).max(100).default(0),
});

export async function performanceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // POST /api/v1/performance/session — End a reading session
  app.post('/session', async (request, reply) => {
    const body = sessionSchema.parse(request.body);
    const userId = request.user.userId;

    const wpm = calculateWpm(body.wordsRead, body.elapsedSeconds);

    // 1. Save session log
    const sessionLog = await prisma.sessionLog.create({
      data: {
        userId,
        documentId: body.documentId,
        elapsedSeconds: body.elapsedSeconds,
        wordsRead: body.wordsRead,
        wpm,
        accuracy: body.accuracy,
      },
    });

    // 2. Update streak (idempotent — safe to call multiple times per day)
    const streakResult = await StreakService.updateStreak(userId);

    // 3. Accumulate total reading time
    await StreakService.addReadingTime(userId, body.elapsedSeconds);

    // 4. Update rolling WPM + comprehension history
    await XpService.updatePerformanceHistory(userId, wpm, body.accuracy);

    // 5. Award XP for words read (1 XP per word)
    const xpResult = await XpService.awardReadingXp(userId, body.wordsRead);

    // 6. Check for badge unlocks
    const newBadges = await XpService.checkAndAwardBadges(userId);

    return reply.status(201).send({
      sessionLog,
      wpm,
      streak: streakResult.streak,
      streakMaintained: streakResult.streakMaintained,
      xpAwarded: xpResult?.xpAwarded ?? 0,
      newXp: xpResult?.newXp,
      leveledUp: xpResult?.leveledUp ?? false,
      newBadges,
    });
  });

  // GET /api/v1/performance/weekly-wpm — 7-day WPM history
  app.get('/weekly-wpm', async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user.userId },
      select: { wpmHistory: true, comprehensionHistory: true },
    });

    return {
      wpmHistory: (user.wpmHistory as number[]) ?? [],
      comprehensionHistory: (user.comprehensionHistory as number[]) ?? [],
    };
  });

  // GET /api/v1/performance/report — Full progress report
  app.get('/report', async (request) => {
    return ReportService.generateReport(request.user.userId);
  });

  // GET /api/v1/performance/sessions — Session logs (paginated)
  app.get('/sessions', async (request) => {
    const { limit = '20', offset = '0' } = request.query as {
      limit?: string;
      offset?: string;
    };

    const sessions = await prisma.sessionLog.findMany({
      where: { userId: request.user.userId },
      orderBy: { recordedAt: 'desc' },
      take: Math.min(Number(limit), 100),
      skip: Number(offset),
      include: {
        document: { select: { id: true, title: true } },
      },
    });

    return { sessions };
  });
}
