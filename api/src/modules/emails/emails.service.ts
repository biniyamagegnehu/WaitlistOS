import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import * as nodemailer from 'nodemailer';
import { getWelcomeEmailTemplate } from './templates/welcome';
import { getEmailVerificationTemplate } from './templates/email-verification';
import { getPasswordResetTemplate } from './templates/password-reset';
import { getPasswordChangedTemplate } from './templates/password-changed';
import { getEmailChangeVerificationTemplate } from './templates/email-change-verification';
import { getEmailChangedConfirmationTemplate } from './templates/email-changed-confirmation';
import { getNewLoginTemplate } from './templates/new-login';
import { getTwoFactorEnabledTemplate } from './templates/two-factor-enabled';
import { getTwoFactorDisabledTemplate } from './templates/two-factor-disabled';
import { getPaymentSuccessfulTemplate } from './templates/payment-successful';
import { getSubscriptionActivatedTemplate } from './templates/subscription-activated';
import { getPaymentFailedTemplate } from './templates/payment-failed';
import { getSubscriptionRenewedTemplate } from './templates/subscription-renewed';
import { getSubscriptionExpiredTemplate } from './templates/subscription-expired';
import { getInvitationTemplate } from './templates/invitation';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private transporter: nodemailer.Transporter;
  private readonly fromEmail: string;

  constructor(
    @InjectQueue('emails') private emailsQueue: Queue,
    private readonly prisma: PrismaService,
  ) {
    this.fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@waitlistos.com';

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT || '587';
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpHost || !smtpUser || !smtpPassword) {
      this.logger.warn('SMTP credentials are not configured. Emails will not be sent.');
      this.transporter = nodemailer.createTransport({
        host: smtpHost || 'localhost',
        port: parseInt(smtpPort),
        secure: smtpSecure,
      } as any);
    } else {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        family: 4, // Force IPv4 to avoid IPv6 connectivity issues
      } as any);
    }
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

  queuePaymentSuccessfulEmail(
    email: string,
    name: string | null,
    planName: string,
    amount: number,
    currency: string,
  ) {
    this.emailsQueue
      .add('send-payment-successful', { email, name, planName, amount, currency })
      .catch((e) => this.logger.error('Failed to queue payment successful email: ' + e.message));
  }

  queueSubscriptionActivatedEmail(
    email: string,
    name: string | null,
    planName: string,
  ) {
    this.emailsQueue
      .add('send-subscription-activated', { email, name, planName })
      .catch((e) => this.logger.error('Failed to queue subscription activated email: ' + e.message));
  }

  queuePaymentFailedEmail(email: string, name: string | null, planName: string) {
    this.emailsQueue
      .add('send-payment-failed', { email, name, planName })
      .catch((e) => this.logger.error('Failed to queue payment failed email: ' + e.message));
  }

  queueSubscriptionRenewedEmail(
    email: string,
    name: string | null,
    planName: string,
    expiresAt: string,
  ) {
    this.emailsQueue
      .add('send-subscription-renewed', { email, name, planName, expiresAt })
      .catch((e) => this.logger.error('Failed to queue subscription renewed email: ' + e.message));
  }

  queueSubscriptionExpiredEmail(email: string, name: string | null, planName: string) {
    this.emailsQueue
      .add('send-subscription-expired', { email, name, planName })
      .catch((e) => this.logger.error('Failed to queue subscription expired email: ' + e.message));
  }

  queueInvitationEmail(email: string, waitlistId: string, position: number) {
    this.emailsQueue
      .add('send-invitation', { email, waitlistId, position })
      .catch((e) => this.logger.error('Failed to queue invitation email: ' + e.message));
  }

  // ── Direct Sending Methods (Called by Processor) ────────────────────────────

  private async executeSend(email: string, subject: string, html: string) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      this.logger.warn(`Skipping email "${subject}" to ${email} - SMTP not configured.`);
      return;
    }

    try {
      const mailOptions = {
        from: `"WaitlistOS" <${this.fromEmail}>`,
        to: email,
        subject,
        html,
      };

      this.logger.debug(`Sending email: ${JSON.stringify({ to: email, from: this.fromEmail, subject })}`);

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email "${subject}" sent successfully to ${email} [Message ID: ${info.messageId}]`);
      this.logger.debug(`Full response: ${JSON.stringify(info)}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${email}: ${error.message}`);
      this.logger.error(`Error details: ${JSON.stringify(error)}`);
      throw error;
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

  async sendPaymentSuccessfulEmail(data: {
    email: string;
    name: string | null;
    planName: string;
    amount: number;
    currency: string;
  }) {
    const html = getPaymentSuccessfulTemplate(
      data.name,
      data.planName,
      data.amount,
      data.currency,
    );
    await this.executeSend(data.email, 'Payment successful', html);
  }

  async sendSubscriptionActivatedEmail(data: {
    email: string;
    name: string | null;
    planName: string;
  }) {
    const html = getSubscriptionActivatedTemplate(data.name, data.planName);
    await this.executeSend(data.email, 'Subscription activated', html);
  }

  async sendPaymentFailedEmail(data: {
    email: string;
    name: string | null;
    planName: string;
  }) {
    const html = getPaymentFailedTemplate(data.name, data.planName);
    await this.executeSend(data.email, 'Payment failed', html);
  }

  async sendSubscriptionRenewedEmail(data: {
    email: string;
    name: string | null;
    planName: string;
    expiresAt: string;
  }) {
    const html = getSubscriptionRenewedTemplate(
      data.name,
      data.planName,
      data.expiresAt,
    );
    await this.executeSend(data.email, 'Subscription renewed', html);
  }

  async sendSubscriptionExpiredEmail(data: {
    email: string;
    name: string | null;
    planName: string;
  }) {
    const html = getSubscriptionExpiredTemplate(data.name, data.planName);
    await this.executeSend(data.email, 'Subscription expired', html);
  }

  async sendInvitationEmail(data: { email: string; waitlistId: string; position: number }) {
    // Fetch waitlist name
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { id: data.waitlistId },
      select: { name: true },
    });

    const waitlistName = waitlist?.name || 'the waitlist';
    const html = getInvitationTemplate(waitlistName, data.position);
    await this.executeSend(data.email, "You're In!", html);
  }

  // Direct method for cohorts service (non-queued)
  async sendInvitationEmailDirect(email: string, waitlistId: string, position: number) {
    // Fetch waitlist name
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { id: waitlistId },
      select: { name: true },
    });

    const waitlistName = waitlist?.name || 'the waitlist';
    const html = getInvitationTemplate(waitlistName, position);
    await this.executeSend(email, "You're In!", html);
  }

  // Test method to verify SMTP connection
  async testConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return { success: true, message: 'SMTP connection verified' };
    } catch (error: any) {
      this.logger.error(`SMTP connection failed: ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}
