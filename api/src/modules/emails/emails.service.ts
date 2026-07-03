import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Resend } from 'resend';
import { getWelcomeEmailTemplate } from './templates/welcome';
import { getEmailVerificationTemplate } from './templates/email-verification';
import { getPasswordResetTemplate } from './templates/password-reset';
import { getPasswordChangedTemplate } from './templates/password-changed';
import { getEmailChangeVerificationTemplate } from './templates/email-change-verification';
import { getEmailChangedConfirmationTemplate } from './templates/email-changed-confirmation';
import { getNewLoginTemplate } from './templates/new-login';
import { getTwoFactorEnabledTemplate } from './templates/two-factor-enabled';
import { getTwoFactorDisabledTemplate } from './templates/two-factor-disabled';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private resend: Resend;
  private readonly fromEmail: string;

  constructor(@InjectQueue('emails') private emailsQueue: Queue) {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not configured. Emails will not be sent.');
    }
    this.resend = new Resend(apiKey);
  }

  // ── Queueing Methods ────────────────────────────────────────────────────────
  // We explicitly do NOT await the queue.add() methods here.
  // If Redis is not running locally, awaiting them would cause the API request to hang.
  // By not awaiting, we ensure the HTTP response returns immediately.

  queueWelcomeEmail(email: string, waitlist: string, position: number, referralLink: string) {
    this.emailsQueue.add('send-welcome-email', { email, waitlist, position, referralLink })
      .catch(e => this.logger.error('Failed to queue welcome email: ' + e.message));
  }

  queueVerificationEmail(email: string, token: string, name: string | null) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    this.logger.debug(`[DEV] Verification URL for ${email}: ${verificationUrl}`);
    
    this.emailsQueue.add('send-verification-email', { email, token, verificationUrl, name })
      .catch(e => this.logger.error('Failed to queue verification email: ' + e.message));
  }

  queuePasswordResetEmail(email: string, token: string, name: string | null) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    this.logger.debug(`[DEV] Password Reset URL for ${email}: ${resetUrl}`);

    this.emailsQueue.add('send-password-reset', { email, token, resetUrl, name })
      .catch(e => this.logger.error('Failed to queue password reset email: ' + e.message));
  }

  queuePasswordChangedEmail(email: string, name: string | null) {
    this.emailsQueue.add('send-password-changed', { email, name })
      .catch(e => this.logger.error('Failed to queue password changed email: ' + e.message));
  }

  queueEmailChangeVerification(pendingEmail: string, token: string, name: string | null) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email-change?token=${token}`;
    this.logger.debug(`[DEV] Email Change Verification URL for ${pendingEmail}: ${verificationUrl}`);

    this.emailsQueue.add('send-email-change-verification', { email: pendingEmail, token, verificationUrl, name })
      .catch(e => this.logger.error('Failed to queue email change verification: ' + e.message));
  }

  queueEmailChangedConfirmation(oldEmail: string, newEmail: string, name: string | null) {
    this.emailsQueue.add('send-email-changed-confirmation', { email: oldEmail, newEmail, name })
      .catch(e => this.logger.error('Failed to queue email changed confirmation: ' + e.message));
  }

  queueNewLoginNotification(email: string, ipAddress: string, userAgent: string, name: string | null) {
    this.emailsQueue.add('send-new-login', { email, ipAddress, userAgent, name })
      .catch(e => this.logger.error('Failed to queue new login notification: ' + e.message));
  }

  queueTwoFactorEnabledEmail(email: string, name: string | null) {
    this.emailsQueue.add('send-2fa-enabled', { email, name })
      .catch(e => this.logger.error('Failed to queue 2fa enabled email: ' + e.message));
  }

  queueTwoFactorDisabledEmail(email: string, name: string | null) {
    this.emailsQueue.add('send-2fa-disabled', { email, name })
      .catch(e => this.logger.error('Failed to queue 2fa disabled email: ' + e.message));
  }

  // ── Direct Sending Methods (Called by Processor) ────────────────────────────

  private async executeSend(email: string, subject: string, html: string) {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn(`Skipping email "${subject}" to ${email} - API key not set.`);
      return;
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html,
      });

      if (response.error) {
        this.logger.error(`Failed to send email to ${email}: ${response.error.message}`);
      } else {
        this.logger.log(`Email "${subject}" sent successfully to ${email} [ID: ${response.data?.id}]`);
      }
    } catch (error: any) {
      this.logger.error(`Exception while sending email to ${email}: ${error.message}`);
    }
  }

  async sendWelcomeEmail(data: { email: string; waitlist: string; position: number; referralLink: string }) {
    const html = getWelcomeEmailTemplate(data.waitlist, data.position, data.referralLink);
    await this.executeSend(data.email, `Welcome to ${data.waitlist}`, html);
  }

  async sendVerificationEmail(data: { email: string; verificationUrl: string; name: string | null }) {
    const html = getEmailVerificationTemplate(data.name, data.verificationUrl);
    await this.executeSend(data.email, 'Verify your email address', html);
  }

  async sendPasswordResetEmail(data: { email: string; resetUrl: string; name: string | null }) {
    const html = getPasswordResetTemplate(data.name, data.resetUrl);
    await this.executeSend(data.email, 'Reset your WaitlistOS password', html);
  }

  async sendPasswordChangedEmail(data: { email: string; name: string | null }) {
    const html = getPasswordChangedTemplate(data.name);
    await this.executeSend(data.email, 'Your password has been changed', html);
  }

  async sendEmailChangeVerification(data: { email: string; verificationUrl: string; name: string | null }) {
    const html = getEmailChangeVerificationTemplate(data.name, data.verificationUrl);
    await this.executeSend(data.email, 'Verify your new email address', html);
  }

  async sendEmailChangedConfirmation(data: { email: string; newEmail: string; name: string | null }) {
    const html = getEmailChangedConfirmationTemplate(data.name, data.newEmail);
    await this.executeSend(data.email, 'Your email address has been updated', html);
  }

  async sendNewLoginNotification(data: { email: string; ipAddress: string; userAgent: string; name: string | null }) {
    const html = getNewLoginTemplate(data.name, data.ipAddress, data.userAgent);
    await this.executeSend(data.email, 'New login to your account', html);
  }

  async sendTwoFactorEnabledEmail(data: { email: string; name: string | null }) {
    const html = getTwoFactorEnabledTemplate(data.name);
    await this.executeSend(data.email, 'Two-Factor Authentication enabled', html);
  }

  async sendTwoFactorDisabledEmail(data: { email: string; name: string | null }) {
    const html = getTwoFactorDisabledTemplate(data.name);
    await this.executeSend(data.email, 'Two-Factor Authentication disabled', html);
  }
}
