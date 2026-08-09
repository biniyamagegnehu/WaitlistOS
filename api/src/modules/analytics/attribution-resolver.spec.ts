import { TrafficSource } from '@prisma/client';
import { AttributionResolver } from './attribution-resolver';

describe('AttributionResolver', () => {
  it('should prioritize UTM source over referrer', () => {
    const result = AttributionResolver.resolve({
      utmSource: 'twitter',
      referrer: 'https://instagram.com',
    });
    expect(result.source).toBe(TrafficSource.TWITTER);
  });

  it('should normalize known UTM sources', () => {
    expect(AttributionResolver.resolve({ utmSource: 'x' }).source).toBe(TrafficSource.TWITTER);
    expect(AttributionResolver.resolve({ utmSource: 'whatsapp' }).source).toBe(TrafficSource.WHATSAPP);
    expect(AttributionResolver.resolve({ utmSource: 'instagram' }).source).toBe(TrafficSource.INSTAGRAM);
    expect(AttributionResolver.resolve({ utmSource: 'linkedin' }).source).toBe(TrafficSource.LINKEDIN);
    expect(AttributionResolver.resolve({ utmSource: 'producthunt' }).source).toBe(TrafficSource.PRODUCT_HUNT);
    expect(AttributionResolver.resolve({ utmSource: 'email' }).source).toBe(TrafficSource.EMAIL);
    expect(AttributionResolver.resolve({ utmSource: 'unknown-platform' }).source).toBe(TrafficSource.OTHER);
  });

  it('should parse known referrers if no UTM', () => {
    expect(AttributionResolver.resolve({ referrer: 'https://twitter.com/post' }).source).toBe(TrafficSource.TWITTER);
    expect(AttributionResolver.resolve({ referrer: 'https://x.com/post' }).source).toBe(TrafficSource.TWITTER);
    expect(AttributionResolver.resolve({ referrer: 'https://l.instagram.com/' }).source).toBe(TrafficSource.INSTAGRAM);
    expect(AttributionResolver.resolve({ referrer: 'https://google.com/search' }).source).toBe(TrafficSource.GOOGLE);
    expect(AttributionResolver.resolve({ referrer: 'https://google.co.uk/' }).source).toBe(TrafficSource.GOOGLE);
  });

  it('should return DIRECT if no UTM and no referrer', () => {
    expect(AttributionResolver.resolve({}).source).toBe(TrafficSource.DIRECT);
  });

  it('should return UNKNOWN for invalid URLs as referrer', () => {
    expect(AttributionResolver.resolve({ referrer: 'invalid-url' }).source).toBe(TrafficSource.UNKNOWN);
  });
});
