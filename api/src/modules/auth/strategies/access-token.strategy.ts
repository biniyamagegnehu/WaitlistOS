import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/services/users.service';
import { JwtPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import { UserStatus } from '@prisma/client';

/**
 * AccessTokenStrategy (named 'jwt')
 * Validates the short-lived access token from the Authorization: Bearer header.
 * Fetches the live user from the database to ensure they still exist and are ACTIVE.
 */
@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwtAccessSecret') ?? '',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account has been suspended');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: payload.sessionId,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
