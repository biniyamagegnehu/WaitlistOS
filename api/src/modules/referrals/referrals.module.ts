import { Module } from '@nestjs/common';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { BrandingModule } from '../branding/branding.module';
import { PaymentModule } from '../payments/payment.module';

@Module({
  imports: [BrandingModule, PaymentModule],
  controllers: [ReferralsController],
  providers: [ReferralsService],
})
export class ReferralsModule {}
