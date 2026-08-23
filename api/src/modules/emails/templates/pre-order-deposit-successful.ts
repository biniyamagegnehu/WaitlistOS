import { baseLayout } from './base-layout';
import { PreOrderDepositPolicy } from '@prisma/client';

export function getPreOrderDepositSuccessfulTemplate(
  waitlistName: string,
  amount: number,
  currency: string,
  policy: PreOrderDepositPolicy,
): string {
  const policyText = policy === PreOrderDepositPolicy.REFUNDABLE 
    ? 'Your deposit is fully refundable.' 
    : 'Your deposit will be credited toward your first purchase.';

  const content = `
    <h2>Your pre-order deposit is confirmed</h2>
    <p>You have successfully reserved your spot for <strong>${waitlistName}</strong>.</p>
    
    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0; color: #4b5563; font-size: 14px;">Deposit Amount</p>
      <p style="margin: 4px 0 0; font-size: 24px; font-weight: bold; color: #111827;">
        ${amount.toFixed(2)} ${currency}
      </p>
    </div>

    <p style="margin-bottom: 24px; color: #374151;">
      <strong>Policy:</strong> ${policyText}
    </p>

    <p>Keep an eye on your inbox for further updates.</p>
  `;

  const previewText = `Your pre-order deposit for ${waitlistName} is confirmed.`;
  return baseLayout(content, previewText);
}
