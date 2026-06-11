import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { config } from '../config';

export async function registerPlugins(app: FastifyInstance) {
  // CORS
  await app.register(cors, {
    origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Rate Limiting
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'You are sending requests too fast. Please slow down.',
    }),
  });

  // JWT
  await app.register(jwt, {
    secret: config.jwt.accessSecret,
    sign: { expiresIn: config.jwt.accessExpiry },
  });

  // Multipart (file uploads)
  await app.register(multipart, {
    limits: {
      fileSize: config.upload.maxFileSizeBytes,
      files: 1,
    },
  });

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'LexiAid API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }));
}
