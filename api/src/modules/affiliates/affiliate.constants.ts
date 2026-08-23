/**
 * Affiliate Program configuration constants.
 * Centralised here so they are never hardcoded throughout the codebase.
 */

/** Default commission rate for all affiliates (20%). */
export const AFFILIATE_DEFAULT_COMMISSION_RATE = 0.20;

/** Number of months a referred founder generates recurring commissions. */
export const AFFILIATE_COMMISSION_DURATION_MONTHS = 12;

/** Attribution cookie lifetime in days. */
export const AFFILIATE_ATTRIBUTION_COOKIE_DAYS = 30;

/** Name of the HTTP-only attribution cookie. */
export const AFFILIATE_ATTRIBUTION_COOKIE_NAME = 'aff_attr';

/**
 * Minimum payout threshold in the payout currency.
 * Affiliates must have at least this much ELIGIBLE balance to receive a payout.
 */
export const AFFILIATE_MINIMUM_PAYOUT_AMOUNT = 50;

/** Batch size for the monthly payout cron job. */
export const AFFILIATE_PAYOUT_BATCH_SIZE = 50;
