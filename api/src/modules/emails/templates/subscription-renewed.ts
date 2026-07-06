import { baseLayout } from './base-layout';

export function getSubscriptionRenewedTemplate(
  name: string | null,
  planName: string,
  expiresAt: string,
) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  return baseLayout(
    'Subscription renewed',
    `
      <p>${greeting}</p>
      <p>Your <strong>${planName}</strong> subscription has been renewed.</p>
      <p>Your plan is active until <strong>${expiresAt}</strong>.</p>
    `,
  );
}
