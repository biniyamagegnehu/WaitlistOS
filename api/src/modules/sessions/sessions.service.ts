import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Session } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);
  private readonly BCRYPT_ROUNDS = 10;
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 30;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new session for a user, storing a bcrypt hash of the refresh token.
   */
  async create(
    userId: string,
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Session> {
    const refreshTokenHash = await bcrypt.hash(rawRefreshToken, this.BCRYPT_ROUNDS);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    return this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        expiresAt,
      },
    });
  }

  /**
   * Finds an active (non-revoked, non-expired) session by ID and userId.
   * Throws UnauthorizedException if session is invalid.
   */
  async findValidSession(sessionId: string, userId: string): Promise<Session> {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    return session;
  }

  /**
   * Compares a raw refresh token against the stored bcrypt hash.
   * Throws UnauthorizedException on mismatch.
   */
  async verifyRefreshToken(session: Session, rawToken: string): Promise<void> {
    const isValid = await bcrypt.compare(rawToken, session.refreshTokenHash);
    if (!isValid) {
      // Potential token reuse attack — revoke the session immediately
      await this.revoke(session.id);
      this.logger.warn(`Refresh token mismatch detected for session ${session.id}. Session revoked.`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Rotates the refresh token: replaces the stored hash and updates lastUsedAt.
   */
  async rotateRefreshToken(sessionId: string, newRawToken: string): Promise<void> {
    const newHash = await bcrypt.hash(newRawToken, this.BCRYPT_ROUNDS);

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: newHash,
        lastUsedAt: new Date(),
      },
    });
  }

  /**
   * Revokes a single session by setting revokedAt timestamp.
   */
  async revoke(sessionId: string): Promise<void> {
    try {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
    } catch {
      this.logger.warn(`Attempted to revoke non-existent session: ${sessionId}`);
    }
  }

  /**
   * Revokes all active sessions for a user (logout from all devices).
   */
  async revokeAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`All sessions revoked for user: ${userId}`);
  }
}
