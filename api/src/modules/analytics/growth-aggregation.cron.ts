import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { GrowthPeriodType } from '@prisma/client';

@Injectable()
export class GrowthAggregationCron {
  private readonly logger = new Logger(GrowthAggregationCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyAggregation() {
    this.logger.log('Running hourly growth aggregation cron job...');
    try {
      await this.aggregateGrowthData();
    } catch (error: any) {
      this.logger.error(`Error during hourly growth aggregation: ${error.message}`, error.stack);
    }
  }

  async aggregateGrowthData() {
    this.logger.log('Starting growth data aggregation...');

    // Get all unique waitlist IDs that have participants
    const waitlistIds = await this.prisma.participant.findMany({
      select: { waitlistId: true },
      distinct: ['waitlistId'],
    });

    for (const { waitlistId } of waitlistIds) {
      await this.aggregateWaitlistGrowth(waitlistId);
    }

    this.logger.log(`Completed growth aggregation for ${waitlistIds.length} waitlists`);
  }

  private async aggregateWaitlistGrowth(waitlistId: string) {
    // Aggregate hourly data
    await this.aggregateHourlyData(waitlistId);
    
    // Aggregate daily data (from hourly aggregates for correctness)
    await this.aggregateDailyDataFromHourly(waitlistId);
  }

  private async aggregateHourlyData(waitlistId: string) {
    // Get all unique hours for this waitlist's participant creation times
    const hours = await this.prisma.$queryRaw<Array<{ hour: Date }>>`
      SELECT DISTINCT date_trunc('hour', "createdAt" AT TIME ZONE 'UTC') as hour
      FROM "participants"
      WHERE "waitlistId" = ${waitlistId}
      ORDER BY hour DESC
    `;

    for (const { hour } of hours) {
      const periodStart = new Date(hour);
      const periodEnd = new Date(periodStart);
      periodEnd.setHours(periodEnd.getHours() + 1);

      // Count participants created in this hour
      const count = await this.prisma.participant.count({
        where: {
          waitlistId,
          createdAt: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
      });

      // Upsert into growth_timeseries (idempotent)
      await this.prisma.growthTimeseries.upsert({
        where: {
          waitlistId_periodStart_periodType: {
            waitlistId,
            periodStart,
            periodType: GrowthPeriodType.HOUR,
          },
        },
        update: {
          signupCount: count,
        },
        create: {
          waitlistId,
          periodStart,
          periodType: GrowthPeriodType.HOUR,
          signupCount: count,
        },
      });
    }
  }

  private async aggregateDailyDataFromHourly(waitlistId: string) {
    // Get all unique dates from hourly aggregates
    const dates = await this.prisma.growthTimeseries.findMany({
      where: {
        waitlistId,
        periodType: GrowthPeriodType.HOUR,
      },
      select: {
        periodStart: true,
      },
      distinct: ['periodStart'],
      orderBy: { periodStart: 'desc' },
    });

    for (const { periodStart } of dates) {
      const date = new Date(periodStart);
      date.setHours(0, 0, 0, 0); // Normalize to start of day

      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Sum hourly counts for this day
      const hourlyData = await this.prisma.growthTimeseries.findMany({
        where: {
          waitlistId,
          periodType: GrowthPeriodType.HOUR,
          periodStart: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      const totalSignups = hourlyData.reduce((sum, record) => sum + record.signupCount, 0);

      // Upsert into growth_timeseries (idempotent)
      await this.prisma.growthTimeseries.upsert({
        where: {
          waitlistId_periodStart_periodType: {
            waitlistId,
            periodStart: startOfDay,
            periodType: GrowthPeriodType.DAY,
          },
        },
        update: {
          signupCount: totalSignups,
        },
        create: {
          waitlistId,
          periodStart: startOfDay,
          periodType: GrowthPeriodType.DAY,
          signupCount: totalSignups,
        },
      });
    }
  }

  /**
   * Backfill historical data for a specific waitlist
   * This can be called manually or via a script to populate data for existing participants
   */
  async backfillWaitlistGrowth(waitlistId: string) {
    this.logger.log(`Starting backfill for waitlist ${waitlistId}...`);
    
    // Clear existing growth data for this waitlist to avoid duplicates
    await this.prisma.growthTimeseries.deleteMany({
      where: { waitlistId },
    });

    // Re-aggregate from scratch
    await this.aggregateWaitlistGrowth(waitlistId);
    
    this.logger.log(`Backfill completed for waitlist ${waitlistId}`);
  }
}
