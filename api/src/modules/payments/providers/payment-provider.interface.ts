import { InitializePaymentResult } from '../types/payment.types';

export interface InitializeTransactionPayload {
  amount: number;
  currency: string;
  email: string;
  firstName: string;
  lastName: string;
  txRef: string;
  callbackUrl: string;
  returnUrl: string;
  planName: string;
}

export interface VerifyTransactionResponse {
  success: boolean;
  providerReference?: string;
}

export interface IPaymentProvider {
  initializeTransaction(payload: InitializeTransactionPayload): Promise<Omit<InitializePaymentResult, 'paymentId'>>;
  verifyTransaction(providerReference: string): Promise<VerifyTransactionResponse>;
  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean;
}
