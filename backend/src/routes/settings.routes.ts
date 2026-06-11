import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate';
import { prisma } from '../lib/prisma';

const settingsSchema = z.object({
  theme: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().min(10).max(40).optional(),
  lineHeight: z.number().min(1.0).max(3.0).optional(),
  letterSpacing: z.number().min(0).max(5).optional(),
  wordSpacing: z.number().min(0).max(10).optional(),
  screenTint: z.string().nullable().optional(),
  bionicReadingEnabled: z.boolean().optional(),
  focusRulerEnabled: z.boolean().optional(),
  focusRulerColor: z.string().optional(),
  marginGuideEnabled: z.boolean().optional(),
  distractionFreeMode: z.boolean().optional(),
  simplifiedTextDefault: z.boolean().optional(),
  grammarHighlightingEnabled: z.boolean().optional(),
  chunkingEnabled: z.boolean().optional(),
  chunkSize: z.enum(['small', 'medium', 'large']).optional(),
  ttsEnabled: z.boolean().optional(),
  ttsSpeed: z.number().min(0.25).max(2.0).optional(),
  ttsPitch: z.number().min(0.5).max(2.0).optional(),
  highlightingEnabled: z.boolean().optional(),
  highlightColor: z.string().optional(),
  reducedMotion: z.boolean().optional(),
  largeTargets: z.boolean().optional(),
  dailyGoalMinutes: z.number().int().min(5).max(480).optional(),
});

const DEFAULT_SETTINGS = {
  theme: 'default',
  fontFamily: 'Lexend',
  fontSize: 18,
  lineHeight: 1.8,
  letterSpacing: 0.5,
  wordSpacing: 0,
  screenTint: null,
  bionicReadingEnabled: false,
  focusRulerEnabled: false,
  focusRulerColor: 'rgba(11,110,110,0.15)',
  marginGuideEnabled: false,
  distractionFreeMode: false,
  simplifiedTextDefault: false,
  grammarHighlightingEnabled: false,
  chunkingEnabled: true,
  chunkSize: 'medium',
  ttsEnabled: false,
  ttsSpeed: 0.9,
  ttsPitch: 1.0,
  highlightingEnabled: true,
  highlightColor: '#F59E0B',
  reducedMotion: false,
  largeTargets: false,
};

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /api/v1/settings — Fetch settings
  app.get('/', async (request) => {
    const settings = await prisma.settings.findUnique({
      where: { userId: request.user.userId },
    });

    if (!settings) {
      // Auto-create defaults if somehow missing
      return prisma.settings.create({
        data: { userId: request.user.userId },
      });
    }

    return settings;
  });

  // PUT /api/v1/settings — Save settings
  app.put('/', async (request) => {
    const body = settingsSchema.parse(request.body);

    return prisma.settings.upsert({
      where: { userId: request.user.userId },
      update: body,
      create: { userId: request.user.userId, ...body },
    });
  });

  // POST /api/v1/settings/reset — Reset to factory defaults
  app.post('/reset', async (request) => {
    return prisma.settings.upsert({
      where: { userId: request.user.userId },
      update: DEFAULT_SETTINGS,
      create: { userId: request.user.userId, ...DEFAULT_SETTINGS },
    });
  });

  // POST /api/v1/settings/diagnostic — Apply diagnostic style preset
  app.post('/diagnostic', async (request) => {
    const { style } = z
      .object({ style: z.enum(['standard', 'visual-comfort', 'high-focus']) })
      .parse(request.body);

    const presets = {
      'standard': {
        fontFamily: 'Inter',
        fontSize: 16,
        lineHeight: 1.5,
        letterSpacing: 0.3,
        bionicReadingEnabled: false,
        theme: 'default',
      },
      'visual-comfort': {
        fontFamily: 'Lexend',
        fontSize: 18,
        lineHeight: 1.9,
        letterSpacing: 0.6,
        bionicReadingEnabled: false,
        screenTint: 'rgba(255,250,205,0.3)', // Warm cream overlay
        theme: 'cream',
      },
      'high-focus': {
        fontFamily: 'OpenDyslexic',
        fontSize: 20,
        lineHeight: 2.2,
        letterSpacing: 0.8,
        bionicReadingEnabled: true,
        focusRulerEnabled: true,
        chunkSize: 'small',
        theme: 'dark',
      },
    };

    const preset = presets[style];

    const updated = await prisma.settings.upsert({
      where: { userId: request.user.userId },
      update: preset,
      create: { userId: request.user.userId, ...DEFAULT_SETTINGS, ...preset },
    });

    return {
      message: `Settings updated for "${style}" reading style.`,
      settings: updated,
    };
  });
}
