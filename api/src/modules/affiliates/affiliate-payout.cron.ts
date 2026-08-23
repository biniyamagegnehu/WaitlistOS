import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AffiliatePayoutsService } from './services/affiliate-payouts.service';

/**
 * Monthly payout cron job.
 * Runs on the 1st of every month at 02:00 UTC.
 * Safe to execute multiple times — full idempotency via DB uniqueness constraints.
 */
@Injectable()
export class AffiliatePayoutCron {
  private readonly logger = new Logger(AffiliatePayoutCron.name);

  constructor(private readonly payoutsService: AffiliatePayoutsService) {}

  @Cron('0 2 1 * *') // 02:00 UTC on the 1st of every month
  async handleMonthlyPayouts() {
    this.logger.log('[AffiliateCron] Starting monthly payout run...');
    try {
      const result = await this.payoutsService.processMonthlyPayouts();
      this.logger.log(
        `[AffiliateCron] Payout run complete. Attempted: ${result.attempted}, Succeeded: ${result.succeeded}, Failed: ${result.failed}, Skipped: ${result.skipped}`,
      );
    } catch (err) {
      this.logger.error('[AffiliateCron] Monthly payout run failed with error', err);
    }
  }
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // 00:00 UTC daily
  async handleDailySettlements() {
    this.logger.log('[AffiliateCron] Starting daily settlement run...');
    try {
      await this.payoutsService.processSettlements();
      this.logger.log('[AffiliateCron] Daily settlement run complete.');
    } catch (err) {
      this.logger.error('[AffiliateCron] Daily settlement run failed with error', err);
    }
  }
}
