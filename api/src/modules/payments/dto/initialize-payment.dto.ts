import { SubscriptionPlanCode } from '@prisma/client';
import { IsEnum, IsIn, IsNotEmpty } from 'class-validator';

const PAID_PLANS = [SubscriptionPlanCode.STARTER, SubscriptionPlanCode.PRO] as const;

export class InitializePaymentDto {
  @IsEnum(SubscriptionPlanCode)
  @IsIn(PAID_PLANS)
  @IsNotEmpty()
  plan!: SubscriptionPlanCode;
}
export class VerifyPaymentQueryDto {
  @IsNotEmpty()
  txRef!: string;
}
