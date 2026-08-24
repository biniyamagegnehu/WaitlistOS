import { MonetizationPaymentType, PaymentProvider, PreOrderDepositPolicy } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  waitlistId: string;

  @IsString()
  @IsOptional()
  participantId?: string;

  @IsEnum(PaymentProvider)
  @IsOptional()
  provider?: PaymentProvider;

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

export class UpdatePreOrderDepositConfigDto {
  @IsBoolean()
  @IsOptional()
  preOrderDepositEnabled?: boolean;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  preOrderDepositAmount?: number;

  @IsString()
  @IsOptional()
  preOrderDepositCurrency?: string;

  @IsEnum(PreOrderDepositPolicy)
  @IsOptional()
  preOrderDepositPolicy?: PreOrderDepositPolicy;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  preOrderDepositDescription?: string;
}
