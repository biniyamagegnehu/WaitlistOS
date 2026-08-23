import { Module, forwardRef } from '@nestjs/common';
import { ParticipantsController } from './participants.controller';
import { ParticipantsService } from './participants.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BullModule } from '@nestjs/bull';
import { PaymentModule } from '../payments/payment.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { MonetizationModule } from '../monetization/monetization.module';

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
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
  exports: [ParticipantsService],
})
export class ParticipantsModule {}
