import type { Request } from 'express';
import {
  getClientIp,
  getProxyCountryCode,
  normalizeClientIp,
} from './client-ip.util';

function request(headers: Record<string, string> = {}, ip = '10.0.0.1'): Request {
  return { headers, ip } as Request;
}

describe('client IP utilities', () => {
  it('normalizes IPv4-mapped IPv6 addresses', () => {
    expect(normalizeClientIp('::ffff:8.8.8.8')).toBe('8.8.8.8');
  });

  it('uses the original client in a forwarded-for chain', () => {
    expect(
      getClientIp(request({ 'x-forwarded-for': '8.8.8.8, 10.0.0.2' })),
    ).toBe('8.8.8.8');
  });

  it('prefers a provider-provided client address', () => {
    expect(
      getClientIp(
        request({ 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '8.8.8.8' }),
      ),
    ).toBe('1.1.1.1');
  });

  it('uses CDN country headers when available', () => {
    expect(getProxyCountryCode(request({ 'cf-ipcountry': 'et' }))).toBe('ET');
    expect(getProxyCountryCode(request({ 'cf-ipcountry': 'XX' }))).toBeNull();
  });
});
