import { FastifyInstance } from 'fastify';
import { buildErrorHandler } from '../utils/errors';
import { authRoutes } from './auth.routes';
import { userRoutes } from './users.routes';
import { documentRoutes } from './documents.routes';
import { aiRoutes } from './ai.routes';
import { vocabularyRoutes } from './vocabulary.routes';
import { performanceRoutes } from './performance.routes';
import { settingsRoutes } from './settings.routes';

const API_PREFIX = '/api/v1';

export async function registerRoutes(app: FastifyInstance) {
  // Register global error handler
  app.setErrorHandler(buildErrorHandler());

  // Register all route groups with their prefixes
  await app.register(authRoutes,        { prefix: `${API_PREFIX}/auth` });
  await app.register(userRoutes,        { prefix: `${API_PREFIX}/users` });
  await app.register(documentRoutes,    { prefix: `${API_PREFIX}/documents` });
  await app.register(aiRoutes,          { prefix: `${API_PREFIX}/ai` });
  await app.register(vocabularyRoutes,  { prefix: `${API_PREFIX}/vocabulary` });
  await app.register(performanceRoutes, { prefix: `${API_PREFIX}/performance` });
  await app.register(settingsRoutes,    { prefix: `${API_PREFIX}/settings` });

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found.`,
    });
  });
}
