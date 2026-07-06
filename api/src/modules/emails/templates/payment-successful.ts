import { baseLayout } from './base-layout';

export function getPaymentSuccessfulTemplate(
  name: string | null,
  planName: string,
  amount: number,
  currency: string,
) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  return baseLayout(
    'Payment successful',
    `
      <p>${greeting}</p>
      <p>Your payment of <strong>${amount} ${currency}</strong> for the <strong>${planName}</strong> plan was successful.</p>
      <p>Your subscription is now active. You can manage billing anytime from your dashboard.</p>
    `,
  );
}
