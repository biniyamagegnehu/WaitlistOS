import { baseLayout } from './base-layout';

export function getSubscriptionActivatedTemplate(
  name: string | null,
  planName: string,
) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  return baseLayout(
    'Subscription activated',
    `
      <p>${greeting}</p>
      <p>Your <strong>${planName}</strong> subscription is now active on WaitlistOS.</p>
      <p>Premium features are unlocked on your account.</p>
    `,
  );
}
