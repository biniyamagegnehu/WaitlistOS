import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * RefreshTokenGuard
 * Validates JWT refresh tokens using the RefreshTokenStrategy.
 * Used exclusively on the POST /auth/refresh endpoint.
 */
@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}
