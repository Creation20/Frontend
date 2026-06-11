/**
 * Custom application error classes.
 * Provides typed HTTP errors that Fastify can serialize properly.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly error: string;

  constructor(statusCode: number, error: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.name = 'AppError';
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      error: this.error,
      message: this.message,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, 'Not Found', `${resource} not found.`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized. Please log in.') {
    super(401, 'Unauthorized', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(403, 'Forbidden', message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, 'Validation Error', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'Conflict', message);
  }
}

export class InternalError extends AppError {
  constructor(message = 'An internal server error occurred.') {
    super(500, 'Internal Server Error', message);
  }
}

/**
 * Global Fastify error handler — converts AppError and Prisma errors
 * into clean JSON responses.
 */
export function buildErrorHandler() {
  return (error: any, _request: any, reply: any) => {
    // Known application errors
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toJSON());
    }

    // Prisma unique constraint violation (P2002)
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0] ?? 'field';
      return reply.status(409).send({
        statusCode: 409,
        error: 'Conflict',
        message: `A record with this ${field} already exists.`,
      });
    }

    // Prisma record not found (P2025)
    if (error?.code === 'P2025') {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'The requested record was not found.',
      });
    }

    // Fastify validation errors
    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      });
    }

    // Fallback
    console.error('[Unhandled Error]', error);
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: error.message || 'Something went wrong. Please try again.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  };
}
