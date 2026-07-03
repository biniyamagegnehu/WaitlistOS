import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',

  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'fallback-access-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'fallback-refresh-secret-change-in-production',
  jwtAccessExpiresIn: '15m',
  jwtRefreshExpiresIn: '30d',

  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/api/auth/google/callback',
}));
