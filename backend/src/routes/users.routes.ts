import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { prisma } from '../lib/prisma';
import { XpService, XpActivity } from '../services/xp.service';
import { NotFoundError } from '../utils/errors';

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).max(30).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  dailyGoalMinutes: z.number().int().min(5).max(480).optional(),
});

const awardXpSchema = z.object({
  activity: z.enum([
    'QUIZ_CORRECT', 'QUIZ_COMPLETE', 'SCAN', 'VOCAB_MASTERY',
    'VOCAB_CHALLENGE_CORRECT', 'VOCAB_CHALLENGE_COMPLETE', 'SUMMARY_GENERATED',
  ]).optional(),
  customAmount: z.number().int().positive().optional(),
});

const awardBadgeSchema = z.object({
  badgeId: z.string().min(1),
});

export async function userRoutes(app: FastifyInstance) {
  // All user routes require authentication
  app.addHook('preHandler', authenticate);

  // GET /api/v1/users/me — Full user profile
  app.get('/me', async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user.userId },
      include: {
        badges: true,
        vocabulary: { orderBy: { lastTapped: 'desc' } },
        settings: true,
      },
    });

    const { passwordHash, ...safe } = user as any;
    return safe;
  });

  // PATCH /api/v1/users/me — Update profile
  app.patch('/me', async (request) => {
    const body = updateUserSchema.parse(request.body);
    const updated = await prisma.user.update({
      where: { id: request.user.userId },
      data: body,
      select: {
        id: true, name: true, username: true, email: true,
        level: true, xp: true, streak: true, avatarUrl: true,
        dailyGoalMinutes: true,
      },
    });
    return updated;
  });

  // GET /api/v1/users/me/stats — Performance stats
  app.get('/me/stats', async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.user.userId },
      select: {
        level: true, xp: true, streak: true, totalReadingTime: true,
        wpmHistory: true, comprehensionHistory: true, bestReadingTime: true,
        dailyGoalMinutes: true,
      },
    });

    const wpmHistory = (user.wpmHistory as number[]) ?? [];
    const compHistory = (user.comprehensionHistory as number[]) ?? [];

    const avgWpm = wpmHistory.length
      ? Math.round(wpmHistory.reduce((a, b) => a + b, 0) / wpmHistory.length)
      : 0;

    const avgAccuracy = compHistory.length
      ? Math.round(compHistory.reduce((a, b) => a + b, 0) / compHistory.length)
      : 0;

    const todayReadingMinutes = await getTodayReadingMinutes(request.user.userId);

    return {
      ...user,
      averageWpm: avgWpm,
      averageAccuracy: avgAccuracy,
      todayReadingMinutes,
    };
  });

  // POST /api/v1/users/me/xp — Award XP
  app.post('/me/xp', async (request) => {
    const { activity, customAmount } = awardXpSchema.parse(request.body);
    const result = await XpService.awardXp(
      request.user.userId,
      (activity as any) || 'READING_SESSION',
      customAmount
    );
    return {
      message: `+${result.xpAwarded} XP awarded.`,
      ...result,
    };
  });

  // POST /api/v1/users/me/badge — Award badge
  app.post('/me/badge', async (request) => {
    const { badgeId } = awardBadgeSchema.parse(request.body);
    const awarded = await XpService.awardBadge(request.user.userId, badgeId);
    return {
      awarded,
      message: awarded
        ? `Badge "${badgeId}" earned!`
        : `You already have the "${badgeId}" badge.`,
    };
  });
}

// Helper: today's total reading time in minutes
async function getTodayReadingMinutes(userId: string): Promise<number> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const sessions = await prisma.sessionLog.findMany({
    where: {
      userId,
      recordedAt: { gte: todayStart },
    },
    select: { elapsedSeconds: true },
  });

  const totalSeconds = sessions.reduce((sum, s) => sum + s.elapsedSeconds, 0);
  return Math.floor(totalSeconds / 60);
}
