import type { Response } from 'express';
import type { ConfigService } from '@nestjs/config';

export const REFRESH_TOKEN_COOKIE = 'refresh_token';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getRefreshTokenCookieOptions(configService: ConfigService) {
  const isProduction = configService.get<string>('app.nodeEnv') === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    maxAge: THIRTY_DAYS_MS,
    path: '/api/auth',
  };
}

export function setRefreshTokenCookie(
  res: Response,
  token: string,
  configService: ConfigService,
): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, getRefreshTokenCookieOptions(configService));
}

export function clearRefreshTokenCookie(
  res: Response,
  configService: ConfigService,
): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, getRefreshTokenCookieOptions(configService));
}
