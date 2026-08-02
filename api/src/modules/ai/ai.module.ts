import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { CopywriterService } from './copywriter.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { WaitlistsModule } from '../waitlists/waitlists.module';
import { BullModule } from '@nestjs/bull';
import { ReferralMessagesProcessor } from './referral-messages.processor';

@Module({
  imports: [
    PrismaModule, 
    WaitlistsModule,
    BullModule.registerQueue({ name: 'ai-tasks' }),
  ],
  controllers: [AiController],
  providers: [AiService, CopywriterService, ReferralMessagesProcessor],
  exports: [AiService],
})
export class AiModule {}
