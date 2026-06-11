import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Username must be lowercase letters, numbers, or underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/register
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const result = await AuthService.register(body, app);
    return reply.status(201).send({
      message: 'Account created successfully.',
      ...result,
    });
  });

  // POST /api/v1/auth/login
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const result = await AuthService.login(body, app);
    return reply.send({
      message: 'Login successful.',
      ...result,
    });
  });

  // POST /api/v1/auth/refresh
  app.post('/refresh', async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body);
    const tokens = await AuthService.refresh(refreshToken, app as any);
    return reply.send({ tokens });
  });

  // POST /api/v1/auth/logout
  app.post('/logout', async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body);
    await AuthService.logout(refreshToken);
    return reply.send({ message: 'Logged out successfully.' });
  });
}
