import { TrafficSource } from '@prisma/client';

export interface AttributionInput {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
}

export interface ResolvedAttribution {
  source: TrafficSource;
  medium?: string;
  campaign?: string;
  referrer?: string;
}

export class AttributionResolver {
  /**
   * Resolves traffic source according to business rules.
   * Priority: UTM > Referrer > Direct > Unknown
   */
  static resolve(input: AttributionInput): ResolvedAttribution {
    const { utmSource, utmMedium, utmCampaign, referrer } = input;

    let source: TrafficSource = TrafficSource.DIRECT;

    // 1. UTM takes precedence
    if (utmSource) {
      source = this.normalizeSource(utmSource);
    } 
    // 2. Referrer fallback
    else if (referrer) {
      source = this.normalizeReferrer(referrer);
    }

    return {
      source,
      medium: utmMedium?.trim() || undefined,
      campaign: utmCampaign?.trim() || undefined,
      referrer: referrer?.trim() || undefined,
    };
  }

  private static normalizeSource(rawSource: string): TrafficSource {
    const s = rawSource.trim().toLowerCase();
    if (!s) return TrafficSource.OTHER;

    if (s.includes('twitter') || s === 'x' || s === 'x.com') return TrafficSource.TWITTER;
    if (s.includes('whatsapp')) return TrafficSource.WHATSAPP;
    if (s.includes('instagram')) return TrafficSource.INSTAGRAM;
    if (s.includes('linkedin') || s === 'lnkd.in') return TrafficSource.LINKEDIN;
    if (s.includes('facebook') || s === 'fb') return TrafficSource.FACEBOOK;
    if (s.includes('google')) return TrafficSource.GOOGLE;
    if (s.includes('producthunt') || s === 'product-hunt') return TrafficSource.PRODUCT_HUNT;
    if (s === 'email') return TrafficSource.EMAIL;

    return TrafficSource.OTHER;
  }

  private static normalizeReferrer(referrer: string): TrafficSource {
    try {
      const url = new URL(referrer);
      const host = url.hostname.toLowerCase();

      if (host.includes('twitter.com') || host === 't.co' || host.includes('x.com')) return TrafficSource.TWITTER;
      if (host.includes('whatsapp.com')) return TrafficSource.WHATSAPP;
      if (host.includes('instagram.com')) return TrafficSource.INSTAGRAM;
      if (host.includes('linkedin.com') || host === 'lnkd.in') return TrafficSource.LINKEDIN;
      if (host.includes('facebook.com')) return TrafficSource.FACEBOOK;
      if (host.includes('google.')) return TrafficSource.GOOGLE;
      if (host.includes('producthunt.com')) return TrafficSource.PRODUCT_HUNT;

      return TrafficSource.OTHER;
    } catch {
      // Invalid URL or malformed referrer
      return TrafficSource.UNKNOWN;
    }
  }
}
