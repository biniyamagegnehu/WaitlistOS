import { Controller, Post, Req, Headers, BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentProvider } from '@prisma/client';
import { MonetizationService } from './monetization.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('monetization/webhooks')
export class MonetizationWebhookController {
  constructor(private readonly monetizationService: MonetizationService) {}

  /**
   * POST /api/monetization/webhooks/stripe
   *
   * Receives Stripe event webhooks. This route is public — Stripe servers
   * do not send a JWT. Signature verification is performed inside the service.
   */
  @Public()
  @Post('stripe')
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) throw new BadRequestException('Missing stripe-signature header');

    // NestFactory is bootstrapped with rawBody: true, so req.rawBody is available.
    const rawBody = (req as any).rawBody?.toString('utf8') ?? JSON.stringify(req.body);

    return this.monetizationService.handleWebhook(PaymentProvider.STRIPE, rawBody, signature);
  }

  /**
   * POST /api/monetization/webhooks/chapa
   *
   * Receives Chapa event webhooks. This route is public — Chapa servers
   * do not send a JWT. Signature verification is performed inside the service.
   */
  @Public()
  @Post('chapa')
  async handleChapaWebhook(
    @Req() req: Request,
    @Headers('chapa-signature') signature: string,
  ) {
    if (!signature) throw new BadRequestException('Missing chapa-signature header');

    const rawBody = (req as any).rawBody?.toString('utf8') ?? JSON.stringify(req.body);
    return this.monetizationService.handleWebhook(PaymentProvider.CHAPA, rawBody, signature);
  }
}
