import { Controller, Get, Post, Body, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { PublicWaitlistsService } from './public-waitlists.service';
import { Public } from '../../common/decorators/public.decorator';
import { AnalyticsService } from '../analytics/analytics.service';
import { TrafficSource } from '@prisma/client';

const VALID_SOURCES = new Set<string>(Object.values(TrafficSource));

function toTrafficSource(raw: unknown): TrafficSource {
  if (typeof raw === 'string' && VALID_SOURCES.has(raw)) {
    return raw as TrafficSource;
  }
  return TrafficSource.UNKNOWN;
}

@Controller('w')
export class PublicWaitlistsController {
  constructor(
    private readonly publicWaitlistsService: PublicWaitlistsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Public()
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  findBySlug(@Param('slug') slug: string) {
    return this.publicWaitlistsService.findBySlug(slug);
  }

  @Public()
  @Post(':slug/visit')
  @HttpCode(HttpStatus.OK)
  async recordVisit(
    @Param('slug') slug: string,
    @Body() body: { sessionId?: string; source?: string; medium?: string; campaign?: string },
  ) {
    // Require sessionId; source defaults to DIRECT if missing/invalid
    if (!body?.sessionId) return;

    const source = toTrafficSource(body.source ?? 'DIRECT');
    const waitlist = await this.analyticsService.recordVisit(
      slug,
      body.sessionId,
      source,
      body.medium,
      body.campaign,
    );

    return { success: true, data: { waitlist } };
  }
}
