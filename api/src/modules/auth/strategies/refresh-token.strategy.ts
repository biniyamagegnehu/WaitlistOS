import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshPayload } from '../interfaces/jwt-payload.interface';
import { Request } from 'express';

export interface RefreshTokenRequest {
  userId: string;
  sessionId: string;
  rawRefreshToken: string;
}

/**
 * RefreshTokenStrategy (named 'jwt-refresh')
 * Validates the long-lived refresh token from the Authorization: Bearer header.
 * Attaches the raw token string for hash comparison in AuthService.
 */
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwtRefreshSecret') ?? '',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtRefreshPayload): RefreshTokenRequest {
    // Extract the raw token from the Authorization header for bcrypt comparison
    const authHeader = req.headers.authorization ?? '';
    const rawRefreshToken = authHeader.replace('Bearer ', '').trim();

    return {
      userId: payload.sub,
      sessionId: payload.sessionId,
      rawRefreshToken,
    };
  }
}
