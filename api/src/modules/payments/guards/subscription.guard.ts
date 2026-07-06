import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionPlanCode } from '@prisma/client';
import {
  REQUIRE_FEATURE_KEY,
  REQUIRE_PLAN_KEY,
  type PremiumFeature,
} from '../decorators/subscription.decorator';
import { PaymentService } from '../payment.service';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly paymentService: PaymentService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlans = this.reflector.getAllAndOverride<
      SubscriptionPlanCode[] | undefined
    >(REQUIRE_PLAN_KEY, [context.getHandler(), context.getClass()]);

    const requiredFeatures = this.reflector.getAllAndOverride<
      PremiumFeature[] | undefined
    >(REQUIRE_FEATURE_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPlans?.length && !requiredFeatures?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('AUTHENTICATION_REQUIRED');
    }

    if (requiredPlans?.length) {
      await this.paymentService.assertMinimumPlan(user.userId, requiredPlans);
    }

    for (const feature of requiredFeatures ?? []) {
      await this.paymentService.assertFeatureAccess(user.userId, feature);
    }

    return true;
  }
}
