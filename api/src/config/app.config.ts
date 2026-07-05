import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',

  // ── JWT ─────────────────────────────────────────────────────────
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'fallback-access-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'fallback-refresh-secret-change-in-production',
  jwtAccessExpiresIn: '15m',
  jwtRefreshExpiresIn: '30d',

  // ── Google OAuth ─────────────────────────────────────────────────
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/api/auth/google/callback',

  // ── Token Expiry ─────────────────────────────────────────────────
  emailVerificationExpiresInMs: 24 * 60 * 60 * 1000,   // 24 hours
  passwordResetExpiresInMs: 60 * 60 * 1000,             // 1 hour
  pendingEmailExpiresInMs: 24 * 60 * 60 * 1000,         // 24 hours

  // ── Account Lockout ──────────────────────────────────────────────
  maxLoginAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000,                    // 15 minutes

  // ── Two-Factor Authentication ────────────────────────────────────
  twoFactorIssuer: process.env.TWO_FACTOR_ISSUER ?? 'WaitlistOS',

  // ── Cloudinary ───────────────────────────────────────────────────
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
}));
