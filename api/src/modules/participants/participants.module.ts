import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ParticipantsService } from './participants.service';
import { ParticipantsController } from './participants.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'emails',
    }),
  ],
  controllers: [ParticipantsController],
  providers: [ParticipantsService],
})
export class ParticipantsModule {}
