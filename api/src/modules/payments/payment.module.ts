import { Module, forwardRef } from '@nestjs/common';
import { PaymentController, PaymentWebhookController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { ChapaService } from './chapa/chapa.service';
import { SubscriptionGuard } from './guards/subscription.guard';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [forwardRef(() => EmailsModule)],
  controllers: [PaymentController, PaymentWebhookController],
  providers: [
    PaymentService,
    PaymentRepository,
    ChapaService,
    SubscriptionGuard,
  ],
  exports: [PaymentService, SubscriptionGuard],
})
export class PaymentModule {}
