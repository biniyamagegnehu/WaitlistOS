import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { FunnelEventType } from '@prisma/client';

@Injectable()
export class FunnelAggregationCron {
  private readonly logger = new Logger(FunnelAggregationCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyAggregation() {
    this.logger.log('Running daily funnel aggregation cron job...');
    try {
      await this.aggregateFunnelEvents();
    } catch (error: any) {
      this.logger.error(`Error during daily funnel aggregation: ${error.message}`, error.stack);
    }
  }

  async aggregateFunnelEvents() {
    this.logger.log('Starting funnel events aggregation...');

    // Get all unique waitlist IDs that have funnel events
    const waitlistIds = await this.prisma.funnelEvent.findMany({
      select: { waitlistId: true },
      distinct: ['waitlistId'],
    });

    for (const { waitlistId } of waitlistIds) {
      await this.aggregateWaitlistFunnel(waitlistId);
    }

    this.logger.log(`Completed funnel aggregation for ${waitlistIds.length} waitlists`);
  }

  private async aggregateWaitlistFunnel(waitlistId: string) {
    // Get all unique dates for this waitlist's funnel events
    const dates = await this.prisma.funnelEvent.findMany({
      where: { waitlistId },
      select: {
        createdAt: true,
      },
      distinct: ['createdAt'],
      orderBy: { createdAt: 'desc' },
    });

    for (const { createdAt } of dates) {
      const date = new Date(createdAt);
      date.setHours(0, 0, 0, 0); // Normalize to start of day

      // Aggregate each event type for this date
      const eventTypes = Object.values(FunnelEventType);
      
      for (const eventType of eventTypes) {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Count events for this waitlist, date, and event type
        const count = await this.prisma.funnelEvent.count({
          where: {
            waitlistId,
            eventType,
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        // Upsert into daily_funnel_stats (idempotent)
        await this.prisma.dailyFunnelStats.upsert({
          where: {
            waitlistId_date_eventType: {
              waitlistId,
              date: startOfDay,
              eventType,
            },
          },
          update: {
            count,
          },
          create: {
            waitlistId,
            date: startOfDay,
            eventType,
            count,
          },
        });
      }
    }
  }
}
