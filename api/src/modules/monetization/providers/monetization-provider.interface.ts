import { MonetizationPayment, PaymentAccount } from '@prisma/client';

export interface InitializePaymentResult {
  checkoutUrl: string;
  providerPaymentId: string;
}

export interface WebhookEventResult {
  providerPaymentId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  providerEventId: string;
  eventType: string;
  payload: any;
}

export interface VerifyPaymentResult {
  status: 'SUCCEEDED' | 'FAILED' | 'PENDING';
  providerPaymentId: string;
}

export interface IMonetizationProvider {
  initializePayment(
    payment: MonetizationPayment,
    account: PaymentAccount,
    returnUrl: string,
    cancelUrl: string,
    customerEmail: string,
    metadata?: Record<string, string>,
  ): Promise<InitializePaymentResult>;

  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean;
  
  parseWebhookEvent(rawBody: string, signature: string | undefined): Promise<WebhookEventResult>;

  verifyPayment(
    paymentId: string,
    account: PaymentAccount,
  ): Promise<VerifyPaymentResult>;
}
