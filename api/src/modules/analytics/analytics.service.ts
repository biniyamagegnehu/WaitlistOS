import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrafficSource, Prisma } from '@prisma/client';

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

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSourceAnalytics(
    waitlistId: string,
    userId: string,
    from?: Date,
    to?: Date,
  ): Promise<AnalyticsResponse> {
    // 1. Enforce ownership
    const waitlist = await this.prisma.waitlist.findUnique({
      where: { id: waitlistId },
      include: { founder: true },
    });

    if (!waitlist) throw new NotFoundException('Waitlist not found');
    if (waitlist.founder.userId !== userId) throw new UnauthorizedException('Access denied');

    // 2. Build date filters
    const visitWhere: Prisma.AttributionVisitWhereInput = {
      waitlistId,
      ...(from || to ? { timestamp: { ...(from && { gte: from }), ...(to && { lte: to }) } } : {}),
    };

    const signupWhere: Prisma.ParticipantWhereInput = {
      waitlistId,
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
      return existingVisit;
    }

    return this.prisma.attributionVisit.create({
      data: {
        waitlistId: waitlist.id,
        sessionId,
        source,
        medium,
        campaign,
      },
    });
  }
}
