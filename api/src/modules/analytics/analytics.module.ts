import { Module } from '@nestjs/common';
import { AnalyticsController, FunnelAnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { GeoLocationService } from './geo-location.service';
import { DeviceDetectionService } from './device-detection.service';
import { FunnelAggregationCron } from './funnel-aggregation.cron';
import { PrismaModule } from '../../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [AnalyticsController, FunnelAnalyticsController],
  providers: [AnalyticsService, GeoLocationService, DeviceDetectionService, FunnelAggregationCron],
  exports: [AnalyticsService, GeoLocationService, DeviceDetectionService],
})
export class AnalyticsModule {}
