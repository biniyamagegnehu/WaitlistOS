import { baseLayout } from './base-layout';

/**
 * Participant permanent magic-link email.
 * Sent after a participant joins a waitlist.
 * The magic link doubles as their permanent personal URL — verification + access in one click.
 */
export function getParticipantAccessEmailTemplate(
  waitlistName: string,
  magicUrl: string,
): string {
  const previewText = `Verify your email to access the ${waitlistName} waitlist`;

  const content = `
    <h2>You&apos;re on the list! Confirm your spot.</h2>
    <p>Thanks for joining <strong>${waitlistName}</strong>. Click the button below to verify your email and open your personal waitlist page.</p>
    <p style="text-align: center;">
      <a class="btn" href="${magicUrl}">Verify Email &amp; View My Spot</a>
    </p>
    <hr class="divider" />
    <div class="alert">
      <strong>📌 Bookmark this email.</strong> Your personal link is permanent — use it to return to your waitlist page anytime, no password required.
    </div>
    <p style="font-size: 13px; color: #9ca3af;">
      This link is personal to you. Do not share it publicly — anyone with this link can view your waitlist status.
    </p>
  `;

  return baseLayout(content, previewText);
}
