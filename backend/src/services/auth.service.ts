import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';

const SALT_ROUNDS = 12;

export interface RegisterInput {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const AuthService = {
  /**
   * Register a new user.
   * Creates the user record and default settings in a transaction.
   */
  async register(
    input: RegisterInput,
    app: any
  ): Promise<{ user: object; tokens: TokenPair }> {
    // Check for existing email / username
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email.toLowerCase() },
          { username: input.username.toLowerCase() },
        ],
      },
    });

    if (existing) {
      const field = existing.email === input.email.toLowerCase() ? 'email' : 'username';
      throw new ConflictError(`An account with this ${field} already exists.`);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user + default settings atomically
    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          name: input.name,
          username: input.username.toLowerCase(),
          email: input.email.toLowerCase(),
          passwordHash,
        },
      });

      await tx.settings.create({ data: { userId: newUser.id } });

      return newUser;
    });

    const tokens = await AuthService._issueTokens(user.id, user.email, app);

    return {
      user: AuthService._sanitizeUser(user),
      tokens,
    };
  },

  /**
   * Login with email + password.
   */
  async login(
    input: LoginInput,
    app: any
  ): Promise<{ user: object; tokens: TokenPair }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) throw new UnauthorizedError('Invalid email or password.');

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedError('Invalid email or password.');

    const tokens = await AuthService._issueTokens(user.id, user.email, app);

    return {
      user: AuthService._sanitizeUser(user),
      tokens,
    };
  },

  /**
   * Refresh tokens — verify refresh token, issue new pair, rotate old one.
   */
  async refresh(
    refreshToken: string,
    app: any
  ): Promise<TokenPair> {
    // Verify refresh token signature
    let payload: any;
    try {
      payload = app.jwt.verify(refreshToken, {
        secret: config.jwt.refreshSecret,
      });
    } catch {
      throw new UnauthorizedError('Invalid refresh token.');
    }

    // Check it exists in DB and is not expired
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired or not found. Please log in again.');
    }

    // Delete old token (rotation)
    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    return AuthService._issueTokens(stored.userId, payload.email, app);
  },

  /**
   * Invalidate a refresh token on logout.
   */
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  },

  // ─── Private Helpers ────────────────────────────────────────────────────────

  async _issueTokens(
    userId: string,
    email: string,
    app: any
  ): Promise<TokenPair> {
    const accessToken = app.jwt.sign(
      { userId, email },
      { expiresIn: config.jwt.accessExpiry }
    );

    // Refresh token uses a separate secret
    const refreshToken = app.jwt.sign(
      { userId, email },
      { 
        secret: config.jwt.refreshSecret,
        expiresIn: config.jwt.refreshExpiry 
      } as any
    );

    // Calculate refresh token expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  },

  _sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  },
};
