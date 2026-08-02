import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../../../common/decorators/public.decorator';
import { PaymentService } from '../../payment.service';

@Controller('payments/chapa')
export class ChapaWebhookController {
  constructor(private readonly paymentService: PaymentService) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-chapa-signature') signature: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const rawBody =
      req.rawBody?.toString('utf8') ??
      (typeof body === 'string' ? body : JSON.stringify(body));

    return this.paymentService.handleChapaWebhook(rawBody, signature);
  }
}
