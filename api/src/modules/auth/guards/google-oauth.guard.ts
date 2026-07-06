import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    const response = context.switchToHttp().getResponse<Response>();
    const frontendUrl =
      this.configService.get<string>('app.frontendUrl') ??
      'http://localhost:3001';

    if (err || !user) {
      response.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      throw new UnauthorizedException('Google authentication failed');
    }

    return user;
  }
}
