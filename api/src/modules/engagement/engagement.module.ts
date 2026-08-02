import { Module } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { EngagementCron } from './engagement.cron';
import { EmailsModule } from '../emails/emails.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, EmailsModule],
  providers: [EngagementService, EngagementCron],
  exports: [EngagementService],
})
export class EngagementModule {}
