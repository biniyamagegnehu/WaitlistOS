import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from './config/app.config';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { UsersModule } from './modules/users/users.module';
import { WaitlistsModule } from './modules/waitlists/waitlists.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { EmailsModule } from './modules/emails/emails.module';
import { DashboardModule } from './modules/founders/dashboard/dashboard.module';
import { AuthModule } from './modules/auth/auth.module';
import { FilesModule } from './modules/files/files.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { BrandingModule } from './modules/branding/branding.module';
import { WidgetsModule } from './modules/widgets/widgets.module';
import { PublicWaitlistsModule } from './modules/public-waitlists/public-waitlists.module';
import { AccessTokenGuard } from './modules/auth/guards/access-token.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    BullModule.forRoot({
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    CommonModule,
    PrismaModule,
    SessionsModule,
    UsersModule,
    AuthModule,
    WaitlistsModule,
    ParticipantsModule,
    EmailsModule,
    DashboardModule,
    CloudinaryModule,
    FilesModule,
    BrandingModule,
    WidgetsModule,
    PublicWaitlistsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
