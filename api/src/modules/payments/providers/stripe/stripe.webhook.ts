import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../../../common/decorators/public.decorator';
import { PaymentService } from '../../payment.service';
import { StripeService } from './stripe.service';

@Controller('payments/stripe')
export class StripeWebhookController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly stripeService: StripeService,
  ) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    const rawBody = req.rawBody?.toString('utf8');
    
    if (!rawBody) {
      return { success: false, message: 'Missing raw body' };
    }

    if (!this.stripeService.verifyWebhookSignature(rawBody, signature)) {
      return { success: false, message: 'Invalid signature' };
    }

    const event = this.stripeService.constructEvent(rawBody, signature!);
    
    // Convert stripe event to our internal structure so PaymentService can handle it
    const txRef = event.data.object && 'client_reference_id' in (event.data.object as any) 
      ? (event.data.object as any).client_reference_id 
      : undefined;

    let status = 'pending';
    if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') {
      status = 'success';
    } else if (event.type === 'invoice.payment_failed') {
      status = 'failed';
    }

    // Call the generic handleWebhook in PaymentService
    // We pass a transformed payload that looks similar to what PaymentService expects
    const payload = {
      tx_ref: txRef,
      event: event.type,
      status,
      reference: event.id,
      ...event.data.object as object,
    };

    // Note: Since Stripe uses its own signature verification, we already verified it above.
    // So we don't pass a signature to `handleWebhook` or we adapt `handleWebhook` to skip Chapa verification.
    return this.paymentService.handleStripeWebhook(payload);
  }
}
