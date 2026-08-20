import { MonetizationPaymentType, PaymentProvider } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  waitlistId: string;

  @IsString()
  @IsOptional()
  participantId?: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsEnum(MonetizationPaymentType)
  paymentType: MonetizationPaymentType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  currency: string;
}

/**
 * Stripe Connect is initiated by a POST with no body — the founder's identity
 * comes from the JWT. No OAuth code needed (we use Account Links, not OAuth).
 */

export class ConnectChapaDto {
  @IsString()
  bankCode: string;

  @IsString()
  accountNumber: string;

  @IsString()
  businessName: string;
}
