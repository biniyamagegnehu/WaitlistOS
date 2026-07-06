import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { PaymentModule } from '../../payments/payment.module';

@Module({
  imports: [PaymentModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
