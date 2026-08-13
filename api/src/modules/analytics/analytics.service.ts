import { Injectable, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrafficSource, FunnelEventType, GrowthPeriodType, Prisma } from '@prisma/client';

export interface SourcePerformance {
  source: TrafficSource | 'DIRECT' | 'UNKNOWN';
  visitors: number;
  signups: number;
  conversionRate: number;
}

export interface AnalyticsResponse {
  totalVisitors: number;
  totalSignups: number;
  overallConversionRate: number;
  sources: SourcePerformance[];
}

export interface FunnelStep {
  type: FunnelEventType;
  label: string;
  count: number;
  conversionRate: number | null;
  dropOff: number | null;
  dropOffRate: number | null;
}

export interface ConversionFunnelResponse {
  pageVisits: number;
  formFocus: number;
  signupSubmitted: number;
  referralShared: number;
  overallSignupConversion: number | null;
  referralShareRate: number | null;
  steps: FunnelStep[];
}

export interface GrowthDataPoint {
  timestamp: string;
  signupCount: number;
}

export interface ReferralSpikeData {
  id: string;
  referrerParticipantId: string;
  startAt: string;
  endAt: string;
  signupCount: number;
}

export interface GrowthVelocityResponse {
  hourly: GrowthDataPoint[];
  daily: GrowthDataPoint[];
  spikes: ReferralSpikeData[];
  summary: {
    totalSignups: number;
    peakHour: { timestamp: string; signupCount: number } | null;
    spikeCount: number;
  };
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Resolves an optional waitlist filter without ever trusting a client ID. */
  private async getAuthorizedWaitlistIds(userId: string, waitlistId?: string): Promise<string[]> {
    const waitlists = await this.prisma.waitlist.findMany({
      where: { founder: { userId }, ...(waitlistId ? { id: waitlistId } : {}) },
      select: { id: true },
    });

    if (waitlistId && waitlists.length === 0) {
      throw new UnauthorizedException('Access denied');
    }

    return waitlists.map((waitlist) => waitlist.id);
  }

