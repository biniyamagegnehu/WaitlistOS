import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { AffiliatesService } from './affiliates.service';
import { PaymentProvider } from '@prisma/client';
import {
  AFFILIATE_ATTRIBUTION_COOKIE_DAYS,
  AFFILIATE_ATTRIBUTION_COOKIE_NAME,
} from './affiliate.constants';

@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  /**
   * GET /api/affiliates/me
   * Get or auto-create the affiliate profile for the authenticated founder.
   */
  @UseGuards(AccessTokenGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return this.affiliatesService.getOrCreateAffiliate(req.user.userId);
  }

  /**
   * GET /api/affiliates/dashboard
   * Full affiliate dashboard data — stats, commissions, payouts, connected providers.
   */
  @UseGuards(AccessTokenGuard)
  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    return this.affiliatesService.getDashboard(req.user.userId);
  }

  /**
   * PATCH /api/affiliates/payout-preference
   * Set the affiliate's preferred payout provider (must already be connected in Payment Settings).
   */
  @UseGuards(AccessTokenGuard)
  @Patch('payout-preference')
  async setPayoutPreference(
    @Req() req: any,
    @Body() body: { provider: PaymentProvider },
  ) {
    return this.affiliatesService.setPreferredPayoutProvider(req.user.userId, body.provider);
  }
}
