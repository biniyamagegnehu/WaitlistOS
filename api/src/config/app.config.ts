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

  // ── SMTP Email ─────────────────────────────────────────────────
  smtpHost: process.env.SMTP_HOST ?? '',
  smtpPort: parseInt(process.env.SMTP_PORT ?? '587', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPassword: process.env.SMTP_PASSWORD ?? '',
  smtpFrom: process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? 'noreply@waitlistos.com',
  smtpConnectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT ?? '60000', 10),
  smtpGreetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT ?? '15000', 10),
  smtpSocketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT ?? '15000', 10),
  smtpRequireTLS: process.env.SMTP_REQUIRE_TLS === 'true',
  smtpIgnoreTLS: process.env.SMTP_IGNORE_TLS === 'true',
  smtpDisablePooling: process.env.SMTP_DISABLE_POOLING === 'true',
  smtpDisableIPv6: process.env.SMTP_DISABLE_IPV6 !== 'false', // Default to true (disable IPv6)
  smtpTlsVersion: process.env.SMTP_TLS_VERSION ?? '', // e.g., 'TLSv1.2', 'TLSv1.3'
  smtpProxyHost: process.env.SMTP_PROXY_HOST ?? '',
  smtpProxyPort: parseInt(process.env.SMTP_PROXY_PORT ?? '0', 10),
  smtpProxyUser: process.env.SMTP_PROXY_USER ?? '',
  smtpProxyPassword: process.env.SMTP_PROXY_PASSWORD ?? '',

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
