import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),

  CORS_ORIGIN: z.string().default('*'),
  MAX_FILE_SIZE_MB: z.string().default('20'),
  UPLOAD_DIR: z.string().default('./uploads'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  port: Number(_env.data.PORT),
  nodeEnv: _env.data.NODE_ENV,
  isDev: _env.data.NODE_ENV === 'development',

  db: {
    url: _env.data.DATABASE_URL,
  },

  jwt: {
    accessSecret: _env.data.JWT_ACCESS_SECRET,
    refreshSecret: _env.data.JWT_REFRESH_SECRET,
    accessExpiry: _env.data.JWT_ACCESS_EXPIRY,
    refreshExpiry: _env.data.JWT_REFRESH_EXPIRY,
  },

  gemini: {
    apiKey: _env.data.GEMINI_API_KEY,
    model: _env.data.GEMINI_MODEL,
  },

  cors: {
    origin: _env.data.CORS_ORIGIN,
  },

  upload: {
    maxFileSizeBytes: Number(_env.data.MAX_FILE_SIZE_MB) * 1024 * 1024,
    dir: _env.data.UPLOAD_DIR,
  },

  xp: {
    perWordRead: 1,
    perQuizCorrect: 30,
    quizCompletionBonus: 50,
    scanBonus: 100,
    vocabMastery: 50,
    vocabChallengCorrect: 30,
    vocabChallengeBonus: 50,
    summaryGenerated: 20,
  },

  levels: {
    xpPerLevel: 1000,
  },
} as const;

export type Config = typeof config;
