import { baseLayout } from './base-layout';

export function getTwoFactorEnabledTemplate(name: string | null): string {
  const displayName = name ?? 'there';
  const content = `
    <h2>Two-Factor Authentication Enabled</h2>
    <p>Hi ${displayName},</p>
    <p>This is a confirmation that Two-Factor Authentication (2FA) has been successfully enabled for your WaitlistOS account.</p>
    <p>From now on, you will be required to enter a one-time code from your authenticator app whenever you log in.</p>
    <hr class="divider" />
    <p><strong>Didn't make this change?</strong></p>
    <p>If you did not enable 2FA, please contact our support team immediately to secure your account.</p>
  `;
  return baseLayout(content, 'Two-Factor Authentication is now enabled');
}
