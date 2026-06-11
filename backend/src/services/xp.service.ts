import { prisma } from '../lib/prisma';
import { config } from '../config';
import { updateRollingHistory } from '../utils/wpm';

const XP_PER_LEVEL = config.levels.xpPerLevel;

export type XpActivity =
  | 'READING_SESSION'
  | 'QUIZ_CORRECT'
  | 'QUIZ_COMPLETE'
  | 'SCAN'
  | 'VOCAB_MASTERY'
  | 'VOCAB_CHALLENGE_CORRECT'
  | 'VOCAB_CHALLENGE_COMPLETE'
  | 'SUMMARY_GENERATED';

const XP_MAP: Record<XpActivity, number> = {
  READING_SESSION: 0, // Calculated per word
  QUIZ_CORRECT: config.xp.perQuizCorrect,
  QUIZ_COMPLETE: config.xp.quizCompletionBonus,
  SCAN: config.xp.scanBonus,
  VOCAB_MASTERY: config.xp.vocabMastery,
  VOCAB_CHALLENGE_CORRECT: config.xp.vocabChallengCorrect,
  VOCAB_CHALLENGE_COMPLETE: config.xp.vocabChallengeBonus,
  SUMMARY_GENERATED: config.xp.summaryGenerated,
};

export const XpService = {
  /**
   * Award XP to a user and recalculate their level.
   * Returns the new XP, level, and whether they leveled up.
   */
  async awardXp(
    userId: string,
    activity: XpActivity,
    customAmount?: number
  ): Promise<{ newXp: number; newLevel: number; leveledUp: boolean; xpAwarded: number }> {
    const xpAwarded = customAmount ?? XP_MAP[activity];

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const newXp = user.xp + xpAwarded;
    const oldLevel = user.level;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

    await prisma.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel, points: { increment: xpAwarded } },
    });

    return {
      newXp,
      newLevel,
      leveledUp: newLevel > oldLevel,
      xpAwarded,
    };
  },

  /**
   * Award XP for words read in a session.
   */
  async awardReadingXp(userId: string, wordsRead: number) {
    const xpAwarded = Math.floor(wordsRead * config.xp.perWordRead);
    if (xpAwarded <= 0) return null;
    return XpService.awardXp(userId, 'READING_SESSION', xpAwarded);
  },

  /**
   * Award a badge to a user (idempotent — won't duplicate).
   */
  async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      await prisma.userBadge.create({ data: { userId, badgeId } });
      return true;
    } catch {
      // Unique constraint — already has badge
      return false;
    }
  },

  /**
   * Check and award automatic achievement badges based on current stats.
   */
  async checkAndAwardBadges(userId: string): Promise<string[]> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { badges: true, documents: true, sessionLogs: true },
    });

    const earned: string[] = [];

    const wpmHistory = (user.wpmHistory as number[]) ?? [];
    const avgWpm = wpmHistory.length
      ? wpmHistory.reduce((a, b) => a + b, 0) / wpmHistory.length
      : 0;

    // Fast Reader: avg WPM > 130
    if (avgWpm >= 130) {
      const awarded = await XpService.awardBadge(userId, 'fast-reader');
      if (awarded) earned.push('fast-reader');
    }

    // 7 Day Star: streak >= 7
    if (user.streak >= 7) {
      const awarded = await XpService.awardBadge(userId, '7-day-star');
      if (awarded) earned.push('7-day-star');
    }

    // Scholar: completed 10+ documents
    const completedDocs = user.documents.filter((d) => d.progress >= 100).length;
    if (completedDocs >= 10) {
      const awarded = await XpService.awardBadge(userId, 'scholar');
      if (awarded) earned.push('scholar');
    }

    // Deep Focus: single session >= 30 minutes (1800 seconds)
    const longSession = user.sessionLogs.find((s) => s.elapsedSeconds >= 1800);
    if (longSession) {
      const awarded = await XpService.awardBadge(userId, 'focus-master');
      if (awarded) earned.push('focus-master');
    }

    return earned;
  },

  /**
   * Update performance history (rolling 7-item arrays).
   */
  async updatePerformanceHistory(
    userId: string,
    wpm: number,
    accuracy: number
  ): Promise<void> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const updatedWpm = updateRollingHistory(
      (user.wpmHistory as number[]) ?? [],
      wpm
    );
    const updatedComp = updateRollingHistory(
      (user.comprehensionHistory as number[]) ?? [],
      accuracy
    );

    await prisma.user.update({
      where: { id: userId },
      data: {
        wpmHistory: updatedWpm,
        comprehensionHistory: updatedComp,
      },
    });
  },
};
