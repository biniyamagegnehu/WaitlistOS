import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  ChapaInitializePayload,
  ChapaInitializeResponse,
  ChapaVerifyResponse,
} from '../interfaces/payment.interfaces';

@Injectable()
export class ChapaService {
  private readonly logger = new Logger(ChapaService.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('chapa.baseUrl') ??
      'https://api.chapa.co/v1';
    this.secretKey = this.configService.get<string>('chapa.secretKey') ?? '';
    this.webhookSecret =
      this.configService.get<string>('chapa.webhookSecret') ?? '';
  }

  async initializeTransaction(
    payload: ChapaInitializePayload,
  ): Promise<ChapaInitializeResponse> {
    this.assertConfigured();

    const requestBody = {
      amount: payload.amount,
      currency: payload.currency,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      tx_ref: payload.tx_ref,
      callback_url: payload.callback_url,
      return_url: payload.return_url,
    };

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      this.logger.error(
        `Chapa initialize network error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('PAYMENT_PROVIDER_UNAVAILABLE');
    }

    const body = (await response.json()) as ChapaInitializeResponse;

    if (!response.ok || body.status !== 'success') {
      this.logger.error(`Chapa initialize failed: ${JSON.stringify(body)}`);
      throw new BadRequestException('PAYMENT_INITIALIZATION_FAILED');
    }

    this.extractCheckoutUrl(body);
    return body;
  }

  extractCheckoutUrl(body: ChapaInitializeResponse): string {
    const data = body.data as
      | { checkout_url?: string; checkoutUrl?: string }
      | undefined;
    const checkoutUrl = data?.checkout_url ?? data?.checkoutUrl;

    if (!checkoutUrl) {
      this.logger.error(`Chapa response missing checkout URL: ${JSON.stringify(body)}`);
      throw new BadRequestException('PAYMENT_INITIALIZATION_FAILED');
    }

    return checkoutUrl;
  }

  async verifyTransaction(txRef: string): Promise<ChapaVerifyResponse> {
    this.assertConfigured();

    let response: Response;
    try {
      response = await fetch(
        `${this.baseUrl}/transaction/verify/${encodeURIComponent(txRef)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Chapa verify network error: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException('PAYMENT_PROVIDER_UNAVAILABLE');
    }

    const body = (await response.json()) as ChapaVerifyResponse;

    if (!response.ok) {
      this.logger.error(`Chapa verify failed: ${JSON.stringify(body)}`);
      throw new BadRequestException('PAYMENT_VERIFICATION_FAILED');
    }

    return body;
  }

  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('CHAPA_WEBHOOK_SECRET is not configured');
      return false;
    }

    if (!signature) {
      return false;
    }

    const crypto = require('crypto') as typeof import('crypto');
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature),
      );
    } catch {
      return false;
    }
  }

  private assertConfigured() {
    if (!this.secretKey) {
      throw new InternalServerErrorException('CHAPA_NOT_CONFIGURED');
    }
  }
}
