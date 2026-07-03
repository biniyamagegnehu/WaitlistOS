import { baseLayout } from './base-layout';

export function getPasswordChangedTemplate(name: string | null): string {
  const displayName = name ?? 'there';
  const content = `
    <h2>Your password has been changed</h2>
    <p>Hi ${displayName},</p>
    <p>This is a confirmation that the password for your WaitlistOS account has been successfully changed.</p>
    <hr class="divider" />
    <p><strong>Didn't make this change?</strong></p>
    <p>If you did not change your password, please contact our support team immediately to secure your account.</p>
  `;
  return baseLayout(content, 'Your WaitlistOS password has been changed');
}
