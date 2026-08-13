import { TrafficSource } from '@prisma/client';

const aliases: Record<string, TrafficSource> = {
  twitter: TrafficSource.TWITTER, x: TrafficSource.TWITTER, 'x.com': TrafficSource.TWITTER, 'twitter.com': TrafficSource.TWITTER,
  whatsapp: TrafficSource.WHATSAPP, instagram: TrafficSource.INSTAGRAM, facebook: TrafficSource.FACEBOOK,
  linkedin: TrafficSource.LINKEDIN, email: TrafficSource.EMAIL, producthunt: TrafficSource.PRODUCT_HUNT, 'product-hunt': TrafficSource.PRODUCT_HUNT,
  telegram: TrafficSource.TELEGRAM, 't.me': TrafficSource.TELEGRAM, 'telegram.org': TrafficSource.TELEGRAM,
  direct: TrafficSource.DIRECT,
};

export function resolveTrafficSource(source?: string | null, referrer?: string | null): TrafficSource {
  const normalized = source?.trim().toLowerCase();
  if (normalized) return aliases[normalized] ?? (Object.values(TrafficSource).includes(source as TrafficSource) ? source as TrafficSource : TrafficSource.UNKNOWN);
  return referrer?.trim() ? TrafficSource.UNKNOWN : TrafficSource.DIRECT;
}

export function sanitizeAttributionValue(value?: string | null): string | null {
  const normalized = value?.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  return normalized ? normalized.slice(0, 100) : null;
}
