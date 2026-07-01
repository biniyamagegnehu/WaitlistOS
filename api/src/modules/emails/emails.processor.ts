import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailsService } from './emails.service';

interface SendWelcomeEmailJob {
  email: string;
  waitlist: string;
  position: number;
  referralLink: string;
}

@Processor('emails')
export class EmailsProcessor {
  private readonly logger = new Logger(EmailsProcessor.name);

  constructor(private readonly emailsService: EmailsService) {}

  @Process('send-welcome-email')
  async handleSendWelcomeEmail(job: Job<SendWelcomeEmailJob>) {
    this.logger.debug(`Processing send-welcome-email job for ${job.data.email}...`);
    
    // Attempt sending email. Failure will not fail the participant creation 
    // because this is processed asynchronously in the queue.
    await this.emailsService.sendWelcomeEmail(job.data);
    
    this.logger.debug(`Finished processing job for ${job.data.email}`);
  }
}
