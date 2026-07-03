import { Role, UserStatus } from '@prisma/client';

/**
 * Payload embedded in the JWT access token.
 */
export interface JwtPayload {
  /** User ID (subject) */
  sub: string;
  /** User email */
  email: string;
  /** User role for authorization */
  role: Role;
  /** Session ID tied to this token for revocation */
  sessionId: string;
}

/**
 * Payload embedded in the JWT refresh token.
 */
export interface JwtRefreshPayload {
  /** User ID (subject) */
  sub: string;
  /** Session ID for session lookup during rotation */
  sessionId: string;
}

/**
 * The user object as it exists on req.user after JWT validation.
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  sessionId: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

/**
 * Google OAuth profile after strategy validation.
 */
export interface GoogleUser {
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}
