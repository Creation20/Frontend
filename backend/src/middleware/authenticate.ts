import { FastifyReply, FastifyRequest } from 'fastify';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Fastify preHandler hook that verifies the JWT access token.
 * Attaches `request.user` with userId and email.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const payload = await request.jwtVerify<JwtPayload>();
    // Attach user info to the request
    (request as any).user = payload;
  } catch (err) {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid or expired access token. Please log in again.',
    });
  }
}

import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
