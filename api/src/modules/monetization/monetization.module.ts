import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonetizationService } from './monetization.service';
import { FeeService } from './fee.service';
import { StripeMonetizationProvider } from './providers/stripe-monetization.provider';
import { ChapaMonetizationProvider } from './providers/chapa-monetization.provider';
import { MonetizationController } from './monetization.controller';
import { MonetizationWebhookController } from './monetization-webhook.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [MonetizationController, MonetizationWebhookController],
  providers: [
    MonetizationService,
    FeeService,
    StripeMonetizationProvider,
    ChapaMonetizationProvider,
  ],
  exports: [MonetizationService],
})
export class MonetizationModule {}
