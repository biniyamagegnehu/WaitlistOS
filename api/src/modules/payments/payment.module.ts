import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { ChapaService } from './providers/chapa/chapa.service';
import { StripeService } from './providers/stripe/stripe.service';
import { ChapaWebhookController } from './providers/chapa/chapa.webhook';
import { StripeWebhookController } from './providers/stripe/stripe.webhook';
import { SubscriptionGuard } from './guards/subscription.guard';
import { EmailsModule } from '../emails/emails.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';

@Module({
  imports: [forwardRef(() => EmailsModule), forwardRef(() => AffiliatesModule)],
  controllers: [PaymentController, ChapaWebhookController, StripeWebhookController],
  providers: [
    PaymentService,
    PaymentRepository,
    ChapaService,
    StripeService,
    SubscriptionGuard,
  ],
  exports: [PaymentService, SubscriptionGuard],
})
export class PaymentModule {}