  async getSourceAnalytics(
    waitlistId: string | undefined,
    userId: string,
    from?: Date,
    to?: Date,
  ): Promise<AnalyticsResponse> {
    const waitlistIds = await this.getAuthorizedWaitlistIds(userId, waitlistId);

    // 2. Build date filters
    const visitWhere: Prisma.AttributionVisitWhereInput = {
      waitlistId: { in: waitlistIds },
      ...(from || to ? { timestamp: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
    };

    const signupWhere: Prisma.ParticipantWhereInput = {
      waitlistId: { in: waitlistIds },
      ...(from || to ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
    };

    // 3. Aggregate visitors
    // We group by source and count unique sessionIds
    // Because Prisma's groupBy doesn't support distinct count easily with groupBy natively in all cases,
    // we can use a custom aggregate or fetch and process for MVP, but Prisma handles count!
    const visitorAggregations = await this.prisma.attributionVisit.groupBy({
      by: ['source'],
      where: visitWhere,
      _count: { sessionId: true }, // We should distinct on sessionId if possible, or assume 1 record per session
    });

    // 4. Aggregate signups
    const signupAggregations = await this.prisma.participant.groupBy({
      by: ['source'],
      where: signupWhere,
      _count: { id: true },
    });

    const sourcesMap = new Map<TrafficSource | 'UNKNOWN' | 'DIRECT', { visitors: number; signups: number }>();

    let totalVisitors = 0;
    let totalSignups = 0;

    // Process visitors
    for (const agg of visitorAggregations) {
      const src = agg.source;
      const count = agg._count.sessionId;
      sourcesMap.set(src, { visitors: count, signups: 0 });
      totalVisitors += count;
    }

    // Process signups.
    // Participants whose source is NULL signed up before tracking was set up
    // (or directly without any attribution cookie). We bucket them as DIRECT.
    for (const agg of signupAggregations) {
      const src = agg.source ?? TrafficSource.DIRECT;
      const count = agg._count.id;

      const current = sourcesMap.get(src) ?? { visitors: 0, signups: 0 };
      current.signups += count;
      sourcesMap.set(src, current);
      totalSignups += count;
    }

    // 5. Calculate conversion rates.
    //    - Cap at 100 % (can exceed if someone signed up without a prior visit ping).
    //    - If visitors = 0 but signups > 0, report 100 % (they converted on the first touch).
    const sources: SourcePerformance[] = Array.from(sourcesMap.entries()).map(([source, data]) => {
      let conversionRate: number;
      if (data.visitors === 0 && data.signups === 0) {
        conversionRate = 0;
      } else if (data.visitors === 0) {
        // Signed up without a tracked visit — treat as 100 % conversion
        conversionRate = 100;
      } else {
        conversionRate = Math.min((data.signups / data.visitors) * 100, 100);
      }
      return {
        source,
        visitors: data.visitors,
        signups: data.signups,
        conversionRate: Number(conversionRate.toFixed(1)),
      };
    });

    // Overall rate: use max(visitors, signups) as denominator so we don't show
    // 0% when visit tracking wasn't enabled yet but signups already exist.
    const denominator = Math.max(totalVisitors, totalSignups);
    const overallConversionRate =
      denominator > 0 ? Math.min((totalSignups / Math.max(totalVisitors, 1)) * 100, 100) : 0;

    return {
      totalVisitors,
      totalSignups,
      overallConversionRate: Number(overallConversionRate.toFixed(1)),
      sources: sources.sort((a, b) => b.signups - a.signups),
    };
  }

  async recordVisit(
    waitlistSlug: string,
    sessionId: string,
    source: TrafficSource,
    medium?: string,
    campaign?: string,
  ) {
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { slug: waitlistSlug },
    });
    if (!waitlist) throw new NotFoundException('Waitlist not found');

    // Deduplicate: avoid creating multiple visits for the same session per waitlist within short period
    // Simple deduplication: Check if there's already a visit for this session
    const existingVisit = await this.prisma.attributionVisit.findFirst({
      where: { waitlistId: waitlist.id, sessionId },
    });

    if (existingVisit) {
      return waitlist;
    }

    await this.prisma.attributionVisit.create({
      data: {
        waitlistId: waitlist.id,
        sessionId,
        source,
        medium,
        campaign,
      },
    });

    return waitlist;
  }

  async getAudienceAnalytics(
    waitlistId: string | undefined,
    userId: string,
    from?: Date,
    to?: Date,
  ) {
    const waitlistIds = await this.getAuthorizedWaitlistIds(userId, waitlistId);

    const where: Prisma.ParticipantWhereInput = {
      waitlistId: { in: waitlistIds },
      ...(from || to ? { createdAt: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
    };

    // 2. Fetch all required aggregations in parallel
    const [
      totalSignupsAgg,
      countryAgg,
      deviceAgg,
      browserAgg
    ] = await Promise.all([
      this.prisma.participant.count({ where }),
      this.prisma.participant.groupBy({
        by: ['countryCode'],
        where,
        _count: { _all: true },
        orderBy: { _count: { countryCode: 'desc' } }
      }),
      this.prisma.participant.groupBy({
        by: ['deviceType'],
        where,
        _count: { _all: true },
        orderBy: { _count: { deviceType: 'desc' } }
      }),
      this.prisma.participant.groupBy({
        by: ['browserName'],
        where,
        _count: { _all: true },
        orderBy: { _count: { browserName: 'desc' } }
      })
    ]);

    const totalSignups = totalSignupsAgg;

    // Helper to calculate percentage safely
    const calcPct = (count: number, total: number) => 
      total > 0 ? Number(((count / total) * 100).toFixed(2)) : 0;

    // Process Countries
    const countries = countryAgg.map(c => ({
      code: c.countryCode || 'Unknown',
      name: c.countryCode ? this.getCountryName(c.countryCode) : 'Unknown',
      signups: c._count._all,
      percentage: calcPct(c._count._all, totalSignups)
    })).sort((a, b) => b.signups - a.signups);

    // Process Devices
    const devices = deviceAgg.map(d => ({
      type: d.deviceType || 'UNKNOWN',
      label: d.deviceType ? this.capitalize(d.deviceType.toLowerCase()) : 'Unknown',
      signups: d._count._all,
      percentage: calcPct(d._count._all, totalSignups)
    })).sort((a, b) => b.signups - a.signups);

    // Process Browsers
    const browsers = browserAgg.map(b => ({
      name: b.browserName || 'Unknown',
      signups: b._count._all,
      percentage: calcPct(b._count._all, totalSignups)
    })).sort((a, b) => b.signups - a.signups);

    const geoAnalyzedSignups = countries.reduce((acc, curr) => curr.code !== 'Unknown' ? acc + curr.signups : acc, 0);

    return {
      totalSignups,
      geoAnalyzedSignups,
      countries,
      devices,
      browsers
    };
  }

  private capitalize(s: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private getCountryName(code: string): string {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    try {
      return displayNames.of(code) || code;
    } catch {
      return code;
    }
  }

  // ─────────────────────────────────────────────
  // Funnel Event Tracking
  // ─────────────────────────────────────────────

  async recordFunnelEvent(
    waitlistId: string,
    sessionId: string,
    eventType: FunnelEventType,
  ) {
    // Validate waitlist exists
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { id: waitlistId },
    });
    if (!waitlist) {
      throw new NotFoundException('Waitlist not found');
    }

    // Deduplication: Check if event already exists for this session
    const existingEvent = await this.prisma.funnelEvent.findFirst({
      where: {
        waitlistId,
        sessionId,
        eventType,
      },
    });

    if (existingEvent) {
      return existingEvent;
    }

    // Create new event
    return this.prisma.funnelEvent.create({
      data: {
        waitlistId,
        sessionId,
        eventType,
      },
    });
  }

  async recordFunnelEventBySlug(
    waitlistSlug: string,
    sessionId: string,
    eventType: FunnelEventType,
  ) {
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { slug: waitlistSlug },
    });
    if (!waitlist) {
      throw new NotFoundException('Waitlist not found');
    }

    return this.recordFunnelEvent(waitlist.id, sessionId, eventType);
  }

