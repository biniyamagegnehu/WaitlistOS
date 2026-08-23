import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@prisma/client';
import {
  IAffiliatePayoutProvider,
  AffiliatePayoutProviderContext,
  InitiatePayoutResult,
} from './affiliate-payout-provider.interface';

/**
 * Chapa affiliate payout provider.
 *
 * Uses Chapa's Transfer API to send ETB payouts to recipient accounts.
 * Reference: https://developer.chapa.co/docs/transfers/
 *
 * IMPORTANT: Chapa does not support automated refunds; the payout is considered
 * terminal once queued. Status polling is done via the Chapa verify endpoint.
 */
@Injectable()
export class ChapaAffiliatePayoutProvider implements IAffiliatePayoutProvider {
  readonly provider = PaymentProvider.CHAPA;
  private readonly logger = new Logger(ChapaAffiliatePayoutProvider.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('chapa.baseUrl') ?? 'https://api.chapa.co/v1';
    this.secretKey = this.configService.get<string>('chapa.secretKey') ?? '';
  }

  private assertConfigured() {
    if (!this.secretKey) {
      throw new Error('Chapa is not configured. Set CHAPA_SECRET_KEY.');
    }
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initiatePayout(
    amount: string,
    currency: string,
    idempotencyKey: string,
    context: AffiliatePayoutProviderContext,
  ): Promise<InitiatePayoutResult> {
    this.assertConfigured();

    try {
      const body = {
        account_name: context.metadata?.['accountName'] ?? '',
        account_number: context.providerAccountId,
        amount: parseFloat(amount),
        currency: currency,
        reference: idempotencyKey,
        bank_code: context.metadata?.['bankCode'] ?? '',
      };

      const response = await fetch(`${this.baseUrl}/transfers`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });

      const data: any = await response.json();

      if (!response.ok) {
        this.logger.error(`Chapa transfer failed: ${JSON.stringify(data)}`);
        return {
          providerTransactionId: idempotencyKey,
          status: 'FAILED',
          failureReason: data?.message ?? 'Chapa transfer request failed',
        };
      }

      const txRef: string = data?.data?.transfer_reference ?? idempotencyKey;
      this.logger.log(`Chapa transfer queued: ${txRef} for ${amount} ${currency}`);

      // Chapa queues transfers; they become final asynchronously
      return {
        providerTransactionId: txRef,
        status: 'PROCESSING',
      };
    } catch (err: any) {
      this.logger.error(`Chapa transfer exception: ${err.message}`);
      return {
        providerTransactionId: idempotencyKey,
        status: 'FAILED',
        failureReason: err.message,
      };
    }
  }

  async getPayoutStatus(
    providerTransactionId: string,
    _context: AffiliatePayoutProviderContext,
  ): Promise<InitiatePayoutResult> {
    this.assertConfigured();

    try {
      const response = await fetch(
        `${this.baseUrl}/transfers/verify/${providerTransactionId}`,
        { headers: this.headers },
      );

      const data: any = await response.json();

      if (!response.ok) {
        return {
          providerTransactionId,
          status: 'FAILED',
          failureReason: data?.message ?? 'Verification failed',
        };
      }

      const chapaStatus: string = (data?.data?.status ?? '').toLowerCase();
      let status: InitiatePayoutResult['status'] = 'PROCESSING';
      if (chapaStatus === 'success' || chapaStatus === 'transferred') {
        status = 'PAID';
      } else if (chapaStatus === 'failed') {
        status = 'FAILED';
      }

      return {
        providerTransactionId,
        status,
        failureReason: status === 'FAILED' ? (data?.data?.reason ?? 'Unknown') : undefined,
      };
    } catch (err: any) {
      return {
        providerTransactionId,
        status: 'FAILED',
        failureReason: err.message,
      };
    }
  }
}
