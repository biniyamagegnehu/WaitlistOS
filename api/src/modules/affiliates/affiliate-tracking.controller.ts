import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AffiliatesService } from './affiliates.service';
import {
  AFFILIATE_ATTRIBUTION_COOKIE_DAYS,
  AFFILIATE_ATTRIBUTION_COOKIE_NAME,
} from './affiliate.constants';
import * as crypto from 'crypto';

/**
 * Handles public affiliate click tracking.
 * No authentication required — this endpoint is hit when visitors
 * arrive via an affiliate link (e.g. https://waitlistos.com/?ref=ABC123).
 */
@Controller('affiliates')
export class AffiliateTrackingController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  /**
   * GET /api/affiliates/track?ref=ABC123
   *
   * Records the affiliate click and sets a 30-day HTTP-only attribution cookie.
   * The cookie contains the affiliate code (opaque to the client).
   * No sensitive financial data is stored in the cookie.
   *
   * Cookie format: { ref: 'ABC123', clickId: 'uuid', ts: timestamp }
   * Encoded as base64 JSON for URL safety.
   */
  @Public()
  @Get('track')
  async trackClick(
    @Query('ref') refCode: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!refCode) {
      return { tracked: false, reason: 'Missing ref parameter' };
    }

    // Privacy-safe: hash the IP rather than storing raw address
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? '';
    const ipHash = rawIp ? crypto.createHash('sha256').update(rawIp).digest('hex') : undefined;

    const userAgent = req.headers['user-agent'] ?? '';
    const deviceType = /mobile|android|iphone|ipad/i.test(userAgent) ? 'mobile' : 'desktop';

    // Opaque session token from existing session cookie or generate one
    const sessionToken =
      (req.cookies?.['session_token'] as string) ??
      crypto.randomBytes(12).toString('hex');

    const result = await this.affiliatesService.trackClick(refCode, {
      sessionToken,
      ipHash,
      deviceType,
    });

    if (!result) {
      return { tracked: false, reason: 'Invalid or inactive affiliate code' };
    }

    // Encode cookie value: affiliate code + clickId for attribution at signup
    const cookiePayload = Buffer.from(
      JSON.stringify({ ref: result.affiliateCode, clickId: result.clickId }),
    ).toString('base64');

    res.cookie(AFFILIATE_ATTRIBUTION_COOKIE_NAME, cookiePayload, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: AFFILIATE_ATTRIBUTION_COOKIE_DAYS * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return { tracked: true, ref: result.affiliateCode };
  }
}