  // ─────────────────────────────────────────────
  // Conversion Funnel Analytics
  // ─────────────────────────────────────────────

  async getConversionFunnel(
    waitlistId: string | undefined,
    userId: string,
    from?: Date,
    to?: Date,
  ): Promise<ConversionFunnelResponse> {
    const waitlistIds = await this.getAuthorizedWaitlistIds(userId, waitlistId);

    // 2. Define today's date range (for real-time raw events)
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // 3. Determine date range for historical aggregated stats
    // If no date range specified, use all time except today (today uses raw events)
    const historicalFrom = from || new Date(0);
    const historicalTo = to ? (to < startOfToday ? to : startOfToday) : startOfToday;

    // 4. Fetch aggregated stats for historical dates (excluding today)
    const statsWhere: Prisma.DailyFunnelStatsWhereInput = {
      waitlistId: { in: waitlistIds },
      date: {
        gte: historicalFrom,
        lt: historicalTo,
      },
    };

    const stats = await this.prisma.dailyFunnelStats.findMany({
      where: statsWhere,
      orderBy: { date: 'asc' },
    });

    // 5. Sum historical counts by event type
    const countsByType = new Map<FunnelEventType, number>();
    Object.values(FunnelEventType).forEach(type => countsByType.set(type, 0));

    for (const stat of stats) {
      const current = countsByType.get(stat.eventType) || 0;
      countsByType.set(stat.eventType, current + stat.count);
    }

    // 6. Fetch raw events for today (real-time data)
    // Build date filter for raw events
    const rawEventFrom = from && from >= startOfToday ? from : startOfToday;
    const rawEventTo = to && to <= endOfToday ? to : endOfToday;

    const eventsWhere: Prisma.FunnelEventWhereInput = {
      waitlistId: { in: waitlistIds },
      createdAt: {
        gte: rawEventFrom,
        lte: rawEventTo,
      },
    };

    const todayEvents = await this.prisma.funnelEvent.findMany({
      where: eventsWhere,
    });

    // 7. Add today's raw event counts
    for (const event of todayEvents) {
      const current = countsByType.get(event.eventType) || 0;
      countsByType.set(event.eventType, current + 1);
    }

    const pageVisits = countsByType.get(FunnelEventType.PAGE_VISIT) || 0;
    const formFocus = countsByType.get(FunnelEventType.FORM_FOCUS) || 0;
    const signupSubmitted = countsByType.get(FunnelEventType.SIGNUP_SUBMITTED) || 0;
    const referralShared = countsByType.get(FunnelEventType.REFERRAL_SHARED) || 0;

    // 8. Calculate conversion rates and drop-offs
    const steps: FunnelStep[] = [
      {
        type: FunnelEventType.PAGE_VISIT,
        label: 'Page Visit',
        count: pageVisits,
        conversionRate: null,
        dropOff: null,
        dropOffRate: null,
      },
      {
        type: FunnelEventType.FORM_FOCUS,
        label: 'Form Focus',
        count: formFocus,
        conversionRate: pageVisits > 0 ? (formFocus / pageVisits) * 100 : null,
        dropOff: pageVisits > 0 ? pageVisits - formFocus : null,
        dropOffRate: pageVisits > 0 ? ((pageVisits - formFocus) / pageVisits) * 100 : null,
      },
      {
        type: FunnelEventType.SIGNUP_SUBMITTED,
        label: 'Signup Submitted',
        count: signupSubmitted,
        conversionRate: formFocus > 0 ? (signupSubmitted / formFocus) * 100 : null,
        dropOff: formFocus > 0 ? formFocus - signupSubmitted : null,
        dropOffRate: formFocus > 0 ? ((formFocus - signupSubmitted) / formFocus) * 100 : null,
      },
      {
        type: FunnelEventType.REFERRAL_SHARED,
        label: 'Referral Link Shared',
        count: referralShared,
        conversionRate: signupSubmitted > 0 ? (referralShared / signupSubmitted) * 100 : null,
        dropOff: signupSubmitted > 0 ? signupSubmitted - referralShared : null,
        dropOffRate: signupSubmitted > 0 ? ((signupSubmitted - referralShared) / signupSubmitted) * 100 : null,
      },
    ];

    // 9. Calculate overall metrics
    const overallSignupConversion = signupSubmitted > 0 ? (signupSubmitted / pageVisits) * 100 : null;
    const referralShareRate = signupSubmitted > 0 ? (referralShared / signupSubmitted) * 100 : null;

    return {
      pageVisits,
      formFocus,
      signupSubmitted,
      referralShared,
      overallSignupConversion: overallSignupConversion !== null ? Number(overallSignupConversion.toFixed(2)) : null,
      referralShareRate: referralShareRate !== null ? Number(referralShareRate.toFixed(2)) : null,
      steps,
    };
  }

