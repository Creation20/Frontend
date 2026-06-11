import { prisma } from '../lib/prisma';

export interface ProgressReport {
  generatedAt: string;
  user: {
    name: string;
    username: string;
    email: string;
    level: number;
    streak: number;
  };
  performance: {
    averageWpm: number;
    wpmHistory: number[];
    averageAccuracy: number;
    comprehensionHistory: number[];
    totalReadingTimeMinutes: number;
  };
  badges: Array<{ badgeId: string; earnedAt: string }>;
  documents: {
    total: number;
    completed: number;
    inProgress: number;
  };
}

export const ReportService = {
  /**
   * Generate a comprehensive progress report for a user.
   * This data can be used by the frontend to generate a PDF.
   */
  async generateReport(userId: string): Promise<ProgressReport> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        badges: true,
        documents: {
          where: { deletedAt: null },
          select: { progress: true },
        },
        sessionLogs: {
          orderBy: { recordedAt: 'desc' },
          take: 30,
        },
      },
    });

    const wpmHistory = (user.wpmHistory as number[]) ?? [];
    const comprehensionHistory = (user.comprehensionHistory as number[]) ?? [];

    const averageWpm = wpmHistory.length
      ? Math.round(wpmHistory.reduce((a, b) => a + b, 0) / wpmHistory.length)
      : 0;

    const averageAccuracy = comprehensionHistory.length
      ? Math.round(
          comprehensionHistory.reduce((a, b) => a + b, 0) / comprehensionHistory.length
        )
      : 0;

    const totalDocs = user.documents.length;
    const completedDocs = user.documents.filter((d) => d.progress >= 100).length;
    const inProgressDocs = user.documents.filter(
      (d) => d.progress > 0 && d.progress < 100
    ).length;

    return {
      generatedAt: new Date().toISOString(),
      user: {
        name: user.name,
        username: user.username,
        email: user.email,
        level: user.level,
        streak: user.streak,
      },
      performance: {
        averageWpm,
        wpmHistory,
        averageAccuracy,
        comprehensionHistory,
        totalReadingTimeMinutes: Math.floor(user.totalReadingTime / 60),
      },
      badges: user.badges.map((b) => ({
        badgeId: b.badgeId,
        earnedAt: b.earnedAt.toISOString(),
      })),
      documents: {
        total: totalDocs,
        completed: completedDocs,
        inProgress: inProgressDocs,
      },
    };
  },
};
