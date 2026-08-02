import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ParticipantsService } from './participants.service';
import { ParticipantsController } from './participants.controller';
import { PaymentModule } from '../payments/payment.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'emails' },
      { name: 'ai-tasks' },
    ),
    PaymentModule,
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
})
export class ParticipantsModule {}
