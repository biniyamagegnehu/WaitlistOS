import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshPayload } from '../interfaces/jwt-payload.interface';
import { Request } from 'express';
import { REFRESH_TOKEN_COOKIE } from '../utils/refresh-token-cookie.util';

export interface RefreshTokenRequest {
  userId: string;
  sessionId: string;
  rawRefreshToken: string;
}

function extractRefreshToken(req: Request): string | null {
  const cookieToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }

  return null;
}

/**
 * RefreshTokenStrategy (named 'jwt-refresh')
 * Validates the long-lived refresh token from an httpOnly cookie.
 * Attaches the raw token string for hash comparison in AuthService.
 */
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractRefreshToken]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwtRefreshSecret') ?? '',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtRefreshPayload): RefreshTokenRequest {
    const rawRefreshToken = extractRefreshToken(req);

    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    return {
      userId: payload.sub,
      sessionId: payload.sessionId,
      rawRefreshToken,
    };
  }
}
