import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MonetizationService } from './monetization.service';
import { FeeService } from './fee.service';
import { StripeMonetizationProvider } from './providers/stripe-monetization.provider';
import { ChapaMonetizationProvider } from './providers/chapa-monetization.provider';
import { MonetizationController } from './monetization.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ParticipantsModule } from '../participants/participants.module';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [PrismaModule, ConfigModule, forwardRef(() => ParticipantsModule), EmailsModule],
  controllers: [MonetizationController],
  providers: [
    MonetizationService,
    FeeService,
    StripeMonetizationProvider,
    ChapaMonetizationProvider,
  ],
  exports: [MonetizationService],
})
export class MonetizationModule {}