  // ─────────────────────────────────────────────
  // Growth Velocity Analytics
  // ─────────────────────────────────────────────

  async getGrowthVelocity(
    waitlistId: string | undefined,
    userId: string,
    from?: Date,
    to?: Date,
  ): Promise<GrowthVelocityResponse> {
    const waitlistIds = await this.getAuthorizedWaitlistIds(userId, waitlistId);

    // 2. Build date filters
    const dateFilter: Prisma.GrowthTimeseriesWhereInput = {
      waitlistId: { in: waitlistIds },
      ...(from || to ? { periodStart: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
    };

    const spikeFilter: Prisma.ReferralSpikeWhereInput = {
      waitlistId: { in: waitlistIds },
      ...(from || to ? { startAt: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
    };

    // 3. Fetch hourly data
    const hourlyData = await this.prisma.growthTimeseries.groupBy({
      by: ['periodStart'],
      where: { ...dateFilter, periodType: GrowthPeriodType.HOUR },
      orderBy: { periodStart: 'asc' },
      _sum: { signupCount: true },
    });

    // 4. Fetch daily data
    const dailyData = await this.prisma.growthTimeseries.groupBy({
      by: ['periodStart'],
      where: { ...dateFilter, periodType: GrowthPeriodType.DAY },
      orderBy: { periodStart: 'asc' },
      _sum: { signupCount: true },
    });

    // 5. Fetch referral spikes
    const spikes = await this.prisma.referralSpike.findMany({
      where: spikeFilter,
      include: {
        referrer: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    // 6. Calculate summary metrics
    const totalSignups = dailyData.reduce((sum, record) => sum + (record._sum.signupCount ?? 0), 0);

    // Find peak hour (from hourly data)
    let peakHour: { timestamp: string; signupCount: number } | null = null;
    if (hourlyData.length > 0) {
      const maxHour = hourlyData.reduce((max, current) => 
        (current._sum.signupCount ?? 0) > (max._sum.signupCount ?? 0) ? current : max
      , hourlyData[0]);
      peakHour = {
        timestamp: maxHour.periodStart.toISOString(),
        signupCount: maxHour._sum.signupCount ?? 0,
      };
    }

    // 7. Format response
    return {
      hourly: hourlyData.map(record => ({
        timestamp: record.periodStart.toISOString(),
        signupCount: record._sum.signupCount ?? 0,
      })),
      daily: dailyData.map(record => ({
        timestamp: record.periodStart.toISOString(),
        signupCount: record._sum.signupCount ?? 0,
      })),
      spikes: spikes.map(spike => ({
        id: spike.id,
        referrerParticipantId: spike.referrerParticipantId,
        startAt: spike.startAt.toISOString(),
        endAt: spike.endAt.toISOString(),
        signupCount: spike.signupCount,
      })),
      summary: {
        totalSignups,
        peakHour,
        spikeCount: spikes.length,
      },
    };
  }
}
