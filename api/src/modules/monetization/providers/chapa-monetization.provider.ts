import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonetizationPayment, PaymentAccount } from '@prisma/client';
import { IMonetizationProvider, InitializePaymentResult, WebhookEventResult, VerifyPaymentResult } from './monetization-provider.interface';
import * as crypto from 'crypto';

@Injectable()
export class ChapaMonetizationProvider implements IMonetizationProvider {
  private readonly logger = new Logger(ChapaMonetizationProvider.name);
  private readonly secretKey: string;
  private readonly baseUrl: string;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('chapa.secretKey') ?? '';
    this.baseUrl = this.configService.get<string>('chapa.baseUrl') ?? 'https://api.chapa.co/v1';
    this.webhookSecret = this.configService.get<string>('chapa.webhookSecret') ?? '';
  }

  async initializePayment(
    payment: MonetizationPayment,
    account: PaymentAccount,
    returnUrl: string,
    cancelUrl: string,
    customerEmail: string,
    metadata?: Record<string, string>,
  ): Promise<InitializePaymentResult> {
    try {
      const payload = {
        amount: Number(payment.amount).toString(),
        currency: payment.currency,
        email: customerEmail,
        first_name: 'Customer',
        last_name: 'Customer',
        tx_ref: payment.id,
        callback_url: returnUrl,
        return_url: returnUrl,
        customization: {
          title: 'Getlist',
          description: 'Payment',
        },
        subaccount: account.providerAccountId,
        split_type: 'flat',
        split_value: Number(payment.founderAmount).toString(),
      };

      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        this.logger.error(`Failed to parse Chapa response as JSON: ${responseText}`);
        throw new Error('Invalid response from Chapa API');
      }

      if (!data.status || data.status !== 'success') {
        const errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message || data);
        this.logger.error(`Chapa API error: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      return {
        checkoutUrl: data.data.checkout_url,
        providerPaymentId: payment.id, // For Chapa we use our tx_ref as the payment ID reference
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chapa checkout failed: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        this.logger.error(`Chapa checkout stack: ${error.stack}`);
      }
      throw new Error('Failed to initialize Chapa payment');
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    if (!this.webhookSecret || !signature) return false;
    const hash = crypto.createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    return hash === signature;
  }

  async parseWebhookEvent(rawBody: string, signature: string | undefined): Promise<WebhookEventResult> {
    const payload = JSON.parse(rawBody);

    // Chapa doesn't always provide a distinct event ID in webhooks like Stripe,
    // so we compose one from tx_ref and event type (status) to ensure idempotency.
    const providerEventId = `${payload.tx_ref}_${payload.event || payload.status}`;

    let status: 'SUCCESS' | 'FAILED' | 'PENDING' = 'PENDING';
    if (payload.status === 'success') {
      status = 'SUCCESS';
    } else if (payload.status === 'failed') {
      status = 'FAILED';
    }

    // Extract the actual charged amount and currency from Chapa webhook
    // Chapa provides amount and currency in the webhook payload
    const chargedAmount = payload.amount ? parseFloat(payload.amount) : undefined;
    const chargedCurrency = payload.currency ? payload.currency.toUpperCase() : undefined;

    return {
      providerPaymentId: payload.tx_ref,
      status,
      providerEventId,
      eventType: payload.event || payload.status,
      payload,
      chargedAmount,
      chargedCurrency,
    };
  }

  async verifyPayment(
    paymentId: string,
    account: PaymentAccount,
  ): Promise<VerifyPaymentResult> {
    try {
      this.logger.log(`Verifying Chapa payment with ID: ${paymentId}`);
      const response = await fetch(`${this.baseUrl}/transaction/verify/${paymentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      this.logger.log(`Chapa verify response status: ${response.status}`);
      this.logger.log(`Chapa verify response body: ${responseText}`);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        this.logger.error(`Failed to parse Chapa verify response as JSON: ${responseText}`);
        throw new Error('Invalid response from Chapa API');
      }

      if (!data.status || data.status !== 'success') {
        const errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message || data);
        this.logger.error(`Chapa verify error: ${errorMessage}`);
        return {
          status: 'PENDING',
          providerPaymentId: paymentId,
        };
      }

      // Check the payment status from Chapa
      const chapaStatus = data.data?.status;
      this.logger.log(`Chapa payment status: ${chapaStatus}`);
      
      let status: 'SUCCEEDED' | 'FAILED' | 'PENDING' = 'PENDING';
      
      if (chapaStatus === 'success') {
        status = 'SUCCEEDED';
        this.logger.log(`Chapa payment ${paymentId} verified as SUCCEEDED`);
      } else if (chapaStatus === 'failed') {
        status = 'FAILED';
        this.logger.log(`Chapa payment ${paymentId} verified as FAILED`);
      } else {
        this.logger.log(`Chapa payment ${paymentId} status is ${chapaStatus}, treating as PENDING`);
      }

      return {
        status,
        providerPaymentId: paymentId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chapa payment verification failed: ${errorMessage}`);
      return {
        status: 'PENDING',
        providerPaymentId: paymentId,
      };
    }
  }

  /**
   * Helper to create a subaccount for a founder on Chapa
   */
  async createSubaccount(bankCode: string, accountNumber: string, businessName: string): Promise<string> {
    const payload = {
      business_name: businessName,
      account_name: businessName,
      bank_code: bankCode,
      account_number: accountNumber,
      split_type: 'percentage',
      split_value: 0.1, // WaitlistOS uses exact transaction_charge during checkout, so this is just default
    };

    const response = await fetch(`${this.baseUrl}/subaccount`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.status || data.status !== 'success') {
      throw new Error(data.message || 'Failed to create Chapa subaccount');
    }

    return data.data.subaccount_id;
  }
}
