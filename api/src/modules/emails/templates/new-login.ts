import { baseLayout } from './base-layout';

export function getNewLoginTemplate(name: string | null, ipAddress: string, userAgent: string): string {
  const displayName = name ?? 'there';
  const content = `
    <h2>New login to your account</h2>
    <p>Hi ${displayName},</p>
    <p>We noticed a new login to your WaitlistOS account.</p>
    <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 14px;"><strong>IP Address:</strong> ${ipAddress}</p>
      <p style="margin: 0; font-size: 14px;"><strong>Device/Browser:</strong> ${userAgent}</p>
    </div>
    <hr class="divider" />
    <p><strong>Was this you?</strong></p>
    <p>If this was you, you can safely ignore this email.</p>
    <p>If you don't recognize this activity, please change your password immediately to secure your account.</p>
  `;
  return baseLayout(content, 'New login to your WaitlistOS account');
}
