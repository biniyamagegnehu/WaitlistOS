import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonetizationPayment, PaymentAccount } from '@prisma/client';
import { IMonetizationProvider, InitializePaymentResult, WebhookEventResult } from './monetization-provider.interface';
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
          title: `WaitlistOS: ${payment.paymentType}`,
          description: 'Payment',
        },
        subaccounts: [
          {
            id: account.providerAccountId,
            split_type: 'flat',
            transaction_charge: Number(payment.founderAmount).toString(), // The founder receives this
          },
        ],
      };

      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.status || data.status !== 'success') {
        throw new Error(data.message || 'Failed to initialize Chapa payment');
      }

      return {
        checkoutUrl: data.data.checkout_url,
        providerPaymentId: payment.id, // For Chapa we use our tx_ref as the payment ID reference
      };
    } catch (error) {
      this.logger.error(`Chapa checkout failed: ${error instanceof Error ? error.message : String(error)}`);
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

    return {
      providerPaymentId: payload.tx_ref,
      status,
      providerEventId,
      eventType: payload.event || payload.status,
      payload,
    };
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
