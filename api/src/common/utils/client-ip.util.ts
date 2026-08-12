import { isIP } from 'node:net';
import type { Request } from 'express';

const PROVIDER_IP_HEADERS = [
  'cf-connecting-ip',
  'true-client-ip',
  'x-real-ip',
] as const;

const COUNTRY_HEADERS = ['cf-ipcountry', 'x-vercel-ip-country'] as const;

function firstHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) value = value[0];
  if (!value) return null;

  const candidate = value.split(',')[0]?.trim();
  return candidate || null;
}

/**
 * Normalizes a proxy header to an IP address that MaxMind can query.
 */
export function normalizeClientIp(value: string | null | undefined): string | null {
  if (!value) return null;

  let ip = value.trim();
  if (ip.startsWith('[') && ip.endsWith(']')) {
    ip = ip.slice(1, -1);
  }

  // Express and some proxies report IPv4 addresses in IPv6-mapped notation.
  if (ip.toLowerCase().startsWith('::ffff:')) {
    ip = ip.slice('::ffff:'.length);
  }

  return isIP(ip) ? ip : null;
}

/**
 * Gets the originating visitor address from common reverse-proxy headers.
 * The endpoint only uses this value for analytics, never authorization.
 */
export function getClientIp(request: Request): string | null {
  for (const name of PROVIDER_IP_HEADERS) {
    const ip = normalizeClientIp(firstHeaderValue(request.headers[name]));
    if (ip) return ip;
  }

  const forwardedIp = normalizeClientIp(
    firstHeaderValue(request.headers['x-forwarded-for']),
  );
  if (forwardedIp) return forwardedIp;

  return normalizeClientIp(request.ip);
}

/**
 * CDN country headers avoid a database lookup when the deployment provides one.
 */
export function getProxyCountryCode(request: Request): string | null {
  for (const name of COUNTRY_HEADERS) {
    const value = firstHeaderValue(request.headers[name])?.toUpperCase();
    if (value && /^[A-Z]{2}$/.test(value) && value !== 'XX') return value;
  }

  return null;
}
