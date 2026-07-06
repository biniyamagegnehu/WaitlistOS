import { baseLayout } from './base-layout';

export function getSubscriptionExpiredTemplate(
  name: string | null,
  planName: string,
) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  return baseLayout(
    'Subscription expired',
    `
      <p>${greeting}</p>
      <p>Your <strong>${planName}</strong> subscription has expired.</p>
      <p>Renew from your billing page to restore premium features.</p>
    `,
  );
}
