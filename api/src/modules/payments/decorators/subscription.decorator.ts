import { SetMetadata } from '@nestjs/common';
import { SubscriptionPlanCode } from '@prisma/client';

export const REQUIRE_PLAN_KEY = 'require_plan';
export const REQUIRE_FEATURE_KEY = 'require_feature';

export const RequirePlan = (...plans: SubscriptionPlanCode[]) =>
  SetMetadata(REQUIRE_PLAN_KEY, plans);

export type PremiumFeature =
  | 'UNLIMITED_WAITLISTS'
  | 'EMBED_WIDGET'
  | 'DYNAMIC_OG'
  | 'ADVANCED_ANALYTICS'
  | 'CUSTOM_BRANDING'
  | 'API_ACCESS';

export const RequireFeature = (...features: PremiumFeature[]) =>
  SetMetadata(REQUIRE_FEATURE_KEY, features);
