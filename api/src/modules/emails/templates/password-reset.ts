import { baseLayout } from './base-layout';

export function getPasswordResetTemplate(name: string | null, resetUrl: string): string {
  const displayName = name ?? 'there';
  const content = `
    <h2>Reset your WaitlistOS password</h2>
    <p>Hi ${displayName},</p>
    <p>We received a request to reset the password for your WaitlistOS account. Click the button below to choose a new password.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p>Or copy and paste this link into your browser:</p>
    <div class="token-box">${resetUrl}</div>
    <div class="alert">⏰ This link expires in <strong>1 hour</strong>.</div>
    <hr class="divider" />
    <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
  `;
  return baseLayout(content, 'Reset your WaitlistOS password');
}
