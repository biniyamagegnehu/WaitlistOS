import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class VerifiedEmailGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Please verify your email address to perform this action.');
    }

    return true;
  }
}
