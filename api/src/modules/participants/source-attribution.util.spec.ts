import { TrafficSource } from '@prisma/client';
import { resolveTrafficSource, sanitizeAttributionValue } from './source-attribution.util';

describe('source attribution', () => {
  it.each([
    ['twitter', TrafficSource.TWITTER],
    ['x', TrafficSource.TWITTER],
    ['x.com', TrafficSource.TWITTER],
    ['whatsapp', TrafficSource.WHATSAPP],
    ['producthunt', TrafficSource.PRODUCT_HUNT],
    ['telegram', TrafficSource.TELEGRAM],
  ])('normalizes %s', (input, expected) => {
    expect(resolveTrafficSource(input)).toBe(expected);
  });

  it('uses DIRECT without any source signal and UNKNOWN for an unsupported source', () => {
    expect(resolveTrafficSource()).toBe(TrafficSource.DIRECT);
    expect(resolveTrafficSource('untrusted-source')).toBe(TrafficSource.UNKNOWN);
  });

  it('removes controls and limits attribution values', () => {
    expect(sanitizeAttributionValue(' launch\n')).toBe('launch');
    expect(sanitizeAttributionValue('x'.repeat(101))).toHaveLength(100);
  });
});
