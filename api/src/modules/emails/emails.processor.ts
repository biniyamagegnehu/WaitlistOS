import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailsService } from './emails.service';

@Processor('emails')
export class EmailsProcessor {
  private readonly logger = new Logger(EmailsProcessor.name);

  constructor(private readonly emailsService: EmailsService) {}

  @Process('send-welcome-email')
  async handleSendWelcomeEmail(job: Job<any>) {
    this.logger.debug(`Processing send-welcome-email job for ${job.data.email}...`);
    await this.emailsService.sendWelcomeEmail(job.data);
  }

  @Process('send-verification-email')
  async handleSendVerificationEmail(job: Job<any>) {
    this.logger.debug(`Processing send-verification-email job for ${job.data.email}...`);
    await this.emailsService.sendVerificationEmail(job.data);
  }

  @Process('send-password-reset')
  async handleSendPasswordReset(job: Job<any>) {
    this.logger.debug(`Processing send-password-reset job for ${job.data.email}...`);
    await this.emailsService.sendPasswordResetEmail(job.data);
  }

  @Process('send-password-changed')
  async handleSendPasswordChanged(job: Job<any>) {
    this.logger.debug(`Processing send-password-changed job for ${job.data.email}...`);
    await this.emailsService.sendPasswordChangedEmail(job.data);
  }

  @Process('send-email-change-verification')
  async handleSendEmailChangeVerification(job: Job<any>) {
    this.logger.debug(`Processing send-email-change-verification job for ${job.data.email}...`);
    await this.emailsService.sendEmailChangeVerification(job.data);
  }

  @Process('send-email-changed-confirmation')
  async handleSendEmailChangedConfirmation(job: Job<any>) {
    this.logger.debug(`Processing send-email-changed-confirmation job for ${job.data.email}...`);
    await this.emailsService.sendEmailChangedConfirmation(job.data);
  }

  @Process('send-new-login')
  async handleSendNewLogin(job: Job<any>) {
    this.logger.debug(`Processing send-new-login job for ${job.data.email}...`);
    await this.emailsService.sendNewLoginNotification(job.data);
  }

  @Process('send-2fa-enabled')
  async handleSendTwoFactorEnabled(job: Job<any>) {
    this.logger.debug(`Processing send-2fa-enabled job for ${job.data.email}...`);
    await this.emailsService.sendTwoFactorEnabledEmail(job.data);
  }

  @Process('send-2fa-disabled')
  async handleSendTwoFactorDisabled(job: Job<any>) {
    this.logger.debug(`Processing send-2fa-disabled job for ${job.data.email}...`);
    await this.emailsService.sendTwoFactorDisabledEmail(job.data);
  }
}
