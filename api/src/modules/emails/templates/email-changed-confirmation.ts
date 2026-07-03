import { baseLayout } from './base-layout';

export function getEmailChangedConfirmationTemplate(name: string | null, newEmail: string): string {
  const displayName = name ?? 'there';
  const content = `
    <h2>Your email address has been updated</h2>
    <p>Hi ${displayName},</p>
    <p>This is a confirmation that the email address for your WaitlistOS account has been successfully changed to <strong>${newEmail}</strong>.</p>
    <p>You will need to use this new email address next time you log in.</p>
    <hr class="divider" />
    <p><strong>Didn't make this change?</strong></p>
    <p>If you did not authorize this change, please contact our support team immediately to secure your account.</p>
  `;
  return baseLayout(content, 'Your WaitlistOS email address has been changed');
}
