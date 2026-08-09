export type TrafficSource =
  | 'DIRECT'
  | 'TWITTER'
  | 'WHATSAPP'
  | 'INSTAGRAM'
  | 'EMAIL'
  | 'PRODUCT_HUNT'
  | 'LINKEDIN'
  | 'FACEBOOK'
  | 'GOOGLE'
  | 'OTHER'
  | 'UNKNOWN';

export interface AttributionInput {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
}

export interface ResolvedAttribution {
  source: TrafficSource;
  medium?: string;
  campaign?: string;
  referrer?: string;
}

export class AttributionResolver {
  static resolve(input: AttributionInput): ResolvedAttribution {
    const { utmSource, utmMedium, utmCampaign, referrer } = input;

    let source: TrafficSource = 'DIRECT';

    if (utmSource) {
      source = this.normalizeSource(utmSource);
    } else if (referrer) {
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
    if (!s) return 'OTHER';

    if (s.includes('twitter') || s === 'x' || s === 'x.com') return 'TWITTER';
    if (s.includes('whatsapp')) return 'WHATSAPP';
    if (s.includes('instagram')) return 'INSTAGRAM';
    if (s.includes('linkedin') || s === 'lnkd.in') return 'LINKEDIN';
    if (s.includes('facebook') || s === 'fb') return 'FACEBOOK';
    if (s.includes('google')) return 'GOOGLE';
    if (s.includes('producthunt') || s === 'product-hunt') return 'PRODUCT_HUNT';
    if (s === 'email') return 'EMAIL';

    return 'OTHER';
  }

  private static normalizeReferrer(referrer: string): TrafficSource {
    try {
      const url = new URL(referrer);
      const host = url.hostname.toLowerCase();

      if (host.includes('twitter.com') || host === 't.co' || host.includes('x.com')) return 'TWITTER';
      if (host.includes('whatsapp.com')) return 'WHATSAPP';
      if (host.includes('instagram.com') || host === 'l.instagram.com') return 'INSTAGRAM';
      if (host.includes('linkedin.com') || host === 'lnkd.in') return 'LINKEDIN';
      if (host.includes('facebook.com') || host === 'm.facebook.com') return 'FACEBOOK';
      if (host.includes('google.')) return 'GOOGLE';
      if (host.includes('producthunt.com')) return 'PRODUCT_HUNT';

      return 'OTHER';
    } catch {
      return 'UNKNOWN';
    }
  }
}
