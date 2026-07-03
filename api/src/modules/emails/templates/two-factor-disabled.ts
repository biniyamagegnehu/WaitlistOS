import { baseLayout } from './base-layout';

export function getTwoFactorDisabledTemplate(name: string | null): string {
  const displayName = name ?? 'there';
  const content = `
    <h2>Two-Factor Authentication Disabled</h2>
    <p>Hi ${displayName},</p>
    <p>This is a confirmation that Two-Factor Authentication (2FA) has been disabled for your WaitlistOS account.</p>
    <div class="alert">⚠️ Your account is now less secure. We recommend re-enabling 2FA as soon as possible.</div>
    <hr class="divider" />
    <p><strong>Didn't make this change?</strong></p>
    <p>If you did not disable 2FA, please reset your password immediately and contact our support team.</p>
  `;
  return baseLayout(content, 'Two-Factor Authentication has been disabled');
}
