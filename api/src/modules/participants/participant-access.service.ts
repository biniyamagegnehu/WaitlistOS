import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';

/**
 * ParticipantAccessService
 *
 * Handles generation, hashing, and verification of permanent participant
 * access tokens. Tokens are cryptographically random and stored as SHA-256
 * hashes in the database. Raw tokens are ONLY transmitted via email URLs and
 * are NEVER logged or returned in API responses beyond the initial generation.
 */
@Injectable()
export class ParticipantAccessService {
  private readonly logger = new Logger(ParticipantAccessService.name);

  /**
   * Generate a cryptographically secure, URL-safe random token.
   * 32 bytes = 256 bits of entropy → 64 hex characters.
   */
  generateRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Hash a raw token using SHA-256 for safe database storage.
   * We use SHA-256 (not bcrypt) here because:
   * - Tokens already have 256 bits of entropy (no need for key-stretching)
   * - Fast lookup is required (no per-request bcrypt cost)
   * - The token is not a user-chosen password
   */
  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Verify a raw token against a stored hash.
   */
  verifyToken(rawToken: string, storedHash: string): boolean {
    const hash = this.hashToken(rawToken);
    // Constant-time comparison using Node's timingSafeEqual
    try {
      const { timingSafeEqual } = require('crypto');
      return timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
    } catch {
      // Fallback if lengths differ (timingSafeEqual requires same length)
      return false;
    }
  }

  /**
   * Build the permanent participant magic URL.
   * Format: {baseUrl}/w/{slug}/participant/{rawToken}
   */
  buildMagicUrl(baseUrl: string, slug: string, rawToken: string): string {
    // Never log the rawToken
    this.logger.debug(`Building magic URL for waitlist slug: ${slug}`);
    return `${baseUrl}/w/${slug}/participant/${rawToken}`;
  }
}
