import { baseLayout } from './base-layout';

export function getEmailVerificationTemplate(name: string | null, verificationUrl: string): string {
  const displayName = name ?? 'there';
  const content = `
    <h2>Verify your email address</h2>
    <p>Hi ${displayName},</p>
    <p>Thanks for signing up for WaitlistOS! Before you get started, please verify your email address by clicking the button below.</p>
    <a href="${verificationUrl}" class="btn">Verify Email Address</a>
    <p>Or copy and paste this link into your browser:</p>
    <div class="token-box">${verificationUrl}</div>
    <div class="alert">⏰ This link expires in <strong>24 hours</strong>.</div>
    <hr class="divider" />
    <p>If you did not create a WaitlistOS account, you can safely ignore this email.</p>
  `;
  return baseLayout(content, 'Please verify your email address to activate your WaitlistOS account.');
}
