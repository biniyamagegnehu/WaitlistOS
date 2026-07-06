import { baseLayout } from './base-layout';

export function getPaymentFailedTemplate(
  name: string | null,
  planName: string,
) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  return baseLayout(
    'Payment failed',
    `
      <p>${greeting}</p>
      <p>We could not process your payment for the <strong>${planName}</strong> plan.</p>
      <p>You can retry from your billing page in the dashboard.</p>
    `,
  );
}
