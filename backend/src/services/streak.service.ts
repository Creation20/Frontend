import { prisma } from '../lib/prisma';

export const StreakService = {
  /**
   * Called at the end of every reading session.
   * Increments the streak if the user hasn't already been active today.
   * Resets streak to 1 if they missed yesterday.
   */
  async updateStreak(userId: string): Promise<{ streak: number; streakMaintained: boolean }> {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const now = new Date();
    const today = toDateOnly(now);
    const lastActive = user.lastActiveDate ? toDateOnly(user.lastActiveDate) : null;

    // Already recorded today — no change
    if (lastActive && lastActive === today) {
      return { streak: user.streak, streakMaintained: true };
    }

    const yesterday = toDateOnly(new Date(now.getTime() - 86400000));
    const isConsecutive = lastActive === yesterday;

    const newStreak = isConsecutive ? user.streak + 1 : 1;

    await prisma.user.update({
      where: { id: userId },
      data: {
        streak: newStreak,
        lastActiveDate: now,
      },
    });

    return { streak: newStreak, streakMaintained: isConsecutive };
  },

  /**
   * Update total reading time (accumulates in seconds).
   */
  async addReadingTime(userId: string, seconds: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { totalReadingTime: { increment: seconds } },
    });
  },
};

function toDateOnly(date: Date): string {
  return date.toISOString().split('T')[0]; // "2026-06-11"
}
