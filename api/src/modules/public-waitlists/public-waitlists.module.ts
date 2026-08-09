import { Module } from '@nestjs/common';
import { PublicWaitlistsController } from './public-waitlists.controller';
import { PublicWaitlistsService } from './public-waitlists.service';
import { BrandingModule } from '../branding/branding.module';
import { WidgetsModule } from '../widgets/widgets.module';
import { PaymentModule } from '../payments/payment.module';

import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [BrandingModule, WidgetsModule, PaymentModule, AnalyticsModule],
  controllers: [PublicWaitlistsController],
  providers: [PublicWaitlistsService],
})
export class PublicWaitlistsModule {}
