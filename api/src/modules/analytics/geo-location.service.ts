import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as maxmind from 'maxmind';
import { CountryResponse } from 'maxmind';

@Injectable()
export class GeoLocationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GeoLocationService.name);
  private lookup: maxmind.Reader<CountryResponse> | null = null;

  constructor(private readonly configService: ConfigService) {}

  private readonly devFakeIp = process.env.NODE_ENV !== 'production'
    ? (process.env.DEV_FAKE_IP ?? null)
    : null;

  async onModuleInit() {
    const dbPath = this.configService.get<string>('MAXMIND_DB_PATH');
    
    if (!dbPath) {
      this.logger.warn('MAXMIND_DB_PATH is not set in the environment. GeoLocation features will be disabled (resolving to UNKNOWN).');
      return;
    }

    try {
      this.lookup = await maxmind.open<CountryResponse>(dbPath);
      this.logger.log(`Successfully loaded MaxMind GeoLite2 database from ${dbPath}`);
    } catch (error) {
      this.logger.error(`Failed to load MaxMind GeoLite2 database at ${dbPath}. GeoLocation features will be disabled. Error: ${(error as Error).message}`);
      this.lookup = null;
    }
  }

  onModuleDestroy() {
    this.lookup = null;
  }

  /**
   * Resolves an IP address to a two-letter ISO 3166-1 alpha-2 country code.
   * Returns null if the lookup fails, if the IP is private/local, or if the database is unavailable.
   */
  resolveCountry(ip: string | undefined | null): string | null {
    if (!this.lookup) {
      return null;
    }

    // In development, allow overriding the IP for testing geo features
    const effectiveIp = this.devFakeIp ?? ip;

    if (!effectiveIp) {
      return null;
    }

    // Ignore loopback addresses
    if (
      effectiveIp === '127.0.0.1' ||
      effectiveIp === '::1' ||
      effectiveIp === '::ffff:127.0.0.1'
    ) {
      return null;
    }

    try {
      if (!maxmind.validate(effectiveIp)) {
        return null;
      }

      const result = this.lookup.get(effectiveIp);
      
      if (result && result.country && result.country.iso_code) {
        return result.country.iso_code;
      }
      
      if (result && result.registered_country && result.registered_country.iso_code) {
        return result.registered_country.iso_code;
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`Failed to resolve country for IP: ${effectiveIp}. Error: ${(error as Error).message}`);
      return null;
    }
  }
}
