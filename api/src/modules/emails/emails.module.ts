import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailsService } from './emails.service';
import { EmailsProcessor } from './emails.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'emails',
    }),
  ],
  providers: [EmailsService, EmailsProcessor],
  exports: [EmailsService],
})
export class EmailsModule {}
