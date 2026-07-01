import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsProcessor } from './emails.processor';

@Module({
  providers: [EmailsService, EmailsProcessor],
  exports: [EmailsService],
})
export class EmailsModule {}
