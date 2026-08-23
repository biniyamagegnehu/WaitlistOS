import { Module } from '@nestjs/common';
import { AffiliatesController } from './affiliates.controller';
import { AffiliateTrackingController } from './affiliate-tracking.controller';
import { AffiliatesService } from './affiliates.service';
import { AffiliatePayoutsService } from './services/affiliate-payouts.service';
import { AffiliateCommissionEngine } from './services/affiliate-commission.engine';
import { StripeAffiliatePayoutProvider } from './providers/stripe-affiliate-payout.provider';
import { ChapaAffiliatePayoutProvider } from './providers/chapa-affiliate-payout.provider';
import { AffiliatePayoutCron } from './affiliate-payout.cron';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AffiliatesController, AffiliateTrackingController],
  providers: [
    AffiliatesService,
    AffiliatePayoutsService,
    AffiliateCommissionEngine,
    StripeAffiliatePayoutProvider,
    ChapaAffiliatePayoutProvider,
    AffiliatePayoutCron,
  ],
  exports: [AffiliatesService, AffiliateCommissionEngine, AffiliatePayoutsService],
})
export class AffiliatesModule {}
