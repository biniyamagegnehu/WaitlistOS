import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // JwtModule registered async so ConfigService is available
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Default config used for signing access tokens
        // Individual sign() calls override this with their own secret+expiry
        secret: configService.get<string>('app.jwtAccessSecret'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    SessionsModule,
    UsersModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    GoogleStrategy,
    AccessTokenGuard,
    RefreshTokenGuard,
  ],
  exports: [AuthService, JwtModule, AccessTokenGuard],
})
export class AuthModule {}
