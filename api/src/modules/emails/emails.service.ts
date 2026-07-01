import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { getWelcomeEmailTemplate } from './templates/welcome';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private resend: Resend;
  private readonly fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not configured. Emails will not be sent.');
    }
    this.resend = new Resend(apiKey);
  }

  async sendWelcomeEmail(data: { email: string; waitlist: string; position: number; referralLink: string }) {
    if (!process.env.RESEND_API_KEY) {
      this.logger.warn(`Skipping email to ${data.email} - API key not set.`);
      return;
    }

    try {
      const html = getWelcomeEmailTemplate(data.waitlist, data.position, data.referralLink);
      
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: data.email,
        subject: `Welcome to ${data.waitlist}`,
        html,
      });

      if (response.error) {
        this.logger.error(`Failed to send email to ${data.email}: ${response.error.message}`);
      } else {
        this.logger.log(`Welcome email sent successfully to ${data.email} [ID: ${response.data?.id}]`);
      }
    } catch (error: any) {
      this.logger.error(`Exception while sending email to ${data.email}: ${error.message}`);
    }
  }
}
