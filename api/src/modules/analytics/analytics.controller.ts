import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateFunnelEventDto } from './dto/funnel-event.dto';
import { FunnelAggregationCron } from './funnel-aggregation.cron';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('waitlists/:waitlistId/analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly funnelAggregationCron: FunnelAggregationCron,
  ) {}

  @Get('sources')
  async getSourceAnalytics(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    return this.analyticsService.getSourceAnalytics(waitlistId, user.userId, fromDate, toDate);
  }

  @Get('audience')
  async getAudienceAnalytics(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    return this.analyticsService.getAudienceAnalytics(waitlistId, user.userId, fromDate, toDate);
  }

  @Get('conversion-funnel')
  async getConversionFunnel(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    return this.analyticsService.getConversionFunnel(waitlistId, user.userId, fromDate, toDate);
  }

  @Post('aggregate-funnel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async triggerFunnelAggregation(
    @Param('waitlistId') waitlistId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.funnelAggregationCron.aggregateFunnelEvents();
  }
}

@Controller('analytics/funnel')
export class FunnelAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('events')
  @HttpCode(HttpStatus.NO_CONTENT)
  async recordFunnelEvent(@Body() body: CreateFunnelEventDto) {
    await this.analyticsService.recordFunnelEvent(
      body.waitlistId,
      body.sessionId,
      body.eventType,
    );
  }
}
