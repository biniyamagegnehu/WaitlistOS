import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { GeoLocationService } from './geo-location.service';
import { DeviceDetectionService } from './device-detection.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, GeoLocationService, DeviceDetectionService],
  exports: [AnalyticsService, GeoLocationService, DeviceDetectionService],
})
export class AnalyticsModule {}
