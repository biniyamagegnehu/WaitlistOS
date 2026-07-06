import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(_context: ExecutionContext) {
    return {
      session: false,
    };
  }

  handleRequest<TUser>(err: Error | null, user: TUser, _info: unknown): TUser {
    if (err || !user) {
      throw err ?? new UnauthorizedException('Google authentication failed');
    }

    return user;
  }
}
