import { Module, forwardRef } from '@nestjs/common';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { ParticipantAccessService } from './participant-access.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BullModule } from '@nestjs/bull';
import { PaymentModule } from '../payments/payment.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MonetizationModule } from '../monetization/monetization.module';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      { name: 'emails' },
      { name: 'ai-tasks' },
    ),
    PaymentModule,
    AnalyticsModule,
    forwardRef(() => MonetizationModule),
    EmailsModule,
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService, ParticipantAccessService],
  exports: [ParticipantsService, ParticipantAccessService],
})
export class ParticipantsModule { }

