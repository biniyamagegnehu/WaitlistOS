import { baseLayout } from './base-layout';

export function getEmailChangeVerificationTemplate(name: string | null, verificationUrl: string): string {
  const displayName = name ?? 'there';
  const content = `
    <h2>Verify your new email address</h2>
    <p>Hi ${displayName},</p>
    <p>We received a request to change the email address associated with your WaitlistOS account to this one. Please confirm this change by clicking the button below.</p>
    <a href="${verificationUrl}" class="btn">Confirm New Email</a>
    <p>Or copy and paste this link into your browser:</p>
    <div class="token-box">${verificationUrl}</div>
    <div class="alert">⏰ This link expires in <strong>24 hours</strong>.</div>
    <hr class="divider" />
    <p>If you did not request to change your email address, you can safely ignore this email.</p>
  `;
  return baseLayout(content, 'Verify your new WaitlistOS email address');
}
