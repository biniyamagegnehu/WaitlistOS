import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { TwoFactorService } from './services/two-factor.service';
import { AuthController } from './controllers/auth.controller';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { VerifiedEmailGuard } from './guards/verified-email.guard';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwtAccessSecret'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    SessionsModule,
    UsersModule,
    PrismaModule,
    EmailsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TwoFactorService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    GoogleStrategy,
    AccessTokenGuard,
    RefreshTokenGuard,
    VerifiedEmailGuard,
  ],
  exports: [AuthService, TwoFactorService, JwtModule, AccessTokenGuard, VerifiedEmailGuard],
})
export class AuthModule {}
