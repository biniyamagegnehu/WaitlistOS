import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EngagementService } from './engagement.service';

@Injectable()
export class EngagementCron {
  private readonly logger = new Logger(EngagementCron.name);

  constructor(private readonly engagementService: EngagementService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyEvaluation() {
    this.logger.log('Running daily engagement evaluation cron job...');
    try {
      await this.engagementService.evaluateAllParticipants();
    } catch (error: any) {
      this.logger.error(`Error during daily engagement evaluation: ${error.message}`, error.stack);
    }
  }
}
