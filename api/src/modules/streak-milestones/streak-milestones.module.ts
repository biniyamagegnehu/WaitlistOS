import { Module } from '@nestjs/common';
import { StreakMilestonesService } from './streak-milestones.service';
import { StreakMilestonesController } from './streak-milestones.controller';

@Module({
  controllers: [StreakMilestonesController],
  providers: [StreakMilestonesService],
  exports: [StreakMilestonesService],
})
export class StreakMilestonesModule {}
